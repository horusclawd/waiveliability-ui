import { Component, ElementRef, ViewChild, afterNextRender, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
    <div class="signature-pad-container" style="border: 1px solid var(--surface-300); border-radius: 6px; overflow: hidden;">
      <canvas
        #canvas
        (mousedown)="startDrawing($event)"
        (mousemove)="draw($event)"
        (mouseup)="stopDrawing()"
        (mouseleave)="stopDrawing()"
        (touchstart)="startDrawing($event)"
        (touchmove)="draw($event)"
        (touchend)="stopDrawing()"
        style="display: block; width: 100%; height: 150px; background: var(--surface-ground); touch-action: none; cursor: crosshair;"
      ></canvas>
    </div>
    <div class="flex justify-content-between align-items-center mt-2">
      <small class="text-color-secondary">Draw your signature above</small>
      @if (hasSignature()) {
        <button
          type="button"
          pButton
          class="p-button-text p-button-sm"
          label="Clear"
          (click)="clear()"
        ></button>
      }
    </div>
  `,
})
export class SignaturePadComponent {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  hasSignature = signal(false);
  signatureChange = output<string>();

  constructor() {
    afterNextRender(() => {
      this.initCanvas();
    });
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    // Set actual canvas size to match display size for sharp rendering
    canvas.width = rect.width;
    canvas.height = rect.height;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDrawing = true;
    const { x, y } = this.getCoordinates(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();
    const { x, y } = this.getCoordinates(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.hasSignature.set(true);
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.emitSignature();
    }
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature.set(false);
    this.signatureChange.emit('');
  }

  private getCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    if (event instanceof TouchEvent) {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  }

  private emitSignature() {
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    this.signatureChange.emit(dataUrl);
  }

  getSignatureDataUrl(): string {
    const canvas = this.canvasRef.nativeElement;
    return canvas.toDataURL('image/png');
  }
}
