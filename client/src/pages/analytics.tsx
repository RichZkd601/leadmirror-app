import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Users, 
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Brain,
  Lightbulb
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();

  // Simuler des données d'analytics avancées
  const analyticsData = {
    totalAnalyses: 47,
    avgConfidenceScore: 82,
    hotLeadsCount: 12,
    avgClosingProbability: 68,
    successRate: 74,
    improvementRate: 15,
    weeklyGrowth: 23,
    topPerformingApproaches: [
      "Approche consultative",
      "Questions stratégiques",
      "Création d'urgence"
    ],
    recentTrends: [
      { metric: "Taux de conversion", value: "+12%", trend: "up" },
      { metric: "Score de confiance", value: "+8%", trend: "up" },
      { metric: "Objections résolues", value: "+15%", trend: "up" },
      { metric: "Temps de closing", value: "-20%", trend: "up" }
    ],
    skillLevels: [
      { skill: "Découverte client", level: 85 },
      { skill: "Gestion d'objections", level: 72 },
      { skill: "Closing", level: 78 },
      { skill: "Suivi prospect", level: 90 }
    ],
    monthlyGoals: [
      { goal: "Augmenter le taux de conversion", progress: 65, target: "75%" },
      { goal: "Réduire le cycle de vente", progress: 40, target: "2 semaines" },
      { goal: "Améliorer le score de confiance", progress: 80, target: "85%" }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Analytics Avancées</h1>
              <Badge variant="outline">Premium</Badge>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Retour au Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analyses totales</p>
                  <p className="text-3xl font-bold">{analyticsData.totalAnalyses}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.weeklyGrowth}% cette semaine</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profil dominant</p>
                  <p className="text-2xl font-bold">Analytique</p>
                </div>
                <Brain className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-green-600">Approche méthodique efficace</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads chauds</p>
                  <p className="text-3xl font-bold">{analyticsData.hotLeadsCount}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm text-muted-foreground">25% du total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Adaptation style</p>
                  <p className="text-2xl font-bold">Excellent</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">Flexibilité reconnue</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profil Psychologique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Profil Psychologique DISC</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Dominance (D)</h4>
                    <span className="text-blue-600 font-bold">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Approche collaborative</p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-800 dark:text-green-200">Influence (I)</h4>
                    <span className="text-green-600 font-bold">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">Communicateur naturel</p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200">Stabilité (S)</h4>
                    <span className="text-purple-600 font-bold">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Relation de confiance</p>
                </div>
                
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">Conformité (C)</h4>
                    <span className="text-orange-600 font-bold">70%</span>
                  </div>
                  <Progress value={70} className="h-2" />
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Analyse détaillée forte</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adaptation Comportementale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Adaptation aux Tempéraments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium">Prospects Dominants</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">85%</div>
                    <div className="text-xs text-muted-foreground">Adaptation réussie</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Prospects Influents</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">92%</div>
                    <div className="text-xs text-muted-foreground">Connexion naturelle</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Prospects Stables</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">78%</div>
                    <div className="text-xs text-muted-foreground">Confiance progressive</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Prospects Analytiques</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">95%</div>
                    <div className="text-xs text-muted-foreground">Affinité naturelle</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Approaches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Approches les plus efficaces</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topPerformingApproaches.map((approach, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{approach}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Objectifs mensuels</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{goal.goal}</span>
                      <span className="text-sm text-muted-foreground">Objectif: {goal.target}</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Progression: {goal.progress}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Recommendations basés sur le tempérament */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommandations Personnalisées IA</CardTitle>
            <CardDescription>Basées sur votre profil psychologique Analytique-Influent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🧠 Exploitez votre profil Analytique</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Votre forte tendance analytique (70%) vous permet d'exceller avec les prospects qui demandent des détails. 
                Préparez des études de cas et des données concrètes pour maximiser votre impact avec ce type de profil.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">💬 Développez votre dimension Influence</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Votre score Influence (60%) est votre second atout. Travaillez sur le storytelling et les témoignages 
                émotionnels pour créer des connexions plus fortes avec les prospects Influents et Stables.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">⚡ Adaptez-vous aux profils Dominants</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Avec les prospects Dominants (85% d'adaptation), raccourcissez vos présentations et allez droit au but. 
                Présentez les bénéfices business immédiats dès les premières minutes.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">🔄 Zone d'amélioration : Prospects Stables</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Votre adaptation avec les profils Stables (78%) peut s'améliorer. Ralentissez le rythme, 
                construisez la confiance progressivement et évitez la pression commerciale directe.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}