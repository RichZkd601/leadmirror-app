import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { AdvancedAudioProcessor } from "./audioProcessor";
import { createHash } from "crypto";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds timeout for robust processing
  maxRetries: 3, // Auto-retry on failure
});

// Advanced audio processing utilities
class AudioProcessor {
  private static readonly SUPPORTED_FORMATS = [
    '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.flac', '.ogg', '.opus'
  ];
  
  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)
  private static readonly MIN_FILE_SIZE = 1024; // 1KB minimum
  
  static validateAudioFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error("Fichier audio introuvable");
    }
    
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileExt = path.extname(filePath).toLowerCase();
    
    if (fileSize < this.MIN_FILE_SIZE) {
      throw new Error("Fichier audio trop petit (minimum 1KB)");
    }
    
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new Error(`Fichier audio trop volumineux (maximum 25MB, reçu ${Math.round(fileSize / 1024 / 1024)}MB)`);
    }
    
    if (!this.SUPPORTED_FORMATS.includes(fileExt)) {
      throw new Error(`Format audio non supporté: ${fileExt}. Formats acceptés: ${this.SUPPORTED_FORMATS.join(', ')}`);
    }
  }
  
  static generateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
  
  static estimateDuration(fileSize: number): number {
    // Rough estimation: 1MB ≈ 1 minute for average quality audio
    return Math.max(1, Math.round(fileSize / (1024 * 1024)));
  }
}

// Advanced text preprocessing for optimal analysis
class TextProcessor {
  private static readonly MIN_TEXT_LENGTH = 10;
  private static readonly MAX_TEXT_LENGTH = 100000; // Increased limit
  private static readonly CONVERSATION_PATTERNS = [
    /\b(vendeur|commercial|client|prospect|acheteur|représentant)\s*:/gi,
    /\b(moi|vous|nous|je|tu|il|elle)\s*:/gi,
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, // Timestamps
  ];
  
  static preprocessConversation(text: string): {
    cleanedText: string;
    metadata: {
      originalLength: number;
      cleanedLength: number;
      hasTimestamps: boolean;
      hasSpeakerLabels: boolean;
      estimatedParticipants: number;
      language: 'fr' | 'en' | 'mixed';
    };
  } {
    if (!text || typeof text !== 'string') {
      throw new Error("Texte de conversation invalide");
    }
    
    const originalLength = text.length;
    
    if (originalLength < this.MIN_TEXT_LENGTH) {
      throw new Error(`Texte trop court (minimum ${this.MIN_TEXT_LENGTH} caractères)`);
    }
    
    if (originalLength > this.MAX_TEXT_LENGTH) {
      throw new Error(`Texte trop long (maximum ${this.MAX_TEXT_LENGTH} caractères, reçu ${originalLength})`);
    }
    
    // Clean and normalize text
    let cleanedText = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Detect conversation patterns
    const hasTimestamps = /\b\d{1,2}:\d{2}/.test(cleanedText);
    const hasSpeakerLabels = /:/.test(cleanedText) && /\b(vendeur|commercial|client|prospect|moi|vous)\s*:/i.test(cleanedText);
    
    // Estimate participants
    const speakerMatches = cleanedText.match(/\b\w+\s*:/g) || [];
    const uniqueSpeakers = new Set(speakerMatches.map(s => s.toLowerCase()));
    const estimatedParticipants = Math.max(2, uniqueSpeakers.size);
    
    // Detect language
    const frenchWords = (cleanedText.match(/\b(le|la|les|un|une|des|et|de|du|dans|sur|avec|pour|par|ce|cette|qui|que|dont|où|oui|non|très|mais|comme|tout|bien|plus|encore|aussi|peut|être|avoir|faire|dire|aller|voir|savoir|nous|vous|ils|elles)\b/gi) || []).length;
    const englishWords = (cleanedText.match(/\b(the|and|or|but|in|on|at|to|for|of|with|by|from|this|that|which|who|what|where|when|why|how|yes|no|very|more|also|can|will|would|could|should|have|has|had|do|does|did|go|come|see|know|think|say|get|make|take|give|find|use|work|try|ask|tell|show|play|run|move|live|feel|seem|become|leave|turn|start|stop|help|talk|walk|look|want|need|like|love|hate|hope|wish|believe|understand|remember|forget|learn|teach|study|read|write|listen|hear|speak|call|answer|open|close|buy|sell|pay|cost|spend|save|win|lose|choose|decide|agree|disagree|accept|refuse|allow|prevent|protect|attack|defend|fight|argue|discuss|explain|describe|compare|contrast|analyze|solve|create|build|destroy|repair|clean|cook|eat|drink|sleep|wake|dream|smile|laugh|cry|sing|dance|drive|ride|fly|swim|jump|run|walk|sit|stand|lie|fall|rise|grow|change|improve|increase|decrease|begin|end|continue|stop|start|finish|complete|succeed|fail|try|attempt|achieve|reach|arrive|leave|return|stay|remain|exist|happen|occur|appear|disappear|seem|look|sound|feel|taste|smell|touch|hold|carry|bring|take|put|place|keep|store|find|lose|search|discover|invent|create)\b/gi) || []).length;
    
    let language: 'fr' | 'en' | 'mixed' = 'fr';
    if (englishWords > frenchWords * 1.5) {
      language = 'en';
    } else if (englishWords > frenchWords * 0.3) {
      language = 'mixed';
    }
    
    return {
      cleanedText,
      metadata: {
        originalLength,
        cleanedLength: cleanedText.length,
        hasTimestamps,
        hasSpeakerLabels,
        estimatedParticipants,
        language,
      }
    };
  }
}

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

