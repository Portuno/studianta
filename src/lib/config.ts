/**
 * Configuration utility for Mabot and other environment variables
 * Supports both environment variables and localStorage fallbacks
 */

export interface MabotConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Get Mabot configuration from environment variables or localStorage
 */
export const getMabotConfig = (): MabotConfig => {
  const baseUrl = import.meta.env.VITE_MABOT_BASE_URL || 
    (typeof window !== "undefined" ? window.localStorage.getItem("mabot_base_url") : null) || 
    "";
    
  const username = import.meta.env.VITE_MABOT_USERNAME || 
    (typeof window !== "undefined" ? window.localStorage.getItem("mabot_username") : null) || 
    "";
    
  const password = import.meta.env.VITE_MABOT_PASSWORD || 
    (typeof window !== "undefined" ? window.localStorage.getItem("mabot_password") : null) || 
    "";

  return {
    baseUrl: baseUrl.toString(),
    username: username.toString(),
    password: password.toString()
  };
};

/**
 * Get Supabase configuration from environment variables
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

  return {
    url: url.toString(),
    anonKey: anonKey.toString()
  };
};

/**
 * Check if Mabot is properly configured
 */
export const isMabotConfigured = (): boolean => {
  const config = getMabotConfig();
  return Boolean(config.baseUrl && config.username && config.password);
};

/**
 * Set Mabot configuration in localStorage (for runtime configuration)
 */
export const setMabotConfig = (config: Partial<MabotConfig>): void => {
  if (typeof window === "undefined") return;
  
  if (config.baseUrl) {
    window.localStorage.setItem("mabot_base_url", config.baseUrl);
  }
  if (config.username) {
    window.localStorage.setItem("mabot_username", config.username);
  }
  if (config.password) {
    window.localStorage.setItem("mabot_password", config.password);
  }
};

/**
 * Clear Mabot configuration from localStorage
 */
export const clearMabotConfig = (): void => {
  if (typeof window === "undefined") return;
  
  window.localStorage.removeItem("mabot_base_url");
  window.localStorage.removeItem("mabot_username");
  window.localStorage.removeItem("mabot_password");
  window.localStorage.removeItem("mabot_access_token");
  window.localStorage.removeItem("mabot_refresh_token");
}; 