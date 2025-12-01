import React from 'react';
import { ShoppingCart, Bell } from 'lucide-react';

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
    <header className="flex items-center justify-between px-4 py-6 md:px-6 lg:px-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Hello, {displayName}
        </h1>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        {/* Cart Icon */}
        <button
          onClick={onCartClick}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Shopping cart"
        >
          <ShoppingCart className="w-6 h-6 text-gray-700" />
        </button>

        {/* Notification Icon */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-red-500 rounded-full"
              aria-label={`${notificationCount} unread notifications`}
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
