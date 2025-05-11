import NotificationItem from './NotificationItem';

export default function NotificationsTab() {
  const notifications = [
    { id: 1, message: "Your profile has been updated successfully." },
    { id: 2, message: "You have a new friend request." },
    { id: 3, message: "Your password was changed recently." },
  ];

  return (
    <div className="text-gray-700 text-center">
      <h2 className="text-lg font-semibold mb-2">Notifications</h2>
      {notifications.length > 0 ? (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} message={notification.message} />
          ))}
        </ul>
      ) : (
        <p>No notifications yet.</p>
      )}
    </div>
  );
}