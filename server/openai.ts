import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AnalysisResult {
  interestLevel: "hot" | "warm" | "cold";
  interestJustification: string;
  confidenceScore: number; // 0-100
  personalityProfile: {
    type: "analytical" | "driver" | "expressive" | "amiable";
    traits: string[];
    communicationStyle: string;
  };
  emotionalState: {
    primary: "excited" | "cautious" | "frustrated" | "neutral" | "enthusiastic";
    intensity: number; // 0-10
    indicators: string[];
  };
  objections: Array<{
    type: "prix" | "timing" | "autorité" | "besoin" | "confiance" | "budget" | "concurrent";
    intensity: "high" | "medium" | "low";
    description: string;
    responseStrategy: string;
    probability: number; // 0-100
  }>;
  buyingSignals: Array<{
    signal: string;
    strength: "strong" | "medium" | "weak";
    description: string;
  }>;
  nextSteps: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    timeframe: string;
    reasoning: string;
  }>;
  strategicAdvice: string;
  talkingPoints: string[];
  followUpSubject: string;
  followUpMessage: string;
  alternativeApproaches: Array<{
    approach: string;
    when: string;
    message: string;
  }>;
  riskFactors: Array<{
    risk: string;
    impact: "high" | "medium" | "low";
    mitigation: string;
  }>;
}

export async function analyzeConversation(conversationText: string): Promise<AnalysisResult> {
  try {
    const prompt = `Tu es le meilleur expert mondial en psychologie commerciale, analyse comportementale et stratégie de vente. Tu combines l'expertise de Grant Cardone, Jordan Belfort, et Daniel Kahneman.

CONVERSATION À ANALYSER :
${conversationText}

ANALYSE COMPLÈTE REQUISE (JSON uniquement) :

1. ÉVALUATION DU NIVEAU D'INTÉRÊT (hot/warm/cold) avec score de confiance (0-100)
2. PROFIL PSYCHOLOGIQUE du prospect (analytical/driver/expressive/amiable) avec traits comportementaux
3. ÉTAT ÉMOTIONNEL détecté (excited/cautious/frustrated/neutral/enthusiastic) avec intensité 0-10
4. OBJECTIONS PROBABLES avec stratégies de réponse et probabilité d'occurrence
5. SIGNAUX D'ACHAT identifiés avec force du signal
6. ÉTAPES SUIVANTES recommandées avec priorités
7. CONSEILS STRATÉGIQUES avancés
8. POINTS CLÉS à aborder dans la suite
9. MESSAGE DE RELANCE optimisé
10. APPROCHES ALTERNATIVES selon différents scénarios
11. FACTEURS DE RISQUE et mitigations

Structure JSON EXACTE obligatoire :
{
  "interestLevel": "hot|warm|cold",
  "interestJustification": "analyse psychologique détaillée...",
  "confidenceScore": 85,
  "personalityProfile": {
    "type": "analytical|driver|expressive|amiable",
    "traits": ["trait1", "trait2", "trait3"],
    "communicationStyle": "description du style de communication préféré"
  },
  "emotionalState": {
    "primary": "excited|cautious|frustrated|neutral|enthusiastic",
    "intensity": 7,
    "indicators": ["indicateur1", "indicateur2"]
  },
  "objections": [
    {
      "type": "prix|timing|autorité|besoin|confiance|budget|concurrent",
      "intensity": "high|medium|low",
      "description": "description de l'objection",
      "responseStrategy": "stratégie de réponse spécifique",
      "probability": 75
    }
  ],
  "buyingSignals": [
    {
      "signal": "signal détecté",
      "strength": "strong|medium|weak",
      "description": "explication du signal"
    }
  ],
  "nextSteps": [
    {
      "action": "action spécifique",
      "priority": "high|medium|low",
      "timeframe": "délai recommandé",
      "reasoning": "justification de l'action"
    }
  ],
  "strategicAdvice": "conseil stratégique avancé basé sur la psychologie comportementale...",
  "talkingPoints": ["point1", "point2", "point3"],
  "followUpSubject": "objet email optimisé psychologiquement",
  "followUpMessage": "message personnalisé et persuasif",
  "alternativeApproaches": [
    {
      "approach": "nom de l'approche",
      "when": "quand l'utiliser",
      "message": "message alternatif"
    }
  ],
  "riskFactors": [
    {
      "risk": "facteur de risque",
      "impact": "high|medium|low",
      "mitigation": "stratégie de mitigation"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es le meilleur analyste commercial au monde, expert en psychologie comportementale et persuasion. Réponds UNIQUEMENT en JSON valide, structure EXACTE requise."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Réduire pour plus de cohérence
      max_tokens: 4000, // Augmenter pour analyses détaillées
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validation étendue
    const requiredFields = [
      'interestLevel', 'interestJustification', 'confidenceScore', 'personalityProfile',
      'emotionalState', 'objections', 'buyingSignals', 'nextSteps', 'strategicAdvice',
      'talkingPoints', 'followUpSubject', 'followUpMessage', 'alternativeApproaches', 'riskFactors'
    ];
    
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    throw new Error("Échec de l'analyse de conversation: " + (error as Error).message);
  }
}
