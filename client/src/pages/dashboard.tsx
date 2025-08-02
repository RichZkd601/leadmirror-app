import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FlipHorizontal2, 
  Sparkles, 
  Copy, 
  Clock, 
  TrendingUp, 
  History, 
  Crown, 
  Lightbulb, 
  Target, 
  User as UserIcon, 
  CheckCircle, 
  AlertTriangle, 
  Brain, 
  Mail, 
  Shuffle, 
  Shield, 
  ArrowRight,
  Save,
  Settings,
  Download
} from "lucide-react";

interface Analysis {
  id: string;
  userId: string;
  title: string;
  inputText: string;
  interestLevel: "hot" | "warm" | "cold";
  interestJustification: string;
  confidenceScore?: number;
  personalityProfile?: {
    type: "analytical" | "driver" | "expressive" | "amiable";
    traits: string[];
    communicationStyle: string;
  };
  emotionalState?: {
    primary: "enthousiaste" | "prudent" | "frustré" | "neutre" | "excité";
    intensity: number;
    indicators: string[];
  };
  objections: Array<{
    type: string;
    intensity: "high" | "medium" | "low";
    description: string;
    responseStrategy?: string;
    probability?: number;
  }>;
  buyingSignals?: Array<{
    signal: string;
    strength: "strong" | "medium" | "weak";
    description: string;
  }>;
  nextSteps?: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    timeframe: string;
    reasoning: string;
  }>;
  strategicAdvice: string;
  talkingPoints?: string[];
  followUpSubject: string;
  followUpMessage: string;
  alternativeApproaches?: Array<{
    approach: string;
    when: string;
    message: string;
  }>;
  riskFactors?: Array<{
    risk: string;
    impact: "high" | "medium" | "low";
    mitigation: string;
  }>;
  advancedInsights?: {
    conversationQualityScore: number;
    salesTiming: {
      currentPhase: string;
      nextPhaseRecommendation: string;
      timeToClose: string;
      urgencyIndicators: string[];
    };
    keyMoments: Array<{
      moment: string;
      significance: string;
      action: string;
    }>;
    competitiveAnalysis: {
      competitorsDetected: string[];
      competitiveAdvantages: string[];
      threatLevel: string;
      counterStrategies: string[];
    };
    prospectMaturity: {
      decisionMakingStage: string;
      readinessScore: number;
      missingElements: string[];
    };
    predictions: {
      closingProbability: number;
      bestApproachVector: string;
      predictedObjections: Array<{
        objection: string;
        probability: number;
        preventiveStrategy: string;
      }>;
    };
  };
  emotionalAnalysis?: {
    emotionalTrajectory: Array<{
      phase: string;
      emotion: string;
      intensity: number;
      triggers: string[];
    }>;
    overallSentiment: number;
    emotionalTriggers: string[];
    recommendedEmotionalApproach: string;
  };
  createdAt: string;
}

