import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      const response = await res.text();
      if (response) {
        try {
          const parsed = JSON.parse(response);
          errorMessage = parsed.message || parsed.error || response;
        } catch {
          errorMessage = response;
        }
      }
    } catch {
      // Ignore parsing errors, use statusText
    }
    
    // Enhanced error messages for better UX
    if (res.status === 401) {
      errorMessage = "Vous devez vous connecter pour accéder à cette fonctionnalité.";
    } else if (res.status === 403) {
      errorMessage = "Vous n'avez pas les autorisations nécessaires pour cette action.";
    } else if (res.status === 404) {
      errorMessage = "La ressource demandée est introuvable.";
    } else if (res.status >= 500) {
      errorMessage = "Erreur du serveur. Veuillez réessayer plus tard.";
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Check for network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Connexion internet requise. Vérifiez votre réseau et réessayez.");
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 1,
      retryDelay: 1000,
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
