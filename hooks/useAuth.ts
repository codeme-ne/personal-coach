// === Auth Hook ===
// Zweck: Einfacher Hook für Auth Context Zugriff
// Exports: useAuth Hook mit allen Auth Funktionen und State

import { useAuthContext } from '../contexts/AuthContext';

// Re-export des Auth Context als useAuth Hook
// Dieser Hook macht den Auth Zugriff einfacher für Components
export const useAuth = () => {
  return useAuthContext();
};

// Export auch als default für flexibility
export default useAuth;