import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          // En mode développement, retourner null au lieu d'erreur
          console.warn("Auth endpoint not available, continuing without auth");
          return null;
        }
        
        return response.json();
      } catch (error) {
        // En mode développement, continuer sans authentification
        console.warn("Auth error, continuing without auth:", error);
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoize the result to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  }), [user, isLoading, error]);

  return authState;
}
