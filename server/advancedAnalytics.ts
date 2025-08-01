import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ConversationInsights {
  // Score global de qualité de la conversation (0-100)
  conversationQualityScore: number;
  
  // Analyse du timing commercial
  salesTiming: {
    currentPhase: "découverte" | "présentation" | "négociation" | "closing" | "suivi";
    nextPhaseRecommendation: string;
    timeToClose: "immédiat" | "court" | "moyen" | "long";
    urgencyIndicators: string[];
  };
  
  // Détection des moments clés
  keyMoments: Array<{
    moment: string;
    significance: "critique" | "important" | "notable";
    action: string;
  }>;
  
  // Analyse competitive
  competitiveAnalysis: {
    competitorsDetected: string[];
    competitiveAdvantages: string[];
    threatLevel: "low" | "medium" | "high";
    counterStrategies: string[];
  };
  
  // Score de maturité du prospect
  prospectMaturity: {
    decisionMakingStage: "reconnaissance" | "évaluation" | "comparaison" | "décision";
    readinessScore: number; // 0-100
    missingElements: string[];
  };
  
  // Prédictions IA avancées
  predictions: {
    closingProbability: number; // 0-100
    bestApproachVector: string;
    predictedObjections: Array<{
      objection: string;
      probability: number;
      preventiveStrategy: string;
    }>;
  };
}

export async function generateAdvancedInsights(conversationText: string): Promise<ConversationInsights> {
  try {
    const prompt = `Tu es le meilleur analyste commercial IA au monde, expert en neuro-science commerciale et psychologie comportementale. Analyse cette conversation commerciale avec la précision d'un super-ordinateur :

CONVERSATION :
${conversationText}

ANALYSE ULTRA-AVANCÉE REQUISE (JSON UNIQUEMENT) :

1. SCORE DE QUALITÉ CONVERSATION (0-100) basé sur l'efficacité commerciale
2. ANALYSE DE TIMING COMMERCIAL avec phase actuelle et recommandations de progression
3. MOMENTS CLÉS CRITIQUES détectés dans la conversation 
4. ANALYSE COMPETITIVE avec détection de concurrents et stratégies
5. MATURITÉ DU PROSPECT avec niveau de préparation à l'achat
6. PRÉDICTIONS IA avec probabilité de closing et stratégies optimales

STRUCTURE JSON OBLIGATOIRE :
{
  "conversationQualityScore": 85,
  "salesTiming": {
    "currentPhase": "découverte|présentation|négociation|closing|suivi",
    "nextPhaseRecommendation": "stratégie pour passer à la phase suivante",
    "timeToClose": "immédiat|court|moyen|long",
    "urgencyIndicators": ["indicateur1", "indicateur2"]
  },
  "keyMoments": [
    {
      "moment": "moment clé détecté",
      "significance": "critique|important|notable",
      "action": "action recommandée"
    }
  ],
  "competitiveAnalysis": {
    "competitorsDetected": ["concurrent1", "concurrent2"],
    "competitiveAdvantages": ["avantage1", "avantage2"],
    "threatLevel": "low|medium|high",
    "counterStrategies": ["stratégie1", "stratégie2"]
  },
  "prospectMaturity": {
    "decisionMakingStage": "reconnaissance|évaluation|comparaison|décision",
    "readinessScore": 75,
    "missingElements": ["élément1", "élément2"]
  },
  "predictions": {
    "closingProbability": 65,
    "bestApproachVector": "meilleure approche recommandée",
    "predictedObjections": [
      {
        "objection": "objection prédite",
        "probability": 70,
        "preventiveStrategy": "stratégie préventive"
      }
    ]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es le meilleur analyste commercial IA au monde. Génère uniquement du JSON valide selon la structure exacte demandée."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validation des champs requis
    const requiredFields = [
      'conversationQualityScore', 'salesTiming', 'keyMoments', 
      'competitiveAnalysis', 'prospectMaturity', 'predictions'
    ];
    
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    return result as ConversationInsights;
  } catch (error) {
    console.error("Erreur lors de l'analyse avancée:", error);
    throw new Error("Échec de l'analyse avancée: " + (error as Error).message);
  }
}

// Analyse de sentiment émotionnel avancée
export async function analyzeEmotionalJourney(conversationText: string): Promise<{
  emotionalTrajectory: Array<{
    phase: string;
    emotion: string;
    intensity: number;
    triggers: string[];
  }>;
  overallSentiment: number; // -100 to +100
  emotionalTriggers: string[];
  recommendedEmotionalApproach: string;
}> {
  try {
    const prompt = `Analyse le parcours émotionnel de cette conversation commerciale :

${conversationText}

Trace la trajectoire émotionnelle du prospect et identifie les déclencheurs émotionnels.

JSON structure:
{
  "emotionalTrajectory": [
    {
      "phase": "début de conversation",
      "emotion": "curiosité",
      "intensity": 7,
      "triggers": ["mention du problème", "solution proposée"]
    }
  ],
  "overallSentiment": 65,
  "emotionalTriggers": ["trigger1", "trigger2"],
  "recommendedEmotionalApproach": "approche émotionnelle recommandée"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un expert en psychologie émotionnelle commerciale." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Erreur analyse émotionnelle:", error);
    throw error;
  }
}