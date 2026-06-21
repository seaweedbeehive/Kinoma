import type { Show } from '../api/types';

type Flags = Show['flags'];

const LANGUAGE_LABELS: Record<string, string> = {
  OV: 'Originalversion',
  OmU: 'Original mit Untertiteln',
  OmeU: 'Original mit engl. Untertiteln',
  DF: 'Deutsch',
};

function normalizeFlagCode(code?: string): string {
  return (code || '').trim().toUpperCase();
}

function findFlagByCode(flags: Flags, code: string): boolean {
  const target = code.toUpperCase();
  return flags.some((flag) => normalizeFlagCode(flag.code) === target);
}

function findFlagByName(flags: Flags, name: string): boolean {
  const target = name.toLowerCase();
  return flags.some((flag) => (flag.name || '').toLowerCase() === target);
}

/**
 * Parse language-related flags from a show's flag list.
 */
export function parseLanguageFlags(flags: Flags): {
  isOV: boolean;
  isOmU: boolean;
  isOmeU: boolean;
  isSubtitled: boolean;
  isDubbed: boolean;
  languageLabel: string;
} {
  const isOV = findFlagByCode(flags, 'OV');
  const isOmU = findFlagByCode(flags, 'OmU');
  const isOmeU = findFlagByCode(flags, 'OmeU');
  const isDF = findFlagByCode(flags, 'DF');

  const isSubtitled = isOmU || isOmeU || findFlagByName(flags, 'untertitel');
  const isDubbed = isDF || findFlagByName(flags, 'deutsch');

  let languageLabel = 'Originalversion';
  if (isOmeU) languageLabel = LANGUAGE_LABELS.OmeU;
  else if (isOmU) languageLabel = LANGUAGE_LABELS.OmU;
  else if (isDF) languageLabel = LANGUAGE_LABELS.DF;

  return {
    isOV,
    isOmU,
    isOmeU,
    isSubtitled,
    isDubbed,
    languageLabel,
  };
}

/**
 * Check whether a show has a 3D flag.
 */
export function has3D(flags: Flags): boolean {
  return (
    findFlagByCode(flags, '3D') ||
    findFlagByName(flags, '3d') ||
    findFlagByName(flags, 'three dimensional')
  );
}

/**
 * Build a list of human-readable badge labels from a show's flags.
 */
export function getFlagBadges(flags: Flags): string[] {
  const badges: string[] = [];
  const { isOV, isOmU, isOmeU, isDubbed, languageLabel } =
    parseLanguageFlags(flags);

  if (isOmeU) badges.push('OmeU');
  else if (isOmU) badges.push('OmU');
  else if (isOV) badges.push('OV');
  else if (isDubbed) badges.push('DF');
  else if (languageLabel) badges.push(languageLabel);

  if (has3D(flags)) badges.push('3D');

  const knownLanguageCodes = new Set(['OV', 'OMU', 'OMEU', 'DF']);

  flags.forEach((flag) => {
    const code = normalizeFlagCode(flag.code);
    const name = flag.name || '';

    // Skip language codes already handled above and empty values.
    if (!code && !name) return;
    if (code && knownLanguageCodes.has(code)) return;
    if (code === '3D') return;

    const label = name || code;
    if (!badges.includes(label)) badges.push(label);
  });

  return badges;
}
