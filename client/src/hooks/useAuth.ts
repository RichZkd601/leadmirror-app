import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
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
