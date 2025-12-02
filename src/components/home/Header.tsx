import { User, Bell } from 'lucide-react';
import { handleKeyboardActivation } from '../../utils/accessibility';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  isLoggedIn: boolean;
  onCartClick: () => void;
  onNotificationClick: () => void;
  notificationCount?: number;
}

export function Header({
  userName,
  userEmail,
  isLoggedIn,
  onCartClick,
  onNotificationClick,
  notificationCount = 0,
}: HeaderProps) {
  // Extract first name only (before first space)
  const getFirstName = (fullName?: string) => {
    if (!fullName) return 'Guest';
    const firstName = fullName.split(' ')[0];
    return firstName || fullName;
  };
  
  const displayName = isLoggedIn && userName ? getFirstName(userName) : 'Guest';
  
  // Get first letter for avatar
  const getAvatarLetter = () => {
    if (isLoggedIn) {
      if (userName) return userName.charAt(0).toUpperCase();
      if (userEmail) return userEmail.charAt(0).toUpperCase();
    }
    return '';
  };
  
  const avatarLetter = getAvatarLetter();

  return (
    <header 
      className="flex items-center justify-between py-6"
      role="banner"
      aria-label="Page header"
    >
      {/* Greeting */}
      <div>
        <h1 
          className="text-3xl font-bold text-gray-800"
          id="page-greeting"
          aria-live="polite"
        >
          Hello, {displayName}
        </h1>
      </div>

      {/* Action Icons */}
      <div 
        className="flex items-center gap-2"
        role="toolbar"
        aria-label="Header actions"
      >
        {/* User Avatar */}
        <button
          onClick={onCartClick}
          onKeyDown={(e) => handleKeyboardActivation(e, onCartClick)}
          className="icon-button-touch-target relative rounded-full hover:bg-gray-100 transition-colors focus-visible-ring interactive-element"
          aria-label={isLoggedIn ? "Open user menu" : "Open user profile"}
          aria-describedby="user-avatar-description"
          type="button"
        >
          {isLoggedIn && avatarLetter ? (
            <div 
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm"
              aria-hidden="true"
            >
              {avatarLetter}
            </div>
          ) : (
            <User 
              className="w-6 h-6 text-gray-700" 
              aria-hidden="true"
            />
          )}
          <span id="user-avatar-description" className="sr-only">
            {isLoggedIn ? "Access your profile and settings" : "Sign in to your account"}
          </span>
        </button>

        {/* Notification Icon */}
        <button
          onClick={onNotificationClick}
          onKeyDown={(e) => handleKeyboardActivation(e, onNotificationClick)}
          className="icon-button-touch-target relative rounded-full hover:bg-gray-100 transition-colors focus-visible-ring interactive-element"
          aria-label={
            notificationCount > 0 
              ? `Notifications: ${notificationCount} unread`
              : "Open notifications"
          }
          aria-describedby="notifications-description"
          type="button"
        >
          <Bell 
            className="w-6 h-6 text-gray-700" 
            aria-hidden="true"
          />
          {notificationCount > 0 && (
            <>
              <span
                className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-red-500 rounded-full"
                aria-hidden="true"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
              <span className="sr-only">
                {notificationCount} unread notifications
              </span>
            </>
          )}
          <span id="notifications-description" className="sr-only">
            View your notifications and updates
          </span>
        </button>
      </div>

      {/* Live region for announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="header-announcements"
      />
    </header>
  );
}
