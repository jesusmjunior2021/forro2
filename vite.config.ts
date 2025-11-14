import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces for Replit
    port: 5000,      // Explicitly set port as per previous configuration
    hmr: {
      // This is necessary for HMR (Hot Module Replacement) to work correctly in Replit
      clientPort: 443,
    },
    // Allow requests from any replit.dev subdomain to fix "Blocked request" error
    allowedHosts: [
      '.replit.dev'
    ],
  },
});
