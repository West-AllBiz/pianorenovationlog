import { createRoot } from 'react-dom/client';
import { captureEmailCallback } from './auth/emailCallback';
import './index.css';

// Deliberately import App (and its generated Supabase client) only after cleanup.
// The existing client remains unchanged, including the Lovable storage broker.
captureEmailCallback(window.location, window.history);
void import('./App.tsx').then(({ default: App }) => {
  createRoot(document.getElementById('root')!).render(<App />);
});
