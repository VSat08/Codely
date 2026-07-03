import './Toast.css';

/**
 * Toast notification — auto-dismissed.
 */
function Toast({ message, type = 'info', offset = 0 }) {
  // Cap the offset so toasts don't shrink into infinity
  const boundedOffset = Math.min(offset, 4);

  return (
    <div 
      className={`toast toast-${type}`} 
      style={{
        '--toast-offset': boundedOffset,
        zIndex: 100 - boundedOffset,
      }}
    >
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
