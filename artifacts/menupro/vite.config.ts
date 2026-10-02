import path from 'path';
import { copyFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

/* O GitHub Pages nao tem fallback de SPA: /menu/qualquer-coisa devolve 404.
   Copiar o index.html para 404.html faz o app subir em qualquer caminho, e o
   roteador decide a pagina. Um 404.html com redirect por JS nao resolve: o
   caminho da base (/<repo>/) so e conhecido no build. */
function spaFallback(): Plugin {
  return {
    name: 'menupro:spa-fallback',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(import.meta.dirname, 'dist/public');
      copyFileSync(
        path.join(outDir, 'index.html'),
        path.join(outDir, '404.html'),
      );
    },
  };
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

/* Modo demo: sem chave do Clerk e sem API, o app troca o Clerk por um stub e
   intercepta /api/* com dados de exemplo. Vite.config le env do processo, por
   isso a chave do Clerk tambem e lida daqui. */
const clerkKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
const demoMode = process.env.VITE_DEMO_MODE === 'true' || !clerkKey;

if (demoMode) {
  console.warn(
    '[menupro] Modo demo ligado: Clerk stub + API em memoria. Defina VITE_CLERK_PUBLISHABLE_KEY para usar o auth real.',
  );
}

const demoAliases = demoMode
  ? {
      '@clerk/react/internal': path.resolve(
        import.meta.dirname,
        'src/demo/clerk-internals-stub.ts',
      ),
      '@clerk/themes': path.resolve(
        import.meta.dirname,
        'src/demo/clerk-internals-stub.ts',
      ),
      '@clerk/react': path.resolve(
        import.meta.dirname,
        'src/demo/clerk-stub.tsx',
      ),
    }
  : {};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    spaFallback(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
      ...demoAliases,
    },
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify(String(demoMode)),
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
