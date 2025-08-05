import express from 'express';
import type { Request, Response, NextFunction } from 'express';

const app = express();

// Configuration des middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware CORS optimisé pour Railway
app.use((req: Request, res: Response, next: NextFunction) => {
  // Configuration CORS pour Railway
  const allowedOrigins = [
    'https://your-app-name.railway.app',
    'https://your-app-name.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Route de test pour vérifier que l'API fonctionne
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'API Railway fonctionne !',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000'
  });
});

// Route pour l'authentification
app.get('/api/auth/user', (req: Request, res: Response) => {
  res.json({ 
    id: 24, 
    email: "tomeo.mas@hotmail.fr", 
    isPremium: true,
    timestamp: new Date().toISOString()
  });
});

// Route pour les abonnements
app.post('/api/create-subscription', (req: Request, res: Response) => {
  res.json({ 
    checkoutUrl: "https://checkout.stripe.com/test",
    timestamp: new Date().toISOString()
  });
});

// Route pour l'analyse
app.post('/api/analyze', (req: Request, res: Response) => {
  res.json({ 
    id: "test-analysis-id",
    message: "Analyse en cours...",
    timestamp: new Date().toISOString()
  });
});

// Route pour l'analyse audio révolutionnaire
app.post('/api/revolutionary-audio-analysis', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    analysis: {
      id: "audio-analysis-id",
      message: "Analyse audio révolutionnaire en cours...",
      timestamp: new Date().toISOString()
    }
  });
});

// Route de santé pour Railway
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    database: process.env.DATABASE_URL ? 'connected' : 'not_configured'
  });
});

// Gestion des erreurs améliorée pour Railway
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error handler caught:', err);
  
  const status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  
  if (status === 404) {
    message = 'Page non trouvée';
  } else if (status >= 500) {
    message = 'Erreur temporaire du serveur. Veuillez réessayer.';
  }

  res.status(status).json({ 
    error: true, 
    message,
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: true, 
    message: 'Route non trouvée',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

export default app; 