import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don't exit on Vite errors in development
        console.error('Vite error:', msg);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Essayer plusieurs chemins possibles pour le build
  const possiblePaths = [
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "dist"),
    path.resolve(__dirname, "..", "client", "dist"),
    path.resolve(__dirname, "..", "build"),
  ];

  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log(`✅ Dossier de build trouvé: ${testPath}`);
      break;
    }
  }

  if (!distPath) {
    console.warn(`❌ Aucun dossier de build trouvé. Chemins testés:`, possiblePaths);
    console.warn(`⚠️  Mode développement - serveur API uniquement`);
    console.warn(`💡 Pour servir le frontend, exécutez: npm run build-prod`);
    return;
  }

  // Servir les fichiers statiques
  app.use(express.static(distPath));

  // Servir index.html pour toutes les routes non-API (SPA)
  app.use("*", (req, res) => {
    // Ne pas servir index.html pour les routes API
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Endpoint API introuvable' });
    }

    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`❌ index.html non trouvé dans: ${distPath}`);
      res.status(404).json({ 
        message: 'Frontend non trouvé. Exécutez: npm run build-prod',
        error: 'index.html missing'
      });
    }
  });

  console.log(`🚀 Frontend servi depuis: ${distPath}`);
}
