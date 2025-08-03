import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, FileAudio, Mic, Brain, Zap, MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, FlipHorizontal2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AudioUploader } from "@/components/AudioUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analysis, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AudioMetadata {
  duration: number;
  fileSize: number;
  fileName: string;
  audioPath: string;
}

export default function AudioAnalysis() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: userLoading } = useAuth();
  const [transcription, setTranscription] = useState("");
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Analysis & { audioInsights?: any } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
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
  }, [isAuthenticated, userLoading, toast]);

  // Audio analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: {
      transcriptionText: string;
      title: string;
      audioPath: string;
      fileName: string;
      duration: number;
      fileSize: number;
    }) => {
      const response = await apiRequest("POST", "/api/analyze-audio", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast({
        title: "Analyse terminée",
        description: "L'analyse IA de votre conversation audio est maintenant disponible.",
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser la conversation audio.",
        variant: "destructive",
      });
    },
  });

  const handleTranscriptionComplete = (
    transcriptionText: string,
    metadata: AudioMetadata
  ) => {
    setTranscription(transcriptionText);
    setAudioMetadata(metadata);
  };

  const handleAnalyze = () => {
    if (!transcription || !audioMetadata) {
      toast({
        title: "Transcription manquante",
        description: "Veuillez d'abord uploader et transcrire un fichier audio.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    analyzeMutation.mutate({
      transcriptionText: transcription,
      title: analysisTitle || "Analyse audio",
      audioPath: audioMetadata.audioPath,
      fileName: audioMetadata.fileName,
      duration: audioMetadata.duration,
      fileSize: audioMetadata.fileSize,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case "hot": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "warm": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "cold": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.location.href = "/dashboard"}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <FileAudio className="w-8 h-8 text-blue-500" />
            <span>Analyse audio IA</span>
          </h1>
          <p className="text-muted-foreground">
            Uploadez et analysez vos appels commerciaux avec l'IA Whisper et GPT-4o
          </p>
        </div>
      </div>

      {/* Usage Info */}
      {user && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    {user.isPremium ? "Premium - Analyses illimitées" : `Plan gratuit - ${user.monthlyAnalysesUsed || 0}/3 analyses utilisées ce mois`}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {user.isPremium ? "Transcription et analyse audio avancée incluses" : "Upgrade vers Premium pour des analyses illimitées"}
                  </p>
                </div>
              </div>
              {!user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3 && (
                <Link href="/subscribe">
                  <Button size="sm">
                    Upgrade vers Premium
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Upload and Configuration */}
        <div className="space-y-6">
          {/* Audio Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="w-5 h-5" />
                <span>Upload de fichier audio</span>
              </CardTitle>
              <CardDescription>
                Uploadez un enregistrement d'appel commercial pour transcription et analyse IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioUploader
                onGetUploadParameters={async () => {
                  const response = await apiRequest("POST", "/api/audio/upload");
                  const data = await response.json();
                  return {
                    method: "PUT" as const,
                    url: data.uploadURL,
                  };
                }}
                onComplete={async (result) => {
                  if (result.successful && result.successful.length > 0) {
                    const file = result.successful[0];
                    const uploadURL = file.uploadURL;
                    
                    try {
                      // Start transcription
                      const transcriptionResponse = await apiRequest("POST", "/api/audio/transcribe", {
                        audioURL: uploadURL,
                        fileName: file.name,
                        fileSize: file.size,
                        duration: 0 // Will be calculated by server
                      });
                      
                      const transcriptionData = await transcriptionResponse.json();
                      
                      handleTranscriptionComplete(transcriptionData.transcription, {
                        duration: transcriptionData.duration || 0,
                        fileSize: file.size || 0,
                        fileName: file.name || "audio.wav",
                        audioPath: transcriptionData.audioPath || ""
                      });
                      
                      toast({
                        title: "Transcription réussie",
                        description: "Le fichier audio a été transcrit avec succès. Vous pouvez maintenant lancer l'analyse.",
                      });
                    } catch (error) {
                      toast({
                        title: "Erreur de transcription",
                        description: "Impossible de transcrire le fichier audio.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <FileAudio className="w-4 h-4" />
                  <span>Sélectionner fichier audio</span>
                </div>
              </AudioUploader>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Formats supportés: MP3, WAV, M4A, AAC, FLAC, OGG</p>
                <p>Taille max: 50MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Configuration */}
          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Configuration de l'analyse</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de l'analyse</Label>
                  <Input
                    id="title"
                    value={analysisTitle}
                    onChange={(e) => setAnalysisTitle(e.target.value)}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                {audioMetadata && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Informations audio</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fichier</p>
                        <p className="font-medium">{audioMetadata.fileName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Durée</p>
                        <p className="font-medium">{formatDuration(audioMetadata.duration)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taille</p>
                        <p className="font-medium">{formatFileSize(audioMetadata.fileSize)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Statut</p>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Transcrit
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !transcription || (user && !user.isPremium && (user.monthlyAnalysesUsed || 0) >= 3)}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyser la conversation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Transcription and Results */}
        <div className="space-y-6">
          {/* Transcription Preview */}
          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Transcription</span>
                </CardTitle>
                <CardDescription>
                  Texte transcrit de votre fichier audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{transcription}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Interest Level & Confidence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Niveau d'intérêt détecté</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getInterestLevelColor(analysisResult.interestLevel)}>
                      {analysisResult.interestLevel.toUpperCase()}
                    </Badge>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{analysisResult.confidenceScore}%</p>
                      <p className="text-sm text-muted-foreground">Confiance</p>
                    </div>
                  </div>
                  <p className="text-sm">{analysisResult.interestJustification}</p>
                </CardContent>
              </Card>

              {/* Audio Insights */}
              {analysisResult.audioInsights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mic className="w-5 h-5" />
                      <span>Insights audio avancés</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Rythme de conversation</p>
                        <p className="font-medium capitalize">{analysisResult.audioInsights.conversationPacing}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Répartition de parole</p>
                        <p className="font-medium">
                          Vendeur: {analysisResult.audioInsights.speakingRatio.seller}% | 
                          Prospect: {analysisResult.audioInsights.speakingRatio.prospect}%
                        </p>
                      </div>
                    </div>

                    {analysisResult.audioInsights.silencePeriods.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Moments de silence significatifs</p>
                        <ul className="text-sm space-y-1">
                          {analysisResult.audioInsights.silencePeriods.map((period: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{period}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.audioInsights.audioQualityNotes.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notes sur la qualité audio</p>
                        <ul className="text-sm space-y-1">
                          {analysisResult.audioInsights.audioQualityNotes.map((note: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/analysis/${analysisResult.id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        Voir l'analyse complète
                      </Button>
                    </Link>
                    <Button 
                      className="flex-1 w-full" 
                      variant="outline"
                      onClick={() => window.location.href = "/dashboard"}
                    >
                      Retour au tableau de bord
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <FlipHorizontal2 className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">LeadMirror</span>
              </div>
              <p className="text-sm text-muted-foreground">
                L'IA révolutionnaire pour analyser vos conversations commerciales et multiplier vos conversions.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Produit</h4>
              <nav className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/analytics" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
                <Link href="/integrations" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Intégrations CRM
                </Link>
                <Link href="/audio-analysis" className="block text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                  Analyse Audio IA
                </Link>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Entreprise</h4>
              <nav className="space-y-2">
                <Link href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sécurité & RGPD
                </Link>
                <a href="mailto:contact@leadmirror.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
                <a href="mailto:support@leadmirror.com" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </a>
              </nav>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Légal</h4>
              <nav className="space-y-2">
                <Link href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Confidentialité
                </Link>
                <Link href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Conditions d'utilisation
                </Link>
                <Link href="/security" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border pt-8">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium text-foreground">
                LeadMirror © 2025 — Tous droits réservés
              </div>
              <div className="text-sm text-muted-foreground">
                Solution conçue pour les professionnels de la vente | IA de nouvelle génération (GPT-4o + Whisper) | Respect des normes RGPD
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}