// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { App } from './app/app';

// bootstrapApplication(App, appConfig)
//   .catch((err) => console.error(err));
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';

import localeEsAr from '@angular/common/locales/es-AR';
// Si da error, usar:
// import localeEs from '@angular/common/locales/es';

import { appConfig } from './app/app.config';
import { App } from './app/app';

// ✅ Registrar idioma
registerLocaleData(localeEsAr);
// Si usás localeEs:
// registerLocaleData(localeEs);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));