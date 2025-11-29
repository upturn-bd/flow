import { useState } from 'react';

interface NotificationItemProps {
  message: string;
}

export default function NotificationItem({ message }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(false);

  const handleMarkAsRead = () => {
    setIsRead(true);
  };

  return (
    <div className={`bg-background-tertiary dark:bg-surface-secondary p-3 rounded-md shadow-sm flex justify-between items-center ${isRead ? 'opacity-50' : ''}`}>
      <li>{message}</li>
      {!isRead && (
        <button
          onClick={handleMarkAsRead}
          className="ml-4 text-sm text-blue-500 hover:underline"
        >
          Mark as Read
        </button>
      )}
    </div>
  );
}
