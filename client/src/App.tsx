import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AudioAnalysis from "@/pages/audio-analysis";
import Subscribe from "@/pages/subscribe";
import Analytics from "@/pages/analytics";
import Integrations from "@/pages/integrations";
import Security from "@/pages/security";
import Profile from "@/pages/profile";
import Auth from "@/pages/auth";
import LifetimeOffer from "@/pages/lifetime-offer";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/security" component={Security} />
      {isLoading ? (
        <Route path="/*" component={() => <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div><p className="ml-2">Chargement...</p></div>} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={Auth} />
          <Route path="/lifetime-offer" component={LifetimeOffer} />
          <Route path="/dashboard" component={Auth} />
          <Route path="/audio-analysis" component={Auth} />
          <Route path="/subscribe" component={Auth} />
          <Route path="/analytics" component={Auth} />
          <Route path="/integrations" component={Auth} />
          <Route path="/profile" component={Auth} />
          <Route path="/*" component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/audio-analysis" component={AudioAnalysis} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/profile" component={Profile} />
          <Route path="/*" component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
