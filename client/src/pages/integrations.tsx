import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Plus, 
  Check, 
  X, 
  ExternalLink,
  FlipHorizontal2,
  Crown,
  Database,
  Briefcase,
  Layout,
  Trello
} from "lucide-react";

interface CrmIntegration {
  id: string;
  platform: string;
  isActive: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

const platformConfig = {
  notion: {
    name: "Notion",
    icon: Database,
    color: "bg-gray-900",
    fields: [
      { key: "token", label: "Token d'intégration", type: "password", placeholder: "secret_..." },
      { key: "databaseId", label: "ID de la base de données", type: "text", placeholder: "32 caractères" }
    ],
    description: "Exportez vos analyses vers une base de données Notion organisée",
    setupUrl: "https://developers.notion.com/docs/create-a-notion-integration"
  },
  pipedrive: {
    name: "Pipedrive", 
    icon: Briefcase,
    color: "bg-green-600",
    fields: [
      { key: "apiToken", label: "Token API", type: "password", placeholder: "Votre token API Pipedrive" },
      { key: "companyDomain", label: "Domaine de votre entreprise", type: "text", placeholder: "monentreprise" }
    ],
    description: "Créez automatiquement des notes et activités dans Pipedrive",
    setupUrl: "https://pipedrive.readme.io/docs/how-to-find-the-api-token"
  },
  clickup: {
    name: "ClickUp",
    icon: Layout,
    color: "bg-purple-600", 
    fields: [
      { key: "apiToken", label: "Token API", type: "password", placeholder: "pk_..." },
      { key: "listId", label: "ID de la liste", type: "text", placeholder: "ID de la liste ClickUp" }
    ],
    description: "Transformez vos analyses en tâches ClickUp avec priorités",
    setupUrl: "https://clickup.com/api"
  },
  trello: {
    name: "Trello",
    icon: Trello,
    color: "bg-blue-600",
    fields: [
      { key: "apiKey", label: "Clé API", type: "text", placeholder: "Votre clé API Trello" },
      { key: "token", label: "Token", type: "password", placeholder: "Votre token Trello" },
      { key: "listId", label: "ID de la liste", type: "text", placeholder: "ID de la liste Trello" }
    ],
    description: "Créez des cartes Trello avec checklists et labels automatiques",
    setupUrl: "https://trello.com/app-key"
  }
};

export default function Integrations() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/google";
      }, 500);
      return;
    }
  }, [user, userLoading, toast]);

  // Fetch integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ["/api/crm/integrations"],
    enabled: !!user,
    retry: false,
  });

  // Create integration mutation
  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; config: any }) => {
      const response = await apiRequest("POST", "/api/crm/integrations", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/integrations"] });
      setShowAddDialog(false);
      setFormData({});
      setSelectedPlatform(null);
      toast({
        title: "Intégration ajoutée",
        description: "Votre intégration CRM a été configurée avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/google";
        }, 500);
        return;
      }
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de configurer l'intégration",
        variant: "destructive",
      });
    },
  });

  // Toggle integration mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/crm/integrations/${id}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/integrations"] });
      toast({
        title: "Intégration mise à jour",
        description: "Le statut de l'intégration a été modifié.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'intégration",
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/crm/integrations/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/integrations"] });
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès.",
      });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    createMutation.mutate({
      platform: selectedPlatform,
      config: formData,
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FlipHorizontal2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">LeadMirror</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/"}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Retour au dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Intégrations CRM
          </h2>
          <p className="text-muted-foreground">
            Connectez LeadMirror à vos outils préférés pour automatiser l'export de vos analyses.
          </p>
        </div>

        {!user?.isPremium && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Crown className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Fonctionnalité Premium
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Les intégrations CRM nécessitent un abonnement Premium pour synchroniser automatiquement vos analyses.
                  </p>
                </div>
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => window.location.href = "/subscribe"}
                >
                  Passer au Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {/* Existing Integrations */}
          {Array.isArray(integrations) && integrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Intégrations configurées</CardTitle>
                <CardDescription>
                  Gérez vos intégrations CRM existantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(integrations as CrmIntegration[]).map((integration: CrmIntegration) => {
                    const config = platformConfig[integration.platform as keyof typeof platformConfig];
                    const IconComponent = config?.icon || Settings;
                    
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${config?.color || 'bg-gray-500'}`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{config?.name || integration.platform}</h4>
                            <p className="text-sm text-muted-foreground">
                              Configuré le {new Date(integration.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge variant={integration.isActive ? "default" : "secondary"}>
                            {integration.isActive ? "Actif" : "Inactif"}
                          </Badge>
                          
                          <Switch
                            checked={integration.isActive}
                            onCheckedChange={(checked) => 
                              toggleMutation.mutate({ id: integration.id, isActive: checked })
                            }
                            disabled={toggleMutation.isPending}
                          />
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(integration.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Integrations */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Intégrations disponibles</CardTitle>
                  <CardDescription>
                    Connectez vos outils CRM préférés
                  </CardDescription>
                </div>
                {user?.isPremium && (
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une intégration
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Nouvelle intégration</DialogTitle>
                        <DialogDescription>
                          Choisissez une plateforme et configurez l'intégration
                        </DialogDescription>
                      </DialogHeader>
                      
                      {!selectedPlatform ? (
                        <div className="space-y-3">
                          {Object.entries(platformConfig).map(([key, config]) => {
                            const IconComponent = config.icon;
                            return (
                              <button
                                key={key}
                                className="w-full p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                                onClick={() => setSelectedPlatform(key)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${config.color}`}>
                                    <IconComponent className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{config.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {config.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg ${platformConfig[selectedPlatform as keyof typeof platformConfig].color}`}>
                              {(() => {
                                const IconComponent = platformConfig[selectedPlatform as keyof typeof platformConfig].icon;
                                return <IconComponent className="w-4 h-4 text-white" />;
                              })()}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {platformConfig[selectedPlatform as keyof typeof platformConfig].name}
                              </h4>
                              <a 
                                href={platformConfig[selectedPlatform as keyof typeof platformConfig].setupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center"
                              >
                                Guide de configuration
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          </div>
                          
                          {platformConfig[selectedPlatform as keyof typeof platformConfig].fields.map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label htmlFor={field.key}>{field.label}</Label>
                              <Input
                                id={field.key}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={formData[field.key] || ""}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                required
                              />
                            </div>
                          ))}
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedPlatform(null);
                                setFormData({});
                              }}
                            >
                              Retour
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createMutation.isPending}
                            >
                              {createMutation.isPending ? "Configuration..." : "Configurer"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(platformConfig).map(([key, config]) => {
                  const IconComponent = config.icon;
                  const isConfigured = Array.isArray(integrations) && integrations.some((i: CrmIntegration) => i.platform === key);
                  
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{config.name}</h4>
                            {isConfigured && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Configuré
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}