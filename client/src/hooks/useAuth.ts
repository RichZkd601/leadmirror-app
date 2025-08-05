import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Erreur d'authentification: ${response.statusText}`);
      }
      
      return response.json();
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
