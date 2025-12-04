import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse } from '@/lib/utils/api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        // Ensure user is authenticated
        await requireAuth()

        const { specialization, locale, gender } = await request.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                createErrorResponse(new Error('Gemini API Key not configured'), 'POST /api/generate-bio', 500),
                { status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        let specializationText = ''
        if (Array.isArray(specialization)) {
            specializationText = specialization
                .map((tag: any) => {
                    if (tag.name && typeof tag.name === 'object') {
                        return tag.name[locale] || tag.name.en
                    }
                    return tag.name || ''
                })
                .filter(Boolean)
                .join(', ')
        }

        const prompt = `
      You are a professional copywriter for a therapist's booking website.
      Please write a professional and welcoming biography for a therapist based on their specialization.
      
      Therapist Gender: ${gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : 'Not specified'}
      Therapist Specialization (English): ${specialization.map((t: any) => t.name?.en || t.name).join(', ')}
      Description of the specialization (English): ${specialization.map((t: any) => t.description?.en || t.description).join(', ')}
      Therapist Specialization (German): ${specialization.map((t: any) => t.name?.de || t.name).join(', ')}
      Description of the specialization (German): ${specialization.map((t: any) => t.description?.de || t.description).join(', ')}
      
      Please provide the biography in TWO languages: English and German.
      
      Output MUST be a valid JSON object with the following structure:
      {
        "en": "English biography text...",
        "de": "German biography text..."
      }
      
      Keep the biography concise (approx. 4-7 sentences), warm, and professional. 
      Write in the first person ("I am...").
      Focus on how they help patients with their specific expertise.
      Do not include any markdown formatting (like \`\`\`json), just the raw JSON string.
    `
        console.log(prompt);

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim()

        let bios;
        try {
            bios = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON", text);
            // Fallback if JSON parsing fails - though with the prompt it should work
            return NextResponse.json(
                createErrorResponse(new Error('Failed to generate structured bio'), 'POST /api/generate-bio', 500),
                { status: 500 }
            )
        }

        return NextResponse.json({ bio: bios })
    } catch (error) {
        console.error('Generate bio error:', error)
        return NextResponse.json(
            createErrorResponse(error, 'POST /api/generate-bio'),
            { status: 500 }
        )
    }
}
