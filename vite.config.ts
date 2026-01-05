import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Cargar variables de entorno desde .env.local para el servidor
    let serverEnv: Record<string, string> = {};
    try {
      const envLocalContent = readFileSync('.env.local', 'utf-8');
      envLocalContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            serverEnv[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    } catch (e) {
      // .env.local no existe, usar variables de loadEnv
      serverEnv = env;
    }
    
    // Inyectar variables de entorno en process.env para el servidor
    Object.keys(serverEnv).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = serverEnv[key];
      }
    });
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        middlewareMode: false,
        // Middleware para ejecutar funciones serverless localmente
        configureServer(server) {
          // Insertar el middleware al principio para que se ejecute antes que otros
          server.middlewares.use((req, res, next) => {
            // Solo manejar rutas /api/gemini
            if (req.url?.startsWith('/api/gemini')) {
              console.log('[Vite Middleware] Petición recibida en', req.url, req.method);
              
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              // Leer el body de la petición
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                let responseSent = false;
                try {
                  console.log('[Vite Middleware] Body recibido:', body.substring(0, 100));
                  
                  // Asegurar que las variables de entorno estén disponibles
                  if (!process.env.GEMINI_API_KEY && serverEnv.GEMINI_API_KEY) {
                    process.env.GEMINI_API_KEY = serverEnv.GEMINI_API_KEY;
                  }
                  
                  // Importar y ejecutar la función serverless
                  const { default: handler } = await import('./api/gemini.js');
                  
                  // Crear objetos req y res compatibles con Vercel
                  const vercelReq = {
                    method: req.method || 'POST',
                    body: body ? JSON.parse(body) : {},
                    headers: req.headers || {},
                  };
                  
                  const vercelRes = {
                    status: (code: number) => {
                      res.statusCode = code;
                      return vercelRes;
                    },
                    json: (data: any) => {
                      if (!responseSent) {
                        responseSent = true;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                      }
                      return vercelRes;
                    },
                  };
                  
                  console.log('[Vite Middleware] Ejecutando handler...');
                  await handler(vercelReq, vercelRes);
                } catch (error: any) {
                  console.error('[Vite Middleware] Error ejecutando función serverless:', error);
                  console.error('[Vite Middleware] Stack:', error?.stack);
                  if (!responseSent) {
                    responseSent = true;
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                      error: 'Error interno del servidor',
                      message: error?.message || 'Error desconocido'
                    }));
                  }
                }
              });
            } else {
              // Si no es /api/gemini, continuar con el siguiente middleware
              next();
            }
          });
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
