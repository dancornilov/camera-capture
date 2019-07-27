import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';

enum CameraStatuses {
  disabled = 'disabled',
  enabled = 'enabled',
  taken = 'taken'
}

@Component({
  selector: 'app-camera-capture',
  templateUrl: './camera-capture.component.html',
  styleUrls: ['./camera-capture.component.scss']
})
export class CameraCaptureComponent implements OnDestroy {
  @ViewChild('video') public video: ElementRef;
  @ViewChild('canvas') public canvas: ElementRef;
  @Output() public capture: EventEmitter<File> = new EventEmitter<File>();

  public captured: Blob;
  public enabled: boolean;
  public status: CameraStatuses;
  public statuses = CameraStatuses;
  private stream: MediaStream;

  constructor() {
    this.status = CameraStatuses.disabled;
  }

  public ngOnDestroy(): void {
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop();
    }
  }

  public getButtonName(): string {
    switch (this.status) {
      case CameraStatuses.disabled:
        return 'Start';
      case CameraStatuses.enabled:
        return 'Take Photo';
      case CameraStatuses.taken:
        return 'Retake Photo';
      default:
        break;
    }
  }

  public getMobileName(): string {
    return this.captured ? 'Retake Photo' : 'Take Photo';
  }

  public executeButtonAction(): void {
    switch (this.status) {
      case CameraStatuses.disabled:
        this.enableCamera();
        break;
      case CameraStatuses.enabled:
        this.makeCapture();
        break;
      case CameraStatuses.taken:
        this.resetCanvas();
        break;
      default:
        break;
    }
  }

  public onFileSelected(event) {
    const file = event.target.files[0];
    const img = new Image();

    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (evt: any) => {
        if (evt.target.readyState === FileReader.DONE) {
          img.src = evt.target.result;
          img.onload = () => this.canvas.nativeElement.getContext('2d').drawImage(img, 0, 0, 640, 480);

          this.captured = this.canvas.nativeElement.toDataURL('image/png');
          this.dataURItoBlob(this.canvas.nativeElement.toDataURL('image/png'));
        }
      };
    }
  }

  private enableCamera(): void {
    this.status = CameraStatuses.enabled;
    this.enabled = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.stream = stream;

        try {
          this.video.nativeElement.srcObject = stream;
        } catch (error) {
          this.video.nativeElement.src = URL.createObjectURL(stream);
        }

        this.video.nativeElement.play();
      }).catch(() => {
        console.log('Please give access to camera');
        this.status = CameraStatuses.disabled;
      });
    }
  }

  private makeCapture(): void {
    this.status = CameraStatuses.taken;
    this.canvas.nativeElement.getContext('2d').drawImage(this.video.nativeElement, 0, 0, 640, 480);

    this.captured = this.canvas.nativeElement.toDataURL('image/png');
    this.dataURItoBlob(this.canvas.nativeElement.toDataURL('image/png'));
  }

  private resetCanvas() {
    this.status = CameraStatuses.enabled;
    this.captured = undefined;
    const context = this.canvas.nativeElement.getContext('2d');

    context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.capture.emit();
  }

  private dataURItoBlob(url): void {
    fetch(url).then(res => res.blob()).then(blob => {
      const file = new File([blob], `Selfie_${ Date.now() }.png`, { type: 'image/png' });

      this.capture.emit(file);
    });
  }
}
