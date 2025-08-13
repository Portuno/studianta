import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables from Supabase secrets
    const mabotBaseUrl = Deno.env.get('MABOT_BASE_URL')
    const mabotUsername = Deno.env.get('MABOT_USERNAME')
    const mabotPassword = Deno.env.get('MABOT_PASSWORD')

    if (!mabotBaseUrl || !mabotUsername || !mabotPassword) {
      throw new Error('Mabot configuration missing')
    }

    // Authenticate with Mabot
    const body = new URLSearchParams()
    body.set("username", mabotUsername)
    body.set("password", mabotPassword)
    body.set("grant_type", "password")

    const response = await fetch(`${mabotBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`Mabot auth failed: ${response.status}`)
    }

    const data = await response.json()
    const token = data?.access_token

    if (!token) {
      throw new Error('No token received from Mabot')
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: token
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in mabot-auth function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 