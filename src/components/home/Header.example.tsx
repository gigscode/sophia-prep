/**
 * Example usage of the Header component
 * 
 * This file demonstrates how to use the Header component in different scenarios.
 */

import { Header } from './Header';

// Example 1: Logged in user with name
export function LoggedInHeaderExample() {
  return (
    <Header
      userName="John Doe"
      userEmail="john.doe@example.com"
      isLoggedIn={true}
      onCartClick={() => console.log('Cart clicked')}
      onNotificationClick={() => console.log('Notifications clicked')}
      notificationCount={5}
    />
  );
}

// Example 2: Guest user (not logged in)
export function GuestHeaderExample() {
  return (
    <Header
      isLoggedIn={false}
      onCartClick={() => console.log('Cart clicked')}
      onNotificationClick={() => console.log('Notifications clicked')}
      notificationCount={0}
    />
  );
}

// Example 3: Logged in user with many notifications
export function ManyNotificationsExample() {
  return (
    <Header
      userName="Jane Smith"
      userEmail="jane.smith@example.com"
      isLoggedIn={true}
      onCartClick={() => console.log('Cart clicked')}
      onNotificationClick={() => console.log('Notifications clicked')}
      notificationCount={150}
    />
  );
}

// Example 4: Integration with useAuth hook
import { useAuth } from '../../hooks/useAuth';

export function HeaderWithAuthExample() {
  const { user } = useAuth();
  
  const handleCartClick = () => {
    // Navigate to cart page or open cart modal
    console.log('Navigate to cart');
  };
  
  const handleNotificationClick = () => {
    // Navigate to notifications page or open notifications panel
    console.log('Open notifications');
  };
  
  return (
    <Header
      userName={user?.name}
      userEmail={user?.email}
      isLoggedIn={!!user}
      onCartClick={handleCartClick}
      onNotificationClick={handleNotificationClick}
      notificationCount={3} // This would come from your notification state/API
    />
  );
}
