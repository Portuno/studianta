# Environment Variables Setup

This project requires several environment variables to be configured for both local development and production deployment.

## Required Environment Variables

### Mabot Configuration
- `VITE_MABOT_BASE_URL` - The base URL for your Mabot service
- `VITE_MABOT_USERNAME` - Username for Mabot authentication
- `VITE_MABOT_PASSWORD` - Password for Mabot authentication

### Supabase Configuration (if needed)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Local Development Setup

### Option 1: Environment File (Recommended)
Create a `.env.local` file in your project root:

```bash
# Create .env.local file
touch .env.local
```

Add your configuration:

```env
# Mabot Configuration
VITE_MABOT_BASE_URL=your_mabot_base_url_here
VITE_MABOT_USERNAME=your_mabot_username_here
VITE_MABOT_PASSWORD=your_mabot_password_here

# Supabase Configuration (if needed)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important:** Add `.env.local` to your `.gitignore` file to avoid committing sensitive information.

### Option 2: Runtime Configuration via localStorage
You can also configure these values at runtime using the browser's localStorage:

```javascript
// Set Mabot configuration
localStorage.setItem("mabot_base_url", "your_mabot_base_url");
localStorage.setItem("mabot_username", "your_mabot_username");
localStorage.setItem("mabot_password", "your_mabot_password");
```

## Vercel Deployment Setup

Since you mentioned these are already set in Vercel's environment variables, you're all set for production! 

### To verify in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Ensure these variables are set:
   - `VITE_MABOT_BASE_URL`
   - `VITE_MABOT_USERNAME`
   - `VITE_MABOT_PASSWORD`

## Usage in Code

The project now includes a configuration utility (`src/lib/config.ts`) that automatically handles both environment variables and localStorage fallbacks:

```typescript
import { getMabotConfig, isMabotConfigured } from '@/lib/config';

// Get Mabot configuration
const mabotConfig = getMabotConfig();

// Check if Mabot is configured
if (isMabotConfigured()) {
  // Use mabotConfig.baseUrl, mabotConfig.username, mabotConfig.password
}
```

## Priority Order

The configuration follows this priority order:
1. Environment variables (highest priority)
2. localStorage values
3. Empty string (fallback)

## Security Notes

- Never commit `.env.local` files to version control
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- Consider using runtime configuration for sensitive values in development
- Production values should always be set via Vercel environment variables

## Troubleshooting

If you're having issues:

1. **Check environment variable names**: Ensure they start with `VITE_`
2. **Restart development server**: After creating `.env.local`, restart your dev server
3. **Verify Vercel deployment**: Check that environment variables are set in Vercel
4. **Check browser console**: Look for any configuration-related errors
5. **Use the config utility**: The `src/lib/config.ts` file provides debugging information 