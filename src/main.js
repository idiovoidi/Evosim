import { App } from './app/App.js';

const app = new App();
app.start();

if (import.meta.env?.DEV) window.evosim = app;
