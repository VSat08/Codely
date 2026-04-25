import './Toast.css';

/**
 * Toast notification — auto-dismissed.
 */
function Toast({ message, type = 'info' }) {
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon material-symbols-outlined" style={{fontSize: '18px'}}>
        {type === 'success' && 'check_circle'}
        {type === 'error' && 'error'}
        {type === 'info' && 'info'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;
