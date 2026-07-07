import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent {
  @Input() maxFiles = 5;
  @Input() maxSize = 5 * 1024 * 1024; // 5MB
  @Output() imagesChange = new EventEmitter<File[]>();
  
  images: {file: File, preview: string, name: string}[] = [];
  isDragOver = false;
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }
  
  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);
  }
  
  processFiles(files: File[]) {
    files.forEach(file => {
      if (this.images.length >= this.maxFiles) return;
      
      if (!file.type.startsWith('image/')) {
        alert('Seules les images sont autorisées');
        return;
      }
      
      if (file.size > this.maxSize) {
        alert(`L'image ${file.name} est trop volumineuse (max 5MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.images.push({
          file,
          preview: e.target?.result as string,
          name: file.name
        });
        this.emitChange();
      };
      reader.readAsDataURL(file);
    });
  }
  
  removeImage(index: number) {
    this.images.splice(index, 1);
    this.emitChange();
  }
  
  clearAll() {
    this.images = [];
    this.emitChange();
  }
  
  private emitChange() {
    this.imagesChange.emit(this.images.map(img => img.file));
  }
}