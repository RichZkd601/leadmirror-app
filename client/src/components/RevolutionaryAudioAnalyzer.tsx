import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileAudio, Loader2, CheckCircle2, Zap, Sparkles, Brain, Target, MessageSquare, TrendingUp, Mic, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analysis } from "@shared/schema";

interface RevolutionaryAudioAnalyzerProps {
  onAnalysisComplete: (analysis: Analysis & { revolutionaryInsights?: any }) => void;
  className?: string;
}

export function RevolutionaryAudioAnalyzer({ onAnalysisComplete, className }: RevolutionaryAudioAnalyzerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [processingStats, setProcessingStats] = useState<any>(null);
  
  const revolutionaryAnalysisMutation = useMutation({
    mutationFn: async (data: { file: File; title: string }) => {
      const formData = new FormData();
      formData.append('audio', data.file);
      formData.append('title', data.title);

      // Custom fetch with detailed progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(Math.min(progress, 30)); // Upload is just first 30%
            
            if (progress < 100) {
              setCurrentStep("📤 Téléchargement sécurisé du fichier audio...");
            } else {
              setCurrentStep("🔍 Validation et optimisation audio...");
              setUploadProgress(35);
            }
          }
        });

        // Simulate processing steps for better UX
        xhr.addEventListener('loadstart', () => {
          setTimeout(() => {
            setCurrentStep("🎵 Analyse de la qualité audio...");
            setUploadProgress(40);
          }, 1000);
          
          setTimeout(() => {
            setCurrentStep("🔧 Optimisation pour transcription...");
            setUploadProgress(50);
          }, 2500);
          
          setTimeout(() => {
            setCurrentStep("🚀 Transcription multi-passes révolutionnaire...");
            setUploadProgress(65);
          }, 4000);
          
          setTimeout(() => {
            setCurrentStep("🧠 Analyse IA psychologique avancée...");
            setUploadProgress(80);
          }, 8000);
          
          setTimeout(() => {
            setCurrentStep("✨ Génération d'insights révolutionnaires...");
            setUploadProgress(95);
          }, 12000);
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setCurrentStep("✅ Analyse révolutionnaire terminée !");
            setUploadProgress(100);
            
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error('Réponse invalide du serveur'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Erreur de traitement révolutionnaire'));
            } catch {
              reject(new Error(`Erreur HTTP: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur de connexion au système révolutionnaire'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Délai de traitement révolutionnaire dépassé'));
        });

        xhr.open('POST', '/api/revolutionary-audio-analysis');
        xhr.timeout = 600000; // 10 minutes timeout for complex analysis
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      setCurrentStep("🎯 Analyse révolutionnaire terminée avec succès !");
      setUploadProgress(100);
      setProcessingStats(data.revolutionaryInsights);
      
      const totalTime = data.revolutionaryInsights?.processingStats?.totalTime || 0;
      const confidence = data.revolutionaryInsights?.transcriptionMetadata?.confidence || 0;
      
      toast({
        title: "🚀 Analyse Révolutionnaire Terminée",
        description: `Traitement en ${Math.round(totalTime / 1000)}s avec ${Math.round(confidence * 100)}% de confiance`,
      });
      
      onAnalysisComplete(data.analysis);
      
      // Reset state after showing results
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setCurrentStep("");
        setAnalysisTitle("");
        setProcessingStats(null);
      }, 3000);
    },
    onError: (error: Error) => {
      console.error('Erreur analyse révolutionnaire:', error);
      setCurrentStep("");
      setUploadProgress(0);
      setProcessingStats(null);
      
      toast({
        title: "❌ Erreur d'Analyse Révolutionnaire",
        description: error.message || "Une erreur s'est produite lors du traitement révolutionnaire",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/mp4', 
      'audio/flac', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-m4a'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Formats révolutionnaires acceptés : MP3, WAV, M4A, FLAC, OGG, AAC",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `Limite révolutionnaire : 25MB. Votre fichier : ${Math.round(file.size / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-generate title if empty
    if (!analysisTitle) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setAnalysisTitle(`Analyse Révolutionnaire - ${baseName}`);
    }
  };

  const handleStartRevolutionaryAnalysis = () => {
    if (!selectedFile) {
      toast({
        title: "Fichier requis",
        description: "Sélectionnez un fichier audio pour l'analyse révolutionnaire",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep("🚀 Initialisation du système révolutionnaire...");
    setUploadProgress(5);
    revolutionaryAnalysisMutation.mutate({
      file: selectedFile,
      title: analysisTitle
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fileInput = fileInputRef.current;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        handleFileSelect({ target: fileInput } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isProcessing = revolutionaryAnalysisMutation.isPending;

  return (
    <Card className={`${className || ""} border-2 border-dashed ${isProcessing ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950' : 'border-purple-300 hover:border-purple-400'} transition-all duration-300`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
          <div className="relative">
            <Zap className={`h-8 w-8 ${isProcessing ? 'text-purple-600 animate-pulse' : 'text-purple-600'}`} />
            {isProcessing && <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-spin" />}
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analyse Audio Révolutionnaire
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Transcription multi-passes + Analyse IA psychologique complète en une seule étape
        </CardDescription>
        
        {/* Revolutionary Features */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-300">
            <Brain className="w-3 h-3 mr-1" />
            IA Avancée
          </Badge>
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900 dark:to-cyan-900 dark:text-blue-300">
            <Mic className="w-3 h-3 mr-1" />
            Multi-passes
          </Badge>
          <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900 dark:to-emerald-900 dark:text-green-300">
            <Target className="w-3 h-3 mr-1" />
            Insights Profonds
          </Badge>
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-900 dark:to-red-900 dark:text-orange-300">
            <Radio className="w-3 h-3 mr-1" />
            Optimisation Auto
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="analysis-title">Titre de l&apos;analyse (optionnel)</Label>
          <Input
            id="analysis-title"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Laissez vide pour génération automatique"
            disabled={isProcessing}
          />
        </div>
        
        <Separator />
        
        {/* File Upload Area */}
        <div
          className="text-center space-y-4 p-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute top-0 right-0 animate-bounce" />
              </div>
            ) : selectedFile ? (
              <div className="relative">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <Zap className="h-6 w-6 text-purple-600 absolute -top-2 -right-2" />
              </div>
            ) : (
              <div className="relative">
                <FileAudio className="h-16 w-16 text-gray-400" />
                <Upload className="h-6 w-6 text-purple-600 absolute -top-2 -right-2" />
              </div>
            )}
          </div>

          {!selectedFile && !isProcessing && (
            <>
              <div>
                <h3 className="text-xl font-semibold">Glissez-déposez votre fichier audio</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  ou cliquez pour sélectionner votre conversation à analyser
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Formats révolutionnaires : MP3, WAV, M4A, FLAC, OGG, AAC • Maximum 25MB
              </p>
            </>
          )}

          {selectedFile && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <FileAudio className="h-6 w-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleStartRevolutionaryAnalysis} 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
                  disabled={isProcessing}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Lancer l&apos;Analyse Révolutionnaire
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                  className="w-full"
                  disabled={isProcessing}
                >
                  Changer de fichier
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="font-semibold text-lg">{selectedFile?.name}</span>
              </div>
              
              <div className="space-y-3">
                <Progress value={uploadProgress} className="w-full h-3" />
                <p className="text-purple-700 dark:text-purple-300 font-medium text-lg">{currentStep}</p>
                <p className="text-sm text-gray-600">
                  {uploadProgress}% • {formatFileSize(selectedFile?.size || 0)}
                </p>
              </div>
              
              {/* Processing Features Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
                  <span>Analyse Psychologique</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>Génération Réponses</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 animate-pulse" />
                  <span>Scoring Intérêt</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="w-4 h-4 text-red-600 animate-pulse" />
                  <span>Stratégies Closing</span>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!selectedFile && !isProcessing && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 text-lg border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <Upload className="w-5 h-5 mr-2" />
              Sélectionner un Fichier Audio
            </Button>
          )}
        </div>
        
        {/* Processing Stats Display */}
        {processingStats && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              ✅ Traitement Révolutionnaire Terminé
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 dark:text-green-400">Temps Total:</span>
                <span className="ml-2 font-mono">{Math.round((processingStats.processingStats?.totalTime || 0) / 1000)}s</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-400">Confiance:</span>
                <span className="ml-2 font-mono">{Math.round((processingStats.transcriptionMetadata?.confidence || 0) * 100)}%</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-400">Qualité Audio:</span>
                <span className="ml-2 font-mono">{Math.round((processingStats.audioMetadata?.qualityScore || 0) * 100)}%</span>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-400">Optimisations:</span>
                <span className="ml-2 font-mono">{processingStats.processingStats?.optimizations?.length || 0}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}