#!/usr/bin/env node

/**
 * Serveur de test simple pour vérifier le health check
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware pour parser JSON
app.use(express.json());

// Route de health check simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Test server is running',
    port: PORT
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'Test server is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur de test démarré sur le port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur de test...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur de test...');
  process.exit(0);
}); 