import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface AudioUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (audioUrl: string, fileName: string, fileSize: number) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * A specialized audio file upload component that renders as a button and provides 
 * a modal interface for audio file management.
 * 
 * Features:
 * - Renders as a customizable button that opens an audio upload modal
 * - Provides a modal interface for:
 *   - Audio file selection (MP3, WAV, M4A, etc.)
 *   - File preview and audio playback
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 50MB for audio)
 * @param props.onComplete - Callback function called when upload is complete with audio URL,
 *   file name, and file size. Used to trigger transcription.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function AudioUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 52428800, // 50MB default for audio files
  onComplete,
  buttonClassName,
  children,
  disabled = false,
}: AudioUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          const response = await apiRequest("POST", "/api/audio/upload");
          const data = await response.json();
          return {
            method: "PUT" as const,
            url: data.uploadURL,
          };
        },
      })
      .on("complete", (result) => {
        if (result.successful && result.successful.length > 0) {
          const file = result.successful[0];
          onComplete?.(file.uploadURL || "", file.name || "", file.size || 0);
        }
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={disabled}
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}