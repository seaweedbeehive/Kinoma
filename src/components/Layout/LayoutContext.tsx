/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface LayoutContextValue {
  sidebar: ReactNode | null;
  setSidebar: (node: ReactNode | null) => void;
  isMobileFilterOpen: boolean;
  openMobileFilter: () => void;
  closeMobileFilter: () => void;
}

export const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<ReactNode | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const openMobileFilter = useCallback(() => setIsMobileFilterOpen(true), []);
  const closeMobileFilter = useCallback(() => setIsMobileFilterOpen(false), []);

  return (
    <LayoutContext.Provider
      value={{
        sidebar,
        setSidebar,
        isMobileFilterOpen,
        openMobileFilter,
        closeMobileFilter,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}


