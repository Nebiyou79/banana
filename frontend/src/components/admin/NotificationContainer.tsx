import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const NotificationContainer: React.FC = () => {
  const { state, dispatch } = useAdmin();

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {state.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            relative flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300
            ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
            ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
            ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
          `}
        >
          <div className="flex-1">
            <p className="font-semibold">{notification.title}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;