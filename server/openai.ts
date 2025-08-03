import OpenAI from "openai";
import fs from "fs";
import path from "path";

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

// Audio transcription using Whisper API
export async function transcribeAudio(audioFilePath: string): Promise<{
  text: string;
  duration: number;
}> {
  try {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error("Audio file not found");
    }

    // Get file stats for duration estimation
    const stats = fs.statSync(audioFilePath);
    const fileSizeInBytes = stats.size;
    
    // Create a readable stream for the audio file
    const audioReadStream = fs.createReadStream(audioFilePath);

    console.log(`Transcribing audio file: ${audioFilePath} (${fileSizeInBytes} bytes)`);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "fr", // French language for better accuracy
      response_format: "verbose_json", // Get detailed response with timestamps
      temperature: 0.2, // Lower temperature for more consistent transcription
    });

    console.log("Transcription completed successfully");

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Échec de la transcription audio: " + (error as Error).message);
  }
}

// Enhanced conversation analysis for audio transcriptions
export async function analyzeAudioConversation(
  transcriptionText: string,
  audioMetadata?: {
    duration: number;
    fileSize: number;
  }
): Promise<AnalysisResult & {
  audioInsights?: {
    conversationPacing: "slow" | "normal" | "fast";
    silencePeriods: string[];
    speakingRatio: {
      seller: number;
      prospect: number;
    };
    audioQualityNotes: string[];
  };
}> {
  try {
    const enhancedPrompt = `Tu es le meilleur expert mondial en psychologie commerciale, analyse comportementale et stratégie de vente. Tu combines l'expertise de Grant Cardone, Jordan Belfort, et Daniel Kahneman.

CONVERSATION TRANSCRITE (AUDIO) À ANALYSER :
${transcriptionText}

${audioMetadata ? `
MÉTADONNÉES AUDIO :
- Durée: ${Math.round(audioMetadata.duration / 60)} minutes
- Taille du fichier: ${Math.round(audioMetadata.fileSize / 1024 / 1024)} MB
` : ''}

ANALYSE COMPLÈTE REQUISE pour conversation AUDIO (JSON uniquement) :

ATTENTION: Cette conversation provient d'un enregistrement audio. Analyse les nuances vocales, pauses, hésitations, et dynamiques conversationnelles qui peuvent révéler des insights supplémentaires.

1. ÉVALUATION DU NIVEAU D'INTÉRÊT (hot/warm/cold) avec score de confiance (0-100)
2. PROFIL PSYCHOLOGIQUE du prospect avec traits comportementaux
3. ÉTAT ÉMOTIONNEL détecté avec intensité et indicateurs vocaux
4. OBJECTIONS PROBABLES avec stratégies de réponse
5. SIGNAUX D'ACHAT identifiés avec force du signal
6. ÉTAPES SUIVANTES recommandées avec priorités
7. CONSEILS STRATÉGIQUES avancés
8. POINTS CLÉS à aborder dans la suite
9. MESSAGE DE RELANCE optimisé
10. APPROCHES ALTERNATIVES selon différents scénarios
11. FACTEURS DE RISQUE et mitigations
12. INSIGHTS SPÉCIFIQUES À L'AUDIO (rythme, pauses, ratio de parole)

Structure JSON EXACTE obligatoire (inclut audioInsights) :
{
  "interestLevel": "hot|warm|cold",
  "interestJustification": "analyse psychologique détaillée incluant les nuances vocales...",
  "confidenceScore": 85,
  "personalityProfile": {
    "type": "analytical|driver|expressive|amiable",
    "traits": ["trait1", "trait2", "trait3"],
    "communicationStyle": "description du style de communication préféré"
  },
  "emotionalState": {
    "primary": "excited|cautious|frustrated|neutral|enthusiastic",
    "intensity": 7,
    "indicators": ["indicateur1 vocal", "indicateur2 vocal"]
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
  "strategicAdvice": "conseil stratégique avancé basé sur la psychologie comportementale et les nuances audio...",
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
  ],
  "audioInsights": {
    "conversationPacing": "slow|normal|fast",
    "silencePeriods": ["description des moments de silence significatifs"],
    "speakingRatio": {
      "seller": 60,
      "prospect": 40
    },
    "audioQualityNotes": ["note1 sur la qualité audio", "note2"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es le meilleur analyste commercial au monde, expert en psychologie comportementale et analyse de conversations audio. Réponds UNIQUEMENT en JSON valide, structure EXACTE requise."
        },
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4500, // Increased for audio insights
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Enhanced validation for audio analysis
    const requiredFields = [
      'interestLevel', 'interestJustification', 'confidenceScore', 'personalityProfile',
      'emotionalState', 'objections', 'buyingSignals', 'nextSteps', 'strategicAdvice',
      'talkingPoints', 'followUpSubject', 'followUpMessage', 'alternativeApproaches', 
      'riskFactors', 'audioInsights'
    ];
    
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error analyzing audio conversation:", error);
    throw new Error("Échec de l'analyse de conversation audio: " + (error as Error).message);
  }
}
