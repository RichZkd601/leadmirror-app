import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handler with performance optimization
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Only log errors in development or if they're not 404s
    if (process.env.NODE_ENV === 'development' || (err.status !== 404 && err.statusCode !== 404)) {
      console.error('Error handler caught:', err);
    }
    
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Translate common errors to French and hide internal details
    if (status === 400) {
      message = 'Requête invalide';
    } else if (status === 401) {
      message = 'Authentification requise';
    } else if (status === 403) {
      message = 'Accès interdit';
    } else if (status === 404) {
      message = 'Ressource introuvable';
    } else if (status >= 500) {
      message = 'Erreur temporaire du serveur. Veuillez réessayer.';
      // Log detailed error but don't expose to client
      if (process.env.NODE_ENV === 'development') {
        console.error('Server error details:', err.stack);
      }
    }

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  });
  
  // 404 handler for API routes
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ message: 'Endpoint API introuvable' });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "127.0.0.1",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
