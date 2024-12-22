import { Component, ElementRef, ViewChild, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { WebcamService } from '../../services/webcam.service';

@Component({
  selector: 'app-webcam-preview',
  templateUrl: './webcam-preview.component.html',
  styleUrls: ['./webcam-preview.component.css'],
})
export class WebcamPreviewComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  videoUrl: string | null = null;
  isRecording = false;
  elapsedTime: string = '00:00'; 
  private startTime: number = 0;
  private timerInterval!: any;
  errorMessage: string | null = null;

  @Output() capture = new EventEmitter<{ content: string, isVideo: boolean }>();

  constructor(private webcamService: WebcamService) {}

  // Initializes the webcam and subscribes to the recording state.
  ngOnInit(): void {
    this.webcamService.startWebcam().then((stream) => {
      this.videoElement.nativeElement.srcObject = stream;
    }).catch((error: Error) => {
      this.errorMessage = error.message; 
    });

    this.webcamService.isRecording$.subscribe((state) => {
      this.isRecording = state;
      if (this.isRecording) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  // Captures a photo from the video feed and emits the photo data.
  takePhoto(): void {
    const imageUrl = this.webcamService.takePhoto(
      this.videoElement.nativeElement,
      this.canvasElement.nativeElement
    );

    this.capture.emit({ content: imageUrl, isVideo: false });
  }

  // Starts recording the video feed.
  startRecording(): void {
    this.webcamService.startRecording();
  }

  // Stops recording the video feed and emits the video data.
  stopRecording(): void {
    this.webcamService.stopRecording().then((videoUrl) => {
      this.capture.emit({ content: videoUrl, isVideo: true });
      this.videoUrl = videoUrl;
    });
  }

  // Starts the recording timer.
  private startTimer(): void {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsedMilliseconds = Date.now() - this.startTime;
      const minutes = Math.floor(elapsedMilliseconds / 60000);
      const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
      this.elapsedTime = `${this.padZero(minutes)}:${this.padZero(seconds)}`;
    }, 1000);
  }

  // Stops the recording timer and resets the elapsed time.
  private stopTimer(): void {
    clearInterval(this.timerInterval);
    this.elapsedTime = '00:00'; 
  }

  // Pads single-digit numbers with a leading zero.
  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  // Cleans up resources when the component is destroyed.
  ngOnDestroy(): void {
    this.stopTimer();
    this.webcamService.stopWebcam();
  }
}
