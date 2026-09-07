import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ConfirmContext = createContext(null);

// Un solo diálogo de confirmación montado en la raíz de la app (ver main.jsx)
// en vez de que cada pantalla arme el suyo. confirmar() se resuelve en true/false
// igual que el confirm() nativo, pero sin bloquear el hilo ni verse feo.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirmar = useCallback((opts) => {
    const {
      title = 'Confirmar',
      message = '',
      confirmLabel = 'Eliminar',
      cancelLabel = 'Cancelar',
      danger = true,
    } = typeof opts === 'string' ? { message: opts } : opts;

    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog({ title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const resolverCon = (resultado) => {
    resolver.current?.(resultado);
    resolver.current = null;
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onConfirm={() => resolverCon(true)}
          onCancel={() => resolverCon(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// Uso: const confirmar = useConfirm(); if (!(await confirmar({ title, message }))) return;
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}
