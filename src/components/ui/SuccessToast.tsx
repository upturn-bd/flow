export default function SuccessToast({ message }: { message: string }) {
              // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-success/10 text-success px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
            notification.innerHTML = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('animate-fade-out');
                setTimeout(() => document.body.removeChild(notification), 500);
            }, 3000);
}