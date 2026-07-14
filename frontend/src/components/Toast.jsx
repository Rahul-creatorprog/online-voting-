import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <div>{message}</div>
    </div>
  );
};

export default Toast;
