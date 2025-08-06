import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: "network" | "auth" | "validation" | "server" | "generic";
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

const ErrorTypes = {
  network: {
    icon: WifiOff,
    title: "Problème de réseau",
    variant: "destructive" as const,
    suggestion: "Vérifiez votre connexion internet et réessayez."
  },
  auth: {
    icon: AlertTriangle,
    title: "Authentification requise", 
    variant: "secondary" as const,
    suggestion: "Vous devez vous connecter pour continuer."
  },
  validation: {
    icon: AlertTriangle,
    title: "Données invalides",
    variant: "destructive" as const,
    suggestion: "Veuillez vérifier vos informations et réessayer."
  },
  server: {
    icon: AlertTriangle,
    title: "Erreur du serveur",
    variant: "destructive" as const,
    suggestion: "Une erreur temporaire est survenue. Réessayez dans quelques instants."
  },
  generic: {
    icon: AlertTriangle,
    title: "Erreur",
    variant: "destructive" as const,
    suggestion: "Une erreur inattendue s'est produite."
  }
} as const;

export function ErrorMessage({
  title,
  message,
  type = "generic",
  onRetry,
  onDismiss,
  showRetry = true,
  className
}: ErrorMessageProps) {
  const errorConfig = ErrorTypes[type];
  const Icon = errorConfig.icon;
  const displayTitle = title || errorConfig.title;

  return (
    <Card className={`border-destructive/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-destructive" />
          <CardTitle className="text-base text-destructive">{displayTitle}</CardTitle>
          <Badge variant={errorConfig.variant} className="ml-auto">
            Erreur
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm">
          {message}
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          {errorConfig.suggestion}
        </p>
        
        {(onRetry || onDismiss) && (
          <div className="flex gap-2 pt-2">
            {onRetry && showRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Réessayer
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8"
              >
                Fermer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}