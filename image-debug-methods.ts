// Ajoutez ces méthodes dans chat-support.component.ts

onImageError(event: any, imagePath: string) {
  console.error('Erreur chargement image:', imagePath, event);
}

onImageLoad(event: any, imagePath: string) {
  console.log('Image chargée avec succès:', imagePath);
}