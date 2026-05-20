import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Habilita el módulo de animaciones de Angular (@angular/animations).
    // Sin esto, los `trigger` de animations.ts no se ejecutan.
    provideAnimations(),
  ]
};
