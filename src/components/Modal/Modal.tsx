import { useEffect, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!isOpen && dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="movie-modal"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={handleClick}
      onClose={onClose}
    >
      <div ref={contentRef} className="movie-modal__content">
        <button
          type="button"
          className="movie-modal__close"
          onClick={onClose}
          aria-label="Schließen"
        >
          ×
        </button>
        {title && (
          <h2 id="modal-title" className="movie-modal__title">
            {title}
          </h2>
        )}
        {children}
      </div>
    </dialog>
  );
}
