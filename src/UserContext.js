import { createContext, useContext } from 'react';

// The UserContext holds the authenticated user's session data and logout function.
// Shape of the context value provided by App.js:
//   {
//     user:   { email, role, rememberMe, isAuthenticated } | null,
//     logout: () => void   — clears localStorage and resets the app to the landing page
//   }
export const UserContext = createContext(null);

// useUser — custom hook so any component can access the user session
// without needing to import UserContext and useContext separately.
// Usage:  const { user, logout } = useUser();
export function useUser() {
  return useContext(UserContext);
}
