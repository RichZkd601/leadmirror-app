import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileAudio, Loader2, CheckCircle2, AlertCircle, Music, Radio, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DirectAudioUploaderProps {
  onSuccess: (result: {
    transcription: {
      text: string;
      duration: number;
      confidence: number;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
        confidence?: number;
      }>;
    };
    audioMetadata: {
      duration: number;
      sampleRate: number;
      channels: number;
      bitrate: number;
      format: string;
      codec: string;
      qualityScore: number;
      qualityIssues: string[];
      recommendations: string[];
    };
    processingStats: {
      totalTime: number;
      transcriptionTime: number;
      optimizations: string[];
      method: string;
    };
    uploadMetadata: {
      originalName: string;
      size: number;
      mimetype: string;
      uploadTime: number;
    };
  }) => void;
  className?: string;
}

export function DirectAudioUploader({ onSuccess, className }: DirectAudioUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('audio', file);

      // Custom fetch with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
            
            if (progress < 100) {
              setCurrentStep("Téléchargement du fichier audio...");
            } else {
              setCurrentStep("Traitement et transcription en cours...");
            }
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error('Réponse invalide du serveur'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Erreur de traitement'));
            } catch {
              reject(new Error(`Erreur HTTP: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erreur de connexion'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Délai de traitement dépassé'));
        });

        xhr.open('POST', '/api/direct-audio-upload');
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      setCurrentStep("Analyse terminée avec succès !");
      setUploadProgress(100);
      
      toast({
        title: "Analyse audio révolutionnaire terminée",
        description: `Transcription de ${Math.round(data.transcription.duration)}s avec ${Math.round(data.transcription.confidence * 100)}% de confiance`,
      });
      
      onSuccess(data);
      
      // Reset state
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setCurrentStep("");
      }, 2000);
    },
    onError: (error: Error) => {
      console.error('Erreur upload audio direct:', error);
      setCurrentStep("");
      setUploadProgress(0);
      
      toast({
        title: "Erreur d'analyse audio",
        description: error.message || "Une erreur s'est produite lors du traitement",
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
        description: "Formats acceptés : MP3, WAV, M4A, FLAC, OGG, AAC",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `Taille maximum : 25MB. Votre fichier : ${Math.round(file.size / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setCurrentStep("Préparation de l'analyse...");
    setUploadProgress(0);
    uploadMutation.mutate(selectedFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
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

  const isUploading = uploadMutation.isPending;

  return (
    <Card className={`${className || ""} border-dashed ${isUploading ? 'border-primary' : 'border-gray-300'}`}>
      <CardContent className="p-6">
        <div
          className="text-center space-y-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex justify-center">
            {isUploading ? (
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <Zap className="h-4 w-4 text-yellow-500 absolute top-1 right-1" />
              </div>
            ) : selectedFile ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <div className="relative">
                <FileAudio className="h-12 w-12 text-gray-400" />
                <Upload className="h-4 w-4 text-primary absolute -top-1 -right-1" />
              </div>
            )}
          </div>

          {!selectedFile && !isUploading && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Analyse Audio Révolutionnaire</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Transcription et analyse IA en une seule étape
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">
                  <Music className="w-3 h-3 mr-1" />
                  Multi-passes IA
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Radio className="w-3 h-3 mr-1" />
                  Optimisation audio
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Traitement révolutionnaire
                </Badge>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Glissez-déposez votre fichier audio ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-gray-400">
                Formats : MP3, WAV, M4A, FLAC, OGG, AAC • Maximum 25MB
              </p>
            </>
          )}

          {selectedFile && !isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <FileAudio className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </p>
              
              <div className="flex space-x-2 justify-center">
                <Button onClick={handleUpload} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Lancer l&apos;analyse révolutionnaire
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">{selectedFile?.name}</span>
              </div>
              
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-primary font-medium">{currentStep}</p>
                {uploadProgress > 0 && (
                  <p className="text-xs text-gray-500">
                    {uploadProgress}% • {formatFileSize(selectedFile?.size || 0)}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  IA révolutionnaire
                </Badge>
                <Badge variant="outline" className="text-xs animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  Traitement avancé
                </Badge>
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
          
          {!selectedFile && !isUploading && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Sélectionner un fichier audio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}