#!/usr/bin/env node

/**
 * Serveur simple pour LeadMirror
 * Permet l'accès à localhost même sans base de données
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de base
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'LeadMirror API is running',
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'LeadMirror API is running',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      frontend: '/index.html'
    }
  });
});

// Route pour servir le frontend
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Route pour toutes les autres requêtes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 Serveur LeadMirror démarré !');
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/index.html`);
  console.log('📊 Mode: Développement simple (sans base de données)');
  console.log('💡 Pour accéder à l\'application, ouvrez: http://localhost:3001');
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
}); 