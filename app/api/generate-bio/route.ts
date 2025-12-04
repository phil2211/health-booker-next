import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse } from '@/lib/utils/api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        // Ensure user is authenticated
        await requireAuth()

        const { specialization, locale, gender, name, language } = await request.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                createErrorResponse(new Error('Gemini API Key not configured'), 'POST /api/generate-bio', 500),
                { status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const languageName = language === 'en' ? 'English' : 'German'

        const prompt = `
      You are a professional copywriter for a therapist's booking website.
      Please write a professional, warm, and personal biography for a therapist based on their specialization.
      
      Therapist Name: ${name}
      Therapist Gender: ${gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : 'Not specified'}
      Therapist Specializations (English):
      ${specialization.map((t: any) => `- ${t.name?.en || t.name}: ${t.description?.en || t.description}`).join('\n')}
      
      Therapist Specializations (German):
      ${specialization.map((t: any) => `- ${t.name?.de || t.name}: ${t.description?.de || t.description}`).join('\n')}
      
      Please provide the biography in ${languageName} ONLY.
      
      The biography text should be formatted as a nice looking markdown document.
      Use bolding for emphasis, bullet points for lists if appropriate, and paragraphs for readability.
      
      Keep the biography concise (approx. 4-7 sentences), warm, and professional. 
      Write in the first person ("I am ${name}...").
      Make it personal and welcoming.
      Focus on how they help patients with their specific expertise.
      Do NOT include any JSON or code blocks. Just the text.
    `

        const result = await model.generateContentStream(prompt)

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text()
                    controller.enqueue(chunkText)
                }
                controller.close()
            }
        })

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })

    } catch (error) {
        console.error('Generate bio error:', error)
        return NextResponse.json(
            createErrorResponse(error, 'POST /api/generate-bio'),
            { status: 500 }
        )
    }
}
