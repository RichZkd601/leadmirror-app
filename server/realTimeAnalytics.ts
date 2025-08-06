import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Interface pour l'analyse en temps réel des performances
export interface RealTimeMetrics {
  dailyStats: {
    totalAnalyses: number;
    avgConfidenceScore: number;
    hotLeadsCount: number;
    avgClosingProbability: number;
    topPerformingApproaches: string[];
  };
  weeklyTrends: {
    analysisGrowth: number;
    successRateImprovement: number;
    mostCommonObjections: Array<{
      objection: string;
      frequency: number;
      successRate: number;
    }>;
  };
  monthlyInsights: {
    totalConversions: number;
    bestPerformingDays: string[];
    averageTimeToClose: number;
    topRecommendations: string[];
  };
}

// Interface pour les recommandations personnalisées
export interface PersonalizedRecommendations {
  dailyFocus: Array<{
    recommendation: string;
    priority: "high" | "medium" | "low";
    estimatedImpact: string;
    actionSteps: string[];
  }>;
  skillImprovements: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    improvementPath: string[];
  }>;
  nextBestActions: Array<{
    action: string;
    reasoning: string;
    expectedOutcome: string;
    timeline: string;
  }>;
}

// Analyse des patterns de réussite
export async function analyzeSuccessPatterns(conversationHistory: string[]): Promise<{
  winningFormulas: Array<{
    pattern: string;
    successRate: number;
    examples: string[];
    keyFactors: string[];
  }>;
  improvementAreas: Array<{
    area: string;
    impact: number;
    suggestions: string[];
  }>;
  personalizedStrategy: string;
}> {
  try {
    const prompt = `Analyse ces conversations commerciales pour identifier les patterns de réussite :

HISTORIQUE DES CONVERSATIONS :
${conversationHistory.join('\n\n---\n\n')}

Identifie :
1. Les formules gagnantes récurrentes
2. Les domaines d'amélioration prioritaires  
3. Une stratégie personnalisée

JSON structure:
{
  "winningFormulas": [
    {
      "pattern": "pattern identifié",
      "successRate": 85,
      "examples": ["exemple1", "exemple2"],
      "keyFactors": ["facteur1", "facteur2"]
    }
  ],
  "improvementAreas": [
    {
      "area": "domaine à améliorer",
      "impact": 75,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "personalizedStrategy": "stratégie personnalisée basée sur l'analyse"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en optimisation des performances commerciales." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Erreur analyse des patterns:", error);
    throw error;
  }
}

// Génération de coaching personnalisé
export async function generatePersonalizedCoaching(userPerformance: any): Promise<{
  weeklyGoals: Array<{
    goal: string;
    metrics: string;
    actionPlan: string[];
    deadline: string;
  }>;
  dailyHabits: Array<{
    habit: string;
    benefit: string;
    implementation: string;
  }>;
  skillDevelopment: Array<{
    skill: string;
    exercises: string[];
    resources: string[];
    timeline: string;
  }>;
  motivationalInsights: string[];
}> {
  try {
    const prompt = `Génère un programme de coaching personnalisé basé sur ces performances :

PERFORMANCES UTILISATEUR :
${JSON.stringify(userPerformance, null, 2)}

Crée un plan de développement personnalisé avec :
1. Objectifs hebdomadaires SMART
2. Habitudes quotidiennes à adopter
3. Plan de développement des compétences
4. Insights motivationnels personnalisés

JSON structure requis...`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un coach commercial expert en développement des performances." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Erreur génération coaching:", error);
    throw error;
  }
}

// Analyse prédictive des tendances du marché
export async function analyzeTrendsPredictions(industryData: string): Promise<{
  marketTrends: Array<{
    trend: string;
    impact: "high" | "medium" | "low";
    timeframe: string;
    opportunities: string[];
  }>;
  competitiveLandscape: {
    threats: string[];
    opportunities: string[];
    strategicRecommendations: string[];
  };
  futurePreparation: Array<{
    preparation: string;
    priority: number;
    timeline: string;
  }>;
}> {
  // Cette fonction analyserait les tendances du marché
  // En développement...
  return {
    marketTrends: [],
    competitiveLandscape: {
      threats: [],
      opportunities: [],
      strategicRecommendations: []
    },
    futurePreparation: []
  };
}