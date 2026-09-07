import Icon from './Icon';

// Reemplazo con la identidad visual del sistema para el confirm() nativo del
// navegador. Se monta una sola vez vía <ConfirmProvider> (ver hooks/useConfirm)
// y cada pantalla lo dispara con el hook useConfirm(), no importando este
// componente directamente.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal-confirm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="confirm-body">
          <span className={danger ? 'confirm-icon confirm-icon--danger' : 'confirm-icon'}>
            <Icon name={danger ? 'basura' : 'aviso'} size={18} />
          </span>
          <div className="confirm-text">
            <h3 id="confirm-title">{title}</h3>
            {message && <p>{message}</p>}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button className={danger ? 'btn btn-danger-solid' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
