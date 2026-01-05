import path from 'path';
import { pathToFileURL } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite';
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
    
    // Plugin para manejar rutas de API
    const apiPlugin = (): Plugin => {
      let handlerModule: any = null;
      const handlerPath = path.resolve(__dirname, 'api/gemini.js');
      // Convertir la ruta absoluta a una URL válida para import dinámico
      const handlerUrl = pathToFileURL(handlerPath).href;
      
      return {
        name: 'vite-plugin-api',
        enforce: 'pre', // Ejecutar antes que otros plugins
        configureServer(server) {
          // Pre-cargar el módulo
          import(handlerUrl)
            .then(module => {
              handlerModule = module;
              console.log('[Vite API Plugin] ✅ Módulo Gemini cargado correctamente');
            })
            .catch(err => {
              console.error('[Vite API Plugin] ❌ Error cargando módulo Gemini:', err);
            });

          // Insertar el middleware directamente para que se ejecute primero
          server.middlewares.use((req: any, res: any, next: any) => {
              // Normalizar la URL (eliminar query params)
              const url = req.url?.split('?')[0] || '';
              
              // Solo manejar rutas /api/gemini
              if (url === '/api/gemini' || url.startsWith('/api/gemini')) {
                console.log('[Vite API Plugin] 🎯 Capturando petición:', req.url, req.method);
                
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
                    console.log('[Vite API Plugin] 📦 Body recibido:', body.substring(0, 100));
                    
                    // Asegurar que las variables de entorno estén disponibles
                    if (!process.env.GEMINI_API_KEY && serverEnv.GEMINI_API_KEY) {
                      process.env.GEMINI_API_KEY = serverEnv.GEMINI_API_KEY;
                      console.log('[Vite API Plugin] 🔑 API Key cargada desde .env.local');
                    }
                    
                    if (!process.env.GEMINI_API_KEY) {
                      throw new Error('GEMINI_API_KEY no está configurada. Por favor, agrega GEMINI_API_KEY a tu archivo .env.local');
                    }
                    
                    // Si el módulo no está cargado, intentar cargarlo ahora
                    if (!handlerModule) {
                      console.log('[Vite API Plugin] ⏳ Cargando módulo Gemini...');
                      handlerModule = await import(handlerUrl);
                    }
                    
                    const handler = handlerModule.default;
                    
                    if (!handler) {
                      throw new Error('Handler no encontrado en el módulo');
                    }
                    
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
                    
                    console.log('[Vite API Plugin] 🚀 Ejecutando handler...');
                    await handler(vercelReq, vercelRes);
                    
                    // Si el handler no envió respuesta después de un tiempo, enviar una por defecto
                    setTimeout(() => {
                      if (!responseSent) {
                        responseSent = true;
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ 
                          error: 'El handler no envió respuesta en el tiempo esperado'
                        }));
                      }
                    }, 30000); // 30 segundos timeout
                  } catch (error: any) {
                    console.error('[Vite API Plugin] ❌ Error ejecutando función serverless:', error);
                    console.error('[Vite API Plugin] 📋 Stack:', error?.stack);
                    if (!responseSent) {
                      responseSent = true;
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ 
                        error: 'Error interno del servidor',
                        message: error?.message || 'Error desconocido',
                        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
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
      };
    };
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        middlewareMode: false,
      },
      plugins: [react(), apiPlugin()],
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
