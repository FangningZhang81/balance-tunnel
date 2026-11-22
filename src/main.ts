import './styles.css';
import { App } from './app/App';
import { registerServiceWorker } from './pwa/registerServiceWorker';

function boot(): void {
  const canvas = document.getElementById('game-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Game canvas is missing.');
  try {
    new App(canvas);
    registerServiceWorker();
  } catch (error) {
    const message = document.getElementById('error-message');
    if (message) {
      message.textContent = error instanceof Error ? error.message : 'Balance Tunnel could not start.';
      message.classList.remove('hidden');
    }
    console.error(error);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
