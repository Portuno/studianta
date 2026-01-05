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
          server.middlewares.use('/api/gemini', async (req, res, next) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              // Leer el body de la petición
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', async () => {
                let responseSent = false;
                try {
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
                  
                  await handler(vercelReq, vercelRes);
                } catch (error: any) {
                  console.error('Error ejecutando función serverless:', error);
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
            } catch (error: any) {
              console.error('Error en middleware:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Error procesando la petición' }));
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
