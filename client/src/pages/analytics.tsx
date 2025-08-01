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
                  <p className="text-sm text-muted-foreground">Score moyen</p>
                  <p className="text-3xl font-bold">{analyticsData.avgConfidenceScore}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{analyticsData.improvementRate}% d'amélioration</span>
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
                  <p className="text-sm text-muted-foreground">Taux de closing</p>
                  <p className="text-3xl font-bold">{analyticsData.successRate}%</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">Au-dessus de la moyenne</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Tendances de performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">{trend.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-bold">{trend.value}</span>
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Évaluation des compétences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.skillLevels.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <span className="text-sm font-bold">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
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

        {/* Insights & Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Insights & Recommandations IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📈 Optimisation suggérée</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Vos conversations avec approche consultative ont un taux de conversion 32% plus élevé. 
                Concentrez-vous sur cette méthode pour les prospects en phase de découverte.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">🎯 Point fort identifié</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Votre capacité à identifier et traiter les objections s'est améliorée de 23% ce mois-ci. 
                Continuez à utiliser la technique de reformulation empathique.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">🚀 Prochaine étape</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Pour atteindre 80% de taux de conversion, travaillez sur la création d'urgence naturelle 
                et l'amélioration de vos questions de qualification.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}