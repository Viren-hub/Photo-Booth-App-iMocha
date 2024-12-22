import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebcamService {
  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private isRecordingSubject = new BehaviorSubject<boolean>(false);
  isRecording$ = this.isRecordingSubject.asObservable();
  private stream: MediaStream | null = null;

  // Starts the webcam and returns the video stream.
  async startWebcam(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      return this.stream;
    } catch (error) {
      throw new Error('Camera access denied. Please allow camera access to proceed.');
    }
  }

  // Stops the webcam and releases the media stream.
  stopWebcam(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  // Captures a photo from the video feed and returns it as a base64 string.
  takePhoto(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): string {
    const canvas = canvasElement;
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  // Starts recording the video stream.
  startRecording(): void {
    if (this.stream) {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'video/webm' });

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.recordedChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecordingSubject.next(true);
    }
  }

  // Stops the recording and returns the recorded video as a URL.
  stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          this.isRecordingSubject.next(false);
          resolve(videoUrl);
        };

        this.mediaRecorder.stop();
      } else {
        resolve('');
      }
    });
  }
}
