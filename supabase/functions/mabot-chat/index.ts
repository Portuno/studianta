import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!mabotBaseUrl || !mabotUsername || !mabotPassword || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration missing: MABOT_BASE_URL, MABOT_USERNAME, MABOT_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    }

    // Parse request body
    const { session, userText, contextText, contextFiles } = await req.json()

    // Log the received data for debugging
    console.log('Received request data:', {
      session: session ? {
        userId: session.userId,
        subjectId: session.subjectId,
        topicId: session.topicId,
        contextType: session.contextType
      } : null,
      userText: userText ? userText.substring(0, 100) + '...' : null,
      contextTextLength: contextText ? contextText.length : 0,
      contextFilesCount: contextFiles ? contextFiles.length : 0
    })

    // Validate session data with better error messages
    if (!session) {
      throw new Error('Session object is missing from request')
    }

    if (!session.userId) {
      console.error('Session data received:', JSON.stringify(session, null, 2))
      throw new Error('userId is missing from session')
    }

    // Make subjectId optional - user can chat without selecting a subject
    const subjectId = session.subjectId || null
    const topicId = session.topicId || null

    console.log('Processing chat for user:', session.userId, 'subject:', subjectId, 'topic:', topicId)

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get or create chat ID - handle case where subjectId might be null
    const chatId = session.mabotChatId || `web_${session.userId}_${subjectId || 'general'}_${Date.now()}`

    // Get unsent study materials from database (only if subjectId exists)
    let studyMaterials: any[] = []
    if (subjectId) {
      try {
        const { data: materials, error: materialsError } = await supabase
          .rpc('get_unsent_study_materials', {
            p_user_id: session.userId,
            p_subject_id: subjectId,
            p_topic_id: topicId || null,
            p_chat_id: chatId
          })

        if (materialsError) {
          console.error('Error fetching study materials:', materialsError)
          // Don't fail the entire request for materials error
          studyMaterials = []
        } else {
          studyMaterials = materials || []
          console.log(`Found ${studyMaterials.length} unsent study materials`)
        }
      } catch (error) {
        console.error('Exception while fetching study materials:', error)
        studyMaterials = []
      }
    } else {
      console.log('No subjectId provided, skipping study materials fetch')
    }

    // Prepare messages for Mabot
    const messages: any[] = [
      {
        role: "user",
        contents: [{ type: "text", value: buildDeveloperInstruction(session), parse_mode: "Markdown" }],
      },
    ]

    // Add context text if provided
    if (contextText && contextText.trim().length > 0) {
      messages.push({ 
        role: "user", 
        contents: [{ type: "text", value: contextText }] 
      })
    }

    // Add study materials from database (only unsent ones)
    if (studyMaterials && studyMaterials.length > 0) {
      console.log(`Adding ${studyMaterials.length} unsent study materials to chat`)
      
      for (const material of studyMaterials) {
        const messageContent: any[] = [
          { type: "text", value: `Study Material: ${material.title} (${material.type})` }
        ]

        // Add file content based on type
        if (material.content && material.content.trim().length > 0) {
          messageContent.push({ type: "text", value: `Content: ${material.content}` })
        }

        // Add file if it exists
        if (material.file_path && material.mime_type) {
          try {
            // Get file from Supabase storage
            const { data: fileData, error: fileError } = await supabase.storage
              .from('study-materials')
              .download(material.file_path)

            if (fileError) {
              console.warn(`Failed to download file ${material.file_path}:`, fileError)
              // Continue without the file, but add a note
              messageContent.push({ type: "text", value: `Note: File ${material.title} could not be accessed` })
            } else {
              // Convert file to base64 for Mabot
              const arrayBuffer = await fileData.arrayBuffer()
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
              
              messageContent.push({ 
                type: "file", 
                value: `data:${material.mime_type};base64,${base64}`,
                mime_type: material.mime_type
              })
            }
          } catch (fileError) {
            console.warn(`Error processing file ${material.file_path}:`, fileError)
            messageContent.push({ type: "text", value: `Note: File ${material.title} could not be processed` })
          }
        }

        messages.push({
          role: "user",
          contents: messageContent
        })
      }

      // Mark these materials as sent to this chat
      if (studyMaterials.length > 0) {
        const trackingRecords = studyMaterials.map(material => ({
          chat_id: chatId,
          study_material_id: material.id
        }))

        const { error: trackingError } = await supabase
          .from('chat_file_tracking')
          .insert(trackingRecords)

        if (trackingError) {
          console.warn('Failed to track sent files:', trackingError)
          // Don't fail the entire request for tracking errors
        }
      }
    }

    // Add context files from request if provided
    if (contextFiles && contextFiles.length > 0) {
      console.log(`Adding ${contextFiles.length} context files from request`)
      
      contextFiles.forEach((file: any) => {
        messages.push({
          role: "user",
          contents: [
            { type: "text", value: `Context File: ${file.title}` },
            { type: "file", value: file.url, mime_type: file.mime_type }
          ]
        })
      })
    }

    // Add the user's current message
    messages.push({ 
      role: "user", 
      contents: [{ type: "text", value: userText }] 
    })

    console.log(`Sending ${messages.length} messages to Mabot for chat ${chatId}`)

    // Call Mabot API
    const response = await fetch(`${mabotBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${mabotUsername}:${mabotPassword}`)}`
      },
      body: JSON.stringify({
        messages,
        platform_chat_id: chatId,
        platform: 'web'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mabot API error:', response.status, errorText)
      throw new Error(`Mabot API error: ${response.status} - ${errorText}`)
    }

    const mabotResponse = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        data: mabotResponse,
        chatId: chatId,
        materialsAdded: studyMaterials ? studyMaterials.length : 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in mabot-chat function:', error)
    
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

function buildDeveloperInstruction(session: any): string {
  const subjectName = session.subjectName || 'general studies'
  const topic = session.topic || 'general topics'
  const contextType = session.contextType || 'general'
  
  let contextDescription = ''
  if (contextType === 'agenda') {
    contextDescription = 'You are helping with academic planning, scheduling, and goal setting.'
  } else if (session.subjectId) {
    contextDescription = `You are helping with ${subjectName}, specifically focusing on ${topic}.`
  } else {
    contextDescription = 'You are helping with general academic questions and study guidance.'
  }
  
  return `You are Mabot, an AI study assistant. ${contextDescription}

Key instructions:
- Be encouraging and supportive
- Provide clear, structured explanations
- Use examples when helpful
- Ask clarifying questions if needed
- Keep responses concise but thorough
- If the student uploads files or study materials, analyze them thoroughly and reference their content in your responses
- When referencing study materials, mention their titles and key points
- Help the student understand how the materials relate to their current study topic
- If no specific subject is selected, provide general academic guidance

Current context: ${subjectName} - ${topic}

The student may have uploaded study materials (notes, documents, PDFs, images, etc.) that you should analyze and incorporate into your responses.`
} 