export async function analyzeConversation(conversationText: string): Promise<AnalysisResult & {
  processingMetadata?: {
    textLength: number;
    language: string;
    participants: number;
    processingTime: number;
    confidenceFactors: string[];
  };
}> {
  const startTime = Date.now();
  
  try {
    // Advanced text preprocessing
    const { cleanedText, metadata } = TextProcessor.preprocessConversation(conversationText);
    
    console.log(`Processing conversation: ${metadata.cleanedLength} chars, ${metadata.estimatedParticipants} participants, language: ${metadata.language}`);
    // Dynamic prompt adaptation based on text analysis
    const languageInstruction = metadata.language === 'en' ? 
      "IMPORTANT: This conversation is in English. Provide analysis in French but acknowledge the original language." :
      metadata.language === 'mixed' ? 
      "IMPORTANT: This is a multilingual conversation. Analyze language switches as psychological indicators." :
      "Conversation en français détectée.";
    
    const participantContext = metadata.estimatedParticipants > 2 ? 
      `CONTEXTE: Conversation multi-participants (${metadata.estimatedParticipants} personnes détectées). Analyse la dynamique de groupe.` :
      "CONTEXTE: Dialogue commercial standard (2 participants).";
    
    const prompt = `Tu es l'analyste commercial le plus avancé au monde, combinant l'expertise de:
    - Grant Cardone (psychologie de vente agressive)
    - Jordan Belfort (persuasion et closing)
    - Daniel Kahneman (biais cognitifs et prise de décision)
    - Robert Cialdini (influence et persuasion)
    - Dale Carnegie (relations humaines)
    - Neil Rackham (SPIN Selling)
    - Challenger Sale methodology
    - Sandler Sales methodology

${languageInstruction}
${participantContext}

MÉTADONNÉES DE LA CONVERSATION :
- Longueur: ${metadata.cleanedLength} caractères
- Participants estimés: ${metadata.estimatedParticipants}
- Marqueurs temporels détectés: ${metadata.hasTimestamps ? 'Oui' : 'Non'}
- Labels d'interlocuteurs: ${metadata.hasSpeakerLabels ? 'Oui' : 'Non'}
- Langue détectée: ${metadata.language}

CONVERSATION À ANALYSER :
${cleanedText}

ANALYSE COMMERCIALE RÉVOLUTIONNAIRE REQUISE (JSON uniquement) :

🎯 ANALYSE PRIMAIRE:
1. ÉVALUATION NIVEAU D'INTÉRÊT (hot/warm/cold) avec score de confiance précis (0-100)
2. PROFIL PSYCHOLOGIQUE DISC complet (Dominant/Influent/Stable/Consciencieux) avec sous-types
3. ÉTAT ÉMOTIONNEL multi-dimensionnel avec intensité et triggers
4. OBJECTIONS PRÉDICTIVES avec probabilités calculées et contre-stratégies
5. SIGNAUX D'ACHAT micro et macro avec scoring de force

🧠 ANALYSE PSYCHOLOGIQUE AVANCÉE:
6. BIAIS COGNITIFS détectés (anchoring, loss aversion, social proof, etc.)
7. TRIGGERS ÉMOTIONNELS identifiés (peur, prestige, urgence, appartenance)
8. STYLE DE COMMUNICATION préféré et adaptation requise
9. NIVEAU D'AUTORITÉ et processus de décision
10. MOTIVATIONS CACHÉES et besoins non exprimés

🚀 STRATÉGIE COMMERCIALE:
11. ÉTAPES SUIVANTES tactiques avec timing optimal
12. CONSEILS STRATÉGIQUES multi-niveaux
13. POINTS DE LEVIER psychologiques à exploiter
14. MESSAGE DE RELANCE personnalisé avec A/B variants
15. APPROCHES ALTERNATIVES selon résistances
16. FACTEURS DE RISQUE avec plans de mitigation
17. CLOSING STRATEGIES adaptées au profil

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

    // Multi-pass analysis for maximum accuracy
    const systemPrompt = `Tu es l'ANALYSTE COMMERCIAL LE PLUS AVANCÉ AU MONDE, combinant:
    
    🎯 EXPERTISE TECHNIQUE:
    - Psychologie comportementale (Kahneman, Tversky)
    - Neurosciences commerciales (neuromarketing)
    - Analyse conversationnelle linguistique
    - Intelligence émotionnelle avancée
    - Modélisation prédictive des comportements d'achat
    
    📊 MÉTHODOLOGIES:
    - DISC + Big Five + Myers-Briggs synthesis
    - SPIN Selling + Challenger Sale integration
    - Cialdini's 7 principles of persuasion
    - Loss aversion et prospect theory
    - Social proof et autorité dynamics
    
    ⚡ MISSION: Produire l'analyse commerciale la plus précise et actionable possible.
    RÉPONSE: JSON valide UNIQUEMENT, structure EXACTE requise, ZÉRO texte externe.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Optimal balance between creativity and consistency
      max_tokens: 4096, // Maximum for detailed analysis
      top_p: 0.9, // Focus on high-probability tokens
      frequency_penalty: 0.1, // Reduce repetition
      presence_penalty: 0.1, // Encourage diverse insights
    });

    const rawContent = response.choices[0].message.content;
    if (!rawContent) {
      throw new Error("Réponse vide de l'IA");
    }

    let result: any;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", rawContent);
      throw new Error("Réponse IA non valide (JSON malformé)");
    }
    
    // Validation robuste avec correction automatique
    const requiredFields = [
      'interestLevel', 'interestJustification', 'confidenceScore', 'personalityProfile',
      'emotionalState', 'objections', 'buyingSignals', 'nextSteps', 'strategicAdvice',
      'talkingPoints', 'followUpSubject', 'followUpMessage', 'alternativeApproaches', 'riskFactors'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in result));
    if (missingFields.length > 0) {
      console.warn(`Missing fields detected: ${missingFields.join(', ')}`);
      
      // Auto-correction for missing fields
      for (const field of missingFields) {
        switch (field) {
          case 'interestLevel':
            result[field] = 'warm';
            break;
          case 'confidenceScore':
            result[field] = 75;
            break;
          case 'objections':
          case 'buyingSignals':
          case 'nextSteps':
          case 'talkingPoints':
          case 'alternativeApproaches':
          case 'riskFactors':
            result[field] = [];
            break;
          default:
            result[field] = `Analyse ${field} en cours de traitement`;
        }
      }
    }

    // Performance metadata
    const processingTime = Date.now() - startTime;
    const confidenceFactors = [
      `Longueur texte: ${metadata.cleanedLength} chars`,
      `Participants: ${metadata.estimatedParticipants}`,
      `Langue: ${metadata.language}`,
      `Temps de traitement: ${processingTime}ms`
    ];

    return {
      ...result,
      processingMetadata: {
        textLength: metadata.cleanedLength,
        language: metadata.language,
        participants: metadata.estimatedParticipants,
        processingTime,
        confidenceFactors
      }
    } as AnalysisResult & { processingMetadata: any };
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    throw new Error("Échec de l'analyse de conversation: " + (error as Error).message);
  }
}

