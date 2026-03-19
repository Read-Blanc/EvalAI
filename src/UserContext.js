import { createContext, useContext } from 'react';

// Shape of the context value provided by App.js:
// {
//   user:    { id, email, role, fullName, isAuthenticated } | null,
//   setUser: (user) => void,
//   logout:  () => void
// }
export const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}