export default function Dashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [conversationText, setConversationText] = useState(`Bonjour Monsieur Dupont, merci de prendre le temps de me parler aujourd'hui. Je vous appelle suite à votre demande d'information sur nos solutions de gestion commerciale.

Client: Oui bonjour, effectivement j'ai vu votre présentation en ligne et ça m'a l'air intéressant. Par contre, je ne suis pas sûr que ce soit le bon moment pour investir.

Vendeur: Je comprends parfaitement votre préoccupation. Pouvez-vous me dire quels sont vos principaux défis actuels en matière de gestion commerciale ?

Client: Eh bien, on perd beaucoup de temps avec notre système actuel. Mes équipes passent des heures à saisir des données et on n'a pas de vision claire sur nos performances. Mais avec la conjoncture économique...

Vendeur: C'est exactement le type de problème que notre solution résout. Combien d'heures par semaine vos équipes perdent-elles actuellement ?

Client: Facilement 10 heures par semaine, peut-être plus. C'est énorme quand on y pense.

Vendeur: Absolument ! Si on valorise ces 10 heures à 50€ de l'heure, ça représente 500€ par semaine, soit 26 000€ par an. Notre solution coûte 8 000€ et vous ferait économiser plus de 15 000€ dès la première année.

Client: Wow, vu comme ça... Mais il faut quand même l'investissement initial. Et si ça ne marche pas comme prévu ?

Vendeur: Je comprends cette inquiétude. C'est pourquoi nous proposons une garantie satisfait ou remboursé de 30 jours. De plus, nous avons des témoignages clients qui montrent des résultats similaires.

Client: Intéressant... Vous pouvez me montrer ces témoignages ?`);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, userLoading, toast]);

  // Fetch user analyses
  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/analyses"],
    enabled: !!user?.isPremium,
    retry: false,
  });

  // Analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: { text: string; title: string }) => {
      const response = await apiRequest("POST", "/api/analyze", { 
        conversationText: data.text, 
        title: data.title 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      toast({
        title: "Analyse terminée",
        description: "Votre conversation a été analysée avec succès.",
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
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message;
      if (errorMessage.includes("limit reached")) {
        setShowPricing(true);
        toast({
          title: "Limite d'analyses atteinte",
          description: "Passez au premium pour des analyses illimitées.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Échec de l'analyse",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationText.trim()) {
      toast({
        title: "Saisie manquante",
        description: "Veuillez saisir une conversation à analyser.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate({ 
      text: conversationText.trim(), 
      title: analysisTitle.trim() || "Analyse sans titre" 
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié !",
        description: "Texte copié dans le presse-papiers.",
      });
    } catch (error) {
      toast({
        title: "Échec de la copie",
        description: "Impossible de copier le texte dans le presse-papiers.",
        variant: "destructive",
      });
    }
  };

  const getInterestColor = (level: string) => {
    switch (level) {
      case "hot": return "hot";
      case "warm": return "warm";
      case "cold": return "cold";
      default: return "default";
    }
  };

  const getObjectionColor = (intensity: string) => {
    switch (intensity) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
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

  const usagePercentage = user.isPremium ? 100 : ((user.monthlyAnalysesUsed || 0) / 3) * 100;

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
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = "/analytics"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Target className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = "/integrations"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Intégrations
                </Button>
                <span className="text-sm text-muted-foreground">
                  Analyses utilisées : <span className="font-medium">{user.monthlyAnalysesUsed || 0}</span>
                  {!user.isPremium && "/3"}
                </span>
                {!user.isPremium && (
                  <Button 
                    size="sm" 
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => setShowPricing(true)}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Mettre à niveau
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {user.firstName || user.email}
                </span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Analysez vos conversations commerciales
          </h2>
          <p className="text-muted-foreground">
            Collez votre email ou résumé d'appel pour obtenir des insights IA et des messages de relance parfaits.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Input */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Analyse de conversation</span>
                </CardTitle>
                <CardDescription>
                  Collez votre fil d'emails, notes d'appel ou résumé de conversation ci-dessous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Titre de l'analyse (optionnel)</label>
                    <input
                      type="text"
                      value={analysisTitle}
                      onChange={(e) => setAnalysisTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="Ex: Appel avec Monsieur Dupont - Suivi proposition"
                    />
                  </div>
                  <Textarea
                    value={conversationText}
                    onChange={(e) => setConversationText(e.target.value)}
                    className="min-h-[192px] resize-none"
                    placeholder="Exemple :

Bonjour Jean,

Merci pour l'appel d'hier. Je comprends que vous êtes intéressé par notre programme de coaching premium mais vous avez mentionné que vous devez d'abord en discuter avec votre partenaire commercial. Vous avez également demandé des informations sur les options de paiement.

J'attends de vos nouvelles !

Cordialement,
Sarah"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {conversationText.length} caractères
                    </div>
                    <Button 
                      type="submit" 
                      disabled={analyzeMutation.isPending || !conversationText.trim()}
                      className="px-6"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyser le message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Loading State */}
            {analyzeMutation.isPending && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyse de votre conversation en cours...</p>
                  <p className="text-sm text-muted-foreground mt-2">Cela prend généralement 10-15 secondes</p>
                </CardContent>
              </Card>
            )}

            {/* Revolutionary Analysis Results */}
            {currentAnalysis && !analyzeMutation.isPending && (
              <div className="space-y-6">
                {/* Quick Overview Bar */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <Badge variant={getInterestColor(currentAnalysis.interestLevel)} className="text-sm px-3 py-1 mb-2">
                          {currentAnalysis.interestLevel === 'hot' ? '🔥 CHAUD' : 
                           currentAnalysis.interestLevel === 'warm' ? '🟡 TIÈDE' : 
                           '🔵 FROID'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">Niveau d'intérêt</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{currentAnalysis.confidenceScore || 85}%</div>
                        <p className="text-xs text-muted-foreground">Score de confiance</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{currentAnalysis.personalityProfile?.type || 'Analytique'}</div>
                        <p className="text-xs text-muted-foreground">Profil psychologique</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{currentAnalysis.emotionalState?.primary || 'Neutre'}</div>
                        <p className="text-xs text-muted-foreground">État émotionnel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Enhanced Interest Level */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Analyse d'intérêt</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={getInterestColor(currentAnalysis.interestLevel)} className="text-sm px-3 py-1">
                          {currentAnalysis.interestLevel === 'hot' ? '🔥 CHAUD' : 
                           currentAnalysis.interestLevel === 'warm' ? '🟡 TIÈDE' : 
                           '🔵 FROID'}
                        </Badge>
                        <span className="text-2xl font-bold text-green-600">{currentAnalysis.confidenceScore || 85}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentAnalysis.interestJustification}
                      </p>
                      {currentAnalysis.emotionalState && (
                        <div className="p-3 bg-muted rounded">
                          <p className="text-sm font-medium">État émotionnel détecté:</p>
                          <p className="text-sm">{currentAnalysis.emotionalState.primary} (Intensité: {currentAnalysis.emotionalState.intensity}/10)</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Personality Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <UserIcon className="w-5 h-5" />
                        <span>Profil psychologique</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentAnalysis.personalityProfile ? (
                        <>
                          <div>
                            <Badge variant="secondary" className="mb-2">{currentAnalysis.personalityProfile.type}</Badge>
                            <p className="text-sm text-muted-foreground">{currentAnalysis.personalityProfile.communicationStyle}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Traits comportementaux:</p>
                            <div className="flex flex-wrap gap-1">
                              {currentAnalysis.personalityProfile.traits?.map((trait: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">{trait}</Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-muted rounded">
                          <p className="text-sm text-muted-foreground">Profil en cours d'analyse lors des prochaines interactions...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Buying Signals */}
                {currentAnalysis.buyingSignals && currentAnalysis.buyingSignals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Signaux d'achat détectés</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {currentAnalysis.buyingSignals.map((signal: any, index: number) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={signal.strength === 'strong' ? 'default' : 
                                            signal.strength === 'medium' ? 'secondary' : 'outline'}>
                                {signal.strength}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{signal.signal}</p>
                            <p className="text-xs text-muted-foreground mt-1">{signal.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Objections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Objections probables & Stratégies</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentAnalysis.objections?.map((objection: any, index: number) => (
                        <div key={index} className="border rounded p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant={objection.intensity === 'high' ? 'destructive' : 
                                            objection.intensity === 'medium' ? 'secondary' : 'outline'}>
                                {objection.type}
                              </Badge>
                              {objection.probability && (
                                <span className="text-sm text-muted-foreground">{objection.probability}% probabilité</span>
                              )}
                            </div>
                            <Badge variant="outline">{objection.intensity}</Badge>
                          </div>
                          <p className="text-sm mb-3">{objection.description}</p>
                          {objection.responseStrategy && (
                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Stratégie de réponse:</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{objection.responseStrategy}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                {currentAnalysis.nextSteps && currentAnalysis.nextSteps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Étapes suivantes recommandées</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentAnalysis.nextSteps.map((step: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                            <Badge variant={step.priority === 'high' ? 'destructive' : 
                                          step.priority === 'medium' ? 'secondary' : 'outline'}>
                              {step.priority}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.action}</p>
                              <p className="text-xs text-muted-foreground mt-1">{step.timeframe}</p>
                              <p className="text-xs text-muted-foreground mt-1">{step.reasoning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Strategic Advice */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>Conseils stratégiques avancés</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{currentAnalysis.strategicAdvice}</p>
                    
                    {currentAnalysis.talkingPoints && currentAnalysis.talkingPoints.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Points clés à aborder:</p>
                        <ul className="space-y-1">
                          {currentAnalysis.talkingPoints.map((point: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced Follow-up */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Message de relance optimisé</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Objet :</label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded">{currentAnalysis.followUpSubject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Message :</label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded whitespace-pre-wrap">{currentAnalysis.followUpMessage}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => copyToClipboard(`Objet: ${currentAnalysis.followUpSubject}\n\n${currentAnalysis.followUpMessage}`)}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier le message complet
                      </Button>
                      {user?.isPremium && (
                        <Button 
                          variant="outline"
                          onClick={() => window.location.href = "/integrations"}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter CRM
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative Approaches */}
                {currentAnalysis.alternativeApproaches && currentAnalysis.alternativeApproaches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shuffle className="w-5 h-5" />
                        <span>Approches alternatives</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentAnalysis.alternativeApproaches.map((approach: any, index: number) => (
                          <div key={index} className="border rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{approach.approach}</h4>
                              <Badge variant="outline" className="text-xs">{approach.when}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted rounded p-3">{approach.message}</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => copyToClipboard(approach.message)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copier
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Advanced Insights Section */}
                {currentAnalysis.advancedInsights && (
                  <>
                    {/* Conversation Quality & Predictions */}
                    <div className="grid lg:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Score de qualité & Prédictions</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                              {currentAnalysis.advancedInsights.conversationQualityScore}%
                            </div>
                            <p className="text-sm text-muted-foreground">Score de qualité conversation</p>
                          </div>
                          
                          <div className="text-center p-3 bg-white dark:bg-black rounded">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                              {currentAnalysis.advancedInsights.predictions.closingProbability}%
                            </div>
                            <p className="text-sm text-muted-foreground">Probabilité de closing</p>
                          </div>
                          
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Meilleur vecteur d'approche:</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {currentAnalysis.advancedInsights.predictions.bestApproachVector}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sales Timing */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Timing commercial</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              Phase: {currentAnalysis.advancedInsights.salesTiming.currentPhase}
                            </Badge>
                            <Badge variant="outline" className="ml-2">
                              {currentAnalysis.advancedInsights.salesTiming.timeToClose}
                            </Badge>
                          </div>
                          
                          <div className="p-3 bg-muted rounded">
                            <p className="text-sm font-medium mb-1">Prochaine étape recommandée:</p>
                            <p className="text-sm">{currentAnalysis.advancedInsights.salesTiming.nextPhaseRecommendation}</p>
                          </div>
                          
                          {currentAnalysis.advancedInsights.salesTiming.urgencyIndicators.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Indicateurs d'urgence:</p>
                              <div className="space-y-1">
                                {currentAnalysis.advancedInsights.salesTiming.urgencyIndicators.map((indicator, index) => (
                                  <div key={index} className="flex items-center text-sm">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    {indicator}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Moments */}
                    {currentAnalysis.advancedInsights.keyMoments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Lightbulb className="w-5 h-5" />
                            <span>Moments clés détectés</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {currentAnalysis.advancedInsights.keyMoments.map((moment, index) => (
                              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm">{moment.moment}</p>
                                  <Badge variant={moment.significance === 'critique' ? 'destructive' : 
                                               moment.significance === 'important' ? 'secondary' : 'outline'}>
                                    {moment.significance}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{moment.action}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Competitive Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Analyse concurrentielle</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Niveau de menace:</span>
                          <Badge variant={currentAnalysis.advancedInsights.competitiveAnalysis.threatLevel === 'high' ? 'destructive' : 
                                        currentAnalysis.advancedInsights.competitiveAnalysis.threatLevel === 'medium' ? 'secondary' : 'outline'}>
                            {currentAnalysis.advancedInsights.competitiveAnalysis.threatLevel}
                          </Badge>
                        </div>
                        
                        {currentAnalysis.advancedInsights.competitiveAnalysis.competitorsDetected.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Concurrents détectés:</p>
                            <div className="flex flex-wrap gap-1">
                              {currentAnalysis.advancedInsights.competitiveAnalysis.competitorsDetected.map((competitor, index) => (
                                <Badge key={index} variant="outline">{competitor}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentAnalysis.advancedInsights.competitiveAnalysis.competitiveAdvantages.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Vos avantages concurrentiels:</p>
                            <ul className="space-y-1">
                              {currentAnalysis.advancedInsights.competitiveAnalysis.competitiveAdvantages.map((advantage, index) => (
                                <li key={index} className="text-sm flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Prospect Maturity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <UserIcon className="w-5 h-5" />
                          <span>Maturité du prospect</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Étape de décision:</span>
                          <Badge variant="secondary">{currentAnalysis.advancedInsights.prospectMaturity.decisionMakingStage}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Score de préparation:</span>
                            <span className="font-medium">{currentAnalysis.advancedInsights.prospectMaturity.readinessScore}%</span>
                          </div>
                          <Progress value={currentAnalysis.advancedInsights.prospectMaturity.readinessScore} className="h-2" />
                        </div>
                        
                        {currentAnalysis.advancedInsights.prospectMaturity.missingElements.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Éléments manquants:</p>
                            <ul className="space-y-1">
                              {currentAnalysis.advancedInsights.prospectMaturity.missingElements.map((element, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                  {element}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Predicted Objections */}
                    {currentAnalysis.advancedInsights.predictions.predictedObjections.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Objections prédites par l'IA</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {currentAnalysis.advancedInsights.predictions.predictedObjections.map((objection, index) => (
                              <div key={index} className="border rounded p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-medium text-sm">{objection.objection}</p>
                                  <Badge variant="outline">{objection.probability}% probabilité</Badge>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded">
                                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Stratégie préventive:</p>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">{objection.preventiveStrategy}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Emotional Analysis */}
                {currentAnalysis.emotionalAnalysis && (
                  <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>Analyse émotionnelle avancée</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{
                          color: currentAnalysis.emotionalAnalysis.overallSentiment > 50 ? '#10b981' : 
                                currentAnalysis.emotionalAnalysis.overallSentiment > 0 ? '#f59e0b' : '#ef4444'
                        }}>
                          {currentAnalysis.emotionalAnalysis.overallSentiment > 0 ? '+' : ''}{currentAnalysis.emotionalAnalysis.overallSentiment}
                        </div>
                        <p className="text-sm text-muted-foreground">Sentiment global (-100 à +100)</p>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-black rounded">
                        <p className="text-sm font-medium mb-1">Approche émotionnelle recommandée:</p>
                        <p className="text-sm">{currentAnalysis.emotionalAnalysis.recommendedEmotionalApproach}</p>
                      </div>
                      
                      {currentAnalysis.emotionalAnalysis.emotionalTriggers.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Déclencheurs émotionnels détectés:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentAnalysis.emotionalAnalysis.emotionalTriggers.map((trigger, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{trigger}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Risk Factors */}
                {currentAnalysis.riskFactors && currentAnalysis.riskFactors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Facteurs de risque & Mitigations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentAnalysis.riskFactors.map((risk: any, index: number) => (
                          <div key={index} className="border rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm">{risk.risk}</p>
                              <Badge variant={risk.impact === 'high' ? 'destructive' : 
                                            risk.impact === 'medium' ? 'secondary' : 'outline'}>
                                {risk.impact}
                              </Badge>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Stratégie de mitigation:</p>
                              <p className="text-sm text-green-700 dark:text-green-300">{risk.mitigation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mes analyses</span>
                  {user?.isPremium && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowHistory(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <History className="w-4 h-4 mr-1" />
                      Analyses sauvegardées
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Analyses mensuelles</span>
                    <span className="font-medium">
                      {user.monthlyAnalysesUsed || 0}{!user.isPremium && "/3"}
                    </span>
                  </div>
                  {!user.isPremium && (
                    <Progress value={usagePercentage} className="h-2" />
                  )}
                </div>
                {!user.isPremium && (
                  <Button 
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={() => setShowPricing(true)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Passer au Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Saved Analyses Preview */}
            {user?.isPremium && analyses && analyses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Analyses récentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analyses.slice(0, 3).map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="p-3 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setCurrentAnalysis(analysis)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate">{analysis.title}</span>
                        <Badge variant={getInterestColor(analysis.interestLevel)} className="text-xs">
                          {analysis.interestLevel === 'hot' ? 'Chaud' : 
                           analysis.interestLevel === 'warm' ? 'Tiède' : 'Froid'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {analysis.inputText.substring(0, 80)}...
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setShowHistory(true)}
                  >
                    Voir toutes les analyses
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Conseils rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Incluez le contexte de l'entreprise du prospect et ses points de douleur</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Copiez les fils d'emails entiers pour une meilleure analyse</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">Meilleurs résultats avec des conversations de 100-500 mots</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Analyses */}
            {user.isPremium && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Analyses récentes</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowHistory(true)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Voir tout
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyses && analyses.length > 0 ? (
                    <div className="space-y-3">
                      {analyses.slice(0, 3).map((analysis: Analysis) => (
                        <div key={analysis.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                            <Badge variant={getInterestColor(analysis.interestLevel)} className="text-xs">
                              {analysis.interestLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground font-medium truncate mb-1">
                            {analysis.followUpSubject}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => copyToClipboard(`Subject: ${analysis.followUpSubject}\n\n${analysis.followUpMessage}`)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copier la relance
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune analyse pour l'instant. Commencez par analyser votre première conversation !</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analyses sauvegardées</DialogTitle>
            <DialogDescription>
              Consultez vos précédentes analyses de conversations (Premium uniquement)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {user?.isPremium ? (
              analyses && analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setCurrentAnalysis(analysis)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant={getInterestColor(analysis.interestLevel)}>
                              {analysis.interestLevel === 'hot' ? '🔥 Chaud' : 
                               analysis.interestLevel === 'warm' ? '🌤 Tiède' : '❄️ Froid'}
                            </Badge>
                            <span className="font-medium text-sm">{analysis.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {analysis.inputText.substring(0, 150)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune analyse trouvée dans votre historique
                </p>
              )
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  L'accès à l'historique nécessite un abonnement Premium
                </p>
                <Button onClick={() => setShowPricing(true)}>
                  Passer au Premium
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Modal */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choisissez votre formule</DialogTitle>
            <DialogDescription>
              Passez au premium pour débloquer les analyses illimitées et les fonctionnalités avancées
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Free Plan */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Gratuit</CardTitle>
                <div className="text-3xl font-bold">€0</div>
                <CardDescription>par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>3 analyses par mois</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Insights IA basiques</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Génération de messages de relance</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Formule actuelle
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-primary">
              <CardHeader className="text-center">
                <Badge className="mb-2">Plus populaire</Badge>
                <CardTitle>Premium</CardTitle>
                <div className="text-3xl font-bold text-primary">€12</div>
                <CardDescription>par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Analyses illimitées</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Insights IA avancés</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Historique complet des analyses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Suivi des performances</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = "/subscribe"}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Passer au premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des analyses</DialogTitle>
            <DialogDescription>
              Vos analyses de conversations récentes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            {analyses && analyses.length > 0 ? (
              analyses.map((analysis: Analysis) => (
                <Card key={analysis.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleString()}
                          </span>
                          <Badge variant={getInterestColor(analysis.interestLevel)}>
                            {analysis.interestLevel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.followUpSubject}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`Subject: ${analysis.followUpSubject}\n\n${analysis.followUpMessage}`)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted rounded p-3">
                      {analysis.inputText.substring(0, 150)}...
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucune analyse trouvée.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
