import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Mic, 
  FileAudio, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Play,
  Pause,
  X
} from "lucide-react";

interface AudioUploaderProps {
  onTranscriptionComplete: (transcription: string, audioMetadata: {
    duration: number;
    fileSize: number;
    fileName: string;
    audioPath: string;
  }) => void;
  isAnalyzing?: boolean;
}

interface UploadedAudio {
  file: File;
  url: string;
  duration: number;
  transcription?: string;
  audioPath?: string;
}

export function AudioUploader({ onTranscriptionComplete, isAnalyzing = false }: AudioUploaderProps) {
  const { toast } = useToast();
  const [uploadedAudio, setUploadedAudio] = useState<UploadedAudio | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Upload audio file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Get upload URL
      const uploadResponse = await apiRequest("POST", "/api/audio/upload");
      const { uploadURL } = await uploadResponse.json();

      // Upload file to object storage
      setUploadProgress(0);
      const xhr = new XMLHttpRequest();
      
      return new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(uploadURL);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    },
    onSuccess: (uploadURL, file) => {
      toast({
        title: "Fichier audio uploadé",
        description: "Démarrage de la transcription...",
      });

      // Create audio element for playback
      const audio = new Audio(URL.createObjectURL(file));
      setAudioElement(audio);

      audio.addEventListener('loadedmetadata', () => {
        const audioData: UploadedAudio = {
          file,
          url: URL.createObjectURL(file),
          duration: audio.duration,
        };
        setUploadedAudio(audioData);
        
        // Start transcription
        transcribeMutation.mutate({
          audioURL: uploadURL,
          fileName: file.name,
          fileSize: file.size,
          duration: audio.duration
        });
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'upload",
        description: error.message || "Impossible d'uploader le fichier audio.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Transcribe audio mutation
  const transcribeMutation = useMutation({
    mutationFn: async (data: {
      audioURL: string;
      fileName: string;
      fileSize: number;
      duration: number;
    }) => {
      setTranscriptionProgress(0);
      
      // Simulate transcription progress
      const progressInterval = setInterval(() => {
        setTranscriptionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await apiRequest("POST", "/api/audio/transcribe", {
        audioURL: data.audioURL,
        fileName: data.fileName,
        fileSize: data.fileSize,
        duration: data.duration
      });
      
      clearInterval(progressInterval);
      setTranscriptionProgress(100);
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Transcription terminée",
        description: "L'audio a été transcrit avec succès.",
      });

      if (uploadedAudio) {
        const updatedAudio = {
          ...uploadedAudio,
          transcription: data.transcription,
          audioPath: data.audioPath
        };
        setUploadedAudio(updatedAudio);

        // Call the completion callback
        onTranscriptionComplete(data.transcription, {
          duration: variables.duration,
          fileSize: variables.fileSize,
          fileName: variables.fileName,
          audioPath: data.audioPath
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur de transcription",
        description: error.message || "Impossible de transcrire l'audio.",
        variant: "destructive",
      });
      setTranscriptionProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedFormats = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm'];
    if (!supportedFormats.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier MP3, WAV, M4A ou WebM.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 25MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const togglePlayback = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const removeAudio = () => {
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(uploadedAudio?.url || "");
    }
    setUploadedAudio(null);
    setAudioElement(null);
    setUploadProgress(0);
    setTranscriptionProgress(0);
    setIsPlaying(false);
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

  if (uploadedAudio) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileAudio className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Fichier audio</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeAudio}
              disabled={isAnalyzing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                disabled={!audioElement}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div>
                <p className="font-medium text-sm">{uploadedAudio.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(uploadedAudio.duration)} • {formatFileSize(uploadedAudio.file.size)}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              {transcribeMutation.isPending ? (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Transcription...
                </Badge>
              ) : uploadedAudio.transcription ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Transcrit
                </Badge>
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  En attente
                </Badge>
              )}
            </div>
          </div>

          {/* Transcription Progress */}
          {transcribeMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Transcription en cours...</span>
                <span>{Math.round(transcriptionProgress)}%</span>
              </div>
              <Progress value={transcriptionProgress} className="w-full" />
            </div>
          )}

          {/* Transcription Preview */}
          {uploadedAudio.transcription && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Transcription:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-3">
                {uploadedAudio.transcription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5" />
          <span>Upload audio d'appel</span>
        </CardTitle>
        <CardDescription>
          Uploadez un fichier audio de conversation commerciale pour l'analyser avec l'IA Whisper
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* File Input */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending || transcribeMutation.isPending}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Cliquez pour sélectionner un fichier audio
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, M4A ou WebM (max 25MB)
                </p>
              </div>
            </label>
          </div>

          {/* Format Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Formats supportés:</strong> MP3, WAV, M4A, WebM
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              La transcription utilise l'IA Whisper d'OpenAI pour une précision maximale
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}