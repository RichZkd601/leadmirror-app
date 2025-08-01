import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AnalysisResult {
  interestLevel: "hot" | "warm" | "cold";
  interestJustification: string;
  objections: Array<{
    type: string;
    intensity: "high" | "medium" | "low";
    description: string;
  }>;
  strategicAdvice: string;
  followUpSubject: string;
  followUpMessage: string;
}

export async function analyzeConversation(conversationText: string): Promise<AnalysisResult> {
  try {
    const prompt = `Tu es un expert en stratégie commerciale, spécialisé en closing. Analyse ce message :

${conversationText}

Donne-moi une analyse complète en JSON avec ces éléments :
1. Score d'intérêt du prospect (hot/warm/cold) + justification détaillée
2. Objections probables (max 3, avec type, niveau d'intensité high/medium/low, et description)
3. Conseil stratégique de relance détaillé
4. Relance commerciale prête à copier-coller avec objet et message

Réponds uniquement en JSON avec cette structure exacte :
{
  "interestLevel": "hot|warm|cold",
  "interestJustification": "justification détaillée...",
  "objections": [
    {
      "type": "nom de l'objection",
      "intensity": "high|medium|low",
      "description": "description détaillée"
    }
  ],
  "strategicAdvice": "conseil stratégique détaillé...",
  "followUpSubject": "objet du mail de relance",
  "followUpMessage": "message de relance complet et personnalisé"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en analyse commerciale. Réponds uniquement en JSON valide selon le format demandé."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the response structure
    if (!result.interestLevel || !result.interestJustification || !result.objections || !result.strategicAdvice || !result.followUpSubject || !result.followUpMessage) {
      throw new Error("Invalid response structure from OpenAI");
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    throw new Error("Failed to analyze conversation: " + (error as Error).message);
  }
}