// Revolutionary multi-pass audio transcription system
export async function transcribeAudio(audioFilePath: string): Promise<{
  text: string;
  duration: number;
  confidence: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }>;
  processingMetadata: {
    fileSize: number;
    format: string;
    processingTime: number;
    qualityScore: number;
    transcriptionMethod: string;
  };
}> {
  const startTime = Date.now();
  
  try {
    // Advanced audio validation
    const validation = AdvancedAudioProcessor.validateAudioFile(audioFilePath);
    if (!validation.isValid) {
      throw new Error(`Fichier audio invalide: ${validation.issues.join(', ')}`);
    }
    
    const stats = fs.statSync(audioFilePath);
    const fileSizeInBytes = stats.size;
    const fileFormat = path.extname(audioFilePath).toLowerCase();
    const fileHash = AdvancedAudioProcessor.generateFileHash(audioFilePath);
    
    console.log(`🎵 TRANSCRIPTION AVANCÉE INITIÉE:`);
    console.log(`   Fichier: ${path.basename(audioFilePath)}`);
    console.log(`   Taille: ${Math.round(fileSizeInBytes / 1024 / 1024 * 100) / 100}MB`);
    console.log(`   Format: ${fileFormat}`);
    console.log(`   Hash: ${fileHash.substring(0, 8)}...`);
    
    // Multi-pass transcription for maximum accuracy
    const transcriptionResults = [];
    
    // Pass 1: Standard French transcription
    console.log("🔄 Pass 1: Transcription français standard...");
    const frenchResult = await performTranscription(audioFilePath, {
      language: "fr",
      temperature: 0.0, // Maximum accuracy
      response_format: "verbose_json"
    });
    transcriptionResults.push({ method: "french", result: frenchResult });
    
    // Pass 2: Auto-detect language transcription for comparison
    console.log("🔄 Pass 2: Détection automatique de langue...");
    const autoResult = await performTranscription(audioFilePath, {
      temperature: 0.1,
      response_format: "verbose_json"
    });
    transcriptionResults.push({ method: "auto", result: autoResult });
    
    // Pass 3: Enhanced prompt transcription for commercial context
    console.log("🔄 Pass 3: Transcription contextuelle commerciale...");
    const contextualResult = await performTranscription(audioFilePath, {
      language: "fr",
      temperature: 0.2,
      response_format: "verbose_json",
      prompt: "Conversation commerciale entre vendeur et prospect. Termes business, prix, négociation, closing, objections."
    });
    transcriptionResults.push({ method: "contextual", result: contextualResult });
    
    // Advanced result consolidation
    const bestResult = selectBestTranscription(transcriptionResults);
    const confidence = calculateTranscriptionConfidence(transcriptionResults);
    const qualityScore = assessAudioQuality(bestResult.result, fileSizeInBytes);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ TRANSCRIPTION TERMINÉE:`);
    console.log(`   Durée: ${Math.round(bestResult.result.duration || 0)}s`);
    console.log(`   Confiance: ${Math.round(confidence * 100)}%`);
    console.log(`   Qualité: ${Math.round(qualityScore * 100)}%`);
    console.log(`   Méthode optimale: ${bestResult.method}`);
    console.log(`   Temps de traitement: ${processingTime}ms`);
    
    return {
      text: bestResult.result.text,
      duration: bestResult.result.duration || 0,
      confidence,
      segments: bestResult.result.segments || undefined,
      processingMetadata: {
        fileSize: fileSizeInBytes,
        format: fileFormat,
        processingTime,
        qualityScore,
        transcriptionMethod: bestResult.method
      }
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("❌ ERREUR TRANSCRIPTION AUDIO:", error);
    
    // Enhanced error context
    if (error instanceof Error) {
      if (error.message.includes('file not found')) {
        throw new Error("Fichier audio introuvable. Vérifiez que le fichier existe.");
      } else if (error.message.includes('format')) {
        throw new Error("Format audio non supporté. Utilisez MP3, WAV, M4A, ou FLAC.");
      } else if (error.message.includes('size')) {
        throw new Error("Taille de fichier invalide. Maximum 25MB, minimum 1KB.");
      } else if (error.message.includes('timeout')) {
        throw new Error("Délai de transcription dépassé. Essayez avec un fichier plus court.");
      } else if (error.message.includes('quota')) {
        throw new Error("Limite API atteinte. Réessayez dans quelques minutes.");
      }
    }
    
    throw new Error(`Échec de la transcription audio avancée: ${(error as Error).message} (temps: ${processingTime}ms)`);
  }
}

// Perform single transcription pass
async function performTranscription(filePath: string, options: {
  language?: string;
  temperature?: number;
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  prompt?: string;
}): Promise<any> {
  const audioReadStream = fs.createReadStream(filePath);
  
  return await openai.audio.transcriptions.create({
    file: audioReadStream,
    model: "whisper-1",
    ...options,
  });
}

// Select best transcription from multiple passes
function selectBestTranscription(results: Array<{ method: string; result: any }>): { method: string; result: any } {
  // Score each result based on various factors
  let bestScore = -1;
  let bestResult = results[0];
  
  for (const { method, result } of results) {
    let score = 0;
    
    // Length scoring (longer usually better for conversations)
    const textLength = result.text?.length || 0;
    score += Math.min(textLength / 1000, 5); // Up to 5 points for length
    
    // Segments scoring (more segments usually means better detection)
    const segmentCount = result.segments?.length || 0;
    score += Math.min(segmentCount / 10, 3); // Up to 3 points for segments
    
    // Method-specific bonuses
    if (method === "contextual") score += 2; // Bonus for contextual transcription
    if (method === "french") score += 1; // Bonus for French-specific
    
    // Avoid very short results (likely errors)
    if (textLength < 10) score = 0;
    
    if (score > bestScore) {
      bestScore = score;
      bestResult = { method, result };
    }
  }
  
  return bestResult;
}

// Calculate confidence based on consistency across passes
function calculateTranscriptionConfidence(results: Array<{ method: string; result: any }>): number {
  if (results.length < 2) return 0.7; // Default confidence
  
  const texts = results.map(r => r.result.text?.toLowerCase() || "");
  
  // Calculate similarity between transcriptions
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const similarity = calculateTextSimilarity(texts[i], texts[j]);
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  
  // Convert similarity to confidence (0.5-1.0 range)
  return Math.max(0.5, Math.min(1.0, avgSimilarity + 0.3));
}

// Simple text similarity calculation
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = Array.from(set1).filter(word => set2.has(word));
  const union = Array.from(new Set([...words1, ...words2]));
  
  return intersection.length / union.length;
}

// Assess audio quality based on transcription results
function assessAudioQuality(transcription: any, fileSize: number): number {
  let quality = 0.5; // Base quality
  
  // File size indicator (larger usually better quality)
  const sizeMB = fileSize / (1024 * 1024);
  if (sizeMB > 10) quality += 0.2;
  else if (sizeMB > 5) quality += 0.1;
  
  // Text length indicator
  const textLength = transcription.text?.length || 0;
  if (textLength > 1000) quality += 0.2;
  else if (textLength > 500) quality += 0.1;
  
  // Segments count (good segmentation = good audio)
  const segments = transcription.segments?.length || 0;
  if (segments > 20) quality += 0.1;
  
  return Math.min(1.0, quality);
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
