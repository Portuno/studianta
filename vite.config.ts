import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    // Force environment variables to be available
    define: {
      // Expose all VITE_ variables
      'import.meta.env.VITE_MABOT_BASE_URL': JSON.stringify(env.VITE_MABOT_BASE_URL),
      'import.meta.env.VITE_MABOT_USERNAME': JSON.stringify(env.VITE_MABOT_USERNAME),
      'import.meta.env.VITE_MABOT_PASSWORD': JSON.stringify(env.VITE_MABOT_PASSWORD),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    // Ensure environment variables are loaded
    envDir: process.cwd(),
  };
});
