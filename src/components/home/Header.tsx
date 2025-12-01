import React from 'react';
import { ShoppingCart, Bell } from 'lucide-react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

interface HeaderProps {
  userName?: string;
  isLoggedIn: boolean;
  onCartClick: () => void;
  onNotificationClick: () => void;
  notificationCount?: number;
}

export function Header({
  userName,
  isLoggedIn,
  onCartClick,
  onNotificationClick,
  notificationCount = 0,
}: HeaderProps) {
  const displayName = isLoggedIn && userName ? userName : 'Guest';

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
        {/* Cart Icon */}
        <button
          onClick={onCartClick}
          onKeyDown={(e) => handleKeyboardActivation(e, onCartClick)}
          className="icon-button-touch-target relative rounded-full hover:bg-gray-100 transition-colors focus-visible-ring interactive-element"
          aria-label="Open shopping cart"
          aria-describedby="cart-description"
          type="button"
        >
          <ShoppingCart 
            className="w-6 h-6 text-gray-700" 
            aria-hidden="true"
          />
          <span id="cart-description" className="sr-only">
            Access your cart and manage purchases
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
