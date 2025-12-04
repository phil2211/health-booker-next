import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse } from '@/lib/utils/api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        // Ensure user is authenticated
        await requireAuth()

        const { offeringName, therapistBio, therapistSpecialization, subcategory, specializationDescription, locale } = await request.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                createErrorResponse(new Error('Gemini API Key not configured'), 'POST /api/generate-description', 500),
                { status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const bio = (typeof therapistBio === 'object' && therapistBio !== null) ? (therapistBio[locale] || therapistBio.en) : therapistBio

        let specialization = ''
        if (Array.isArray(therapistSpecialization)) {
            specialization = therapistSpecialization
                .map((tag: any) => {
                    if (tag.name && typeof tag.name === 'object') {
                        return tag.name[locale] || tag.name.en
                    }
                    return tag.name || ''
                })
                .filter(Boolean)
                .join(', ')
        } else if (typeof therapistSpecialization === 'object' && therapistSpecialization !== null) {
            specialization = therapistSpecialization[locale] || therapistSpecialization.en
        } else {
            specialization = therapistSpecialization
        }
        const name = (typeof offeringName === 'object' && offeringName !== null) ? (offeringName[locale] || offeringName.en) : offeringName

        const subcategoryText = subcategory ? ((typeof subcategory === 'object' && subcategory !== null) ? (subcategory[locale] || subcategory.en) : subcategory) : ''
        const specDescText = specializationDescription ? ((typeof specializationDescription === 'object' && specializationDescription !== null) ? (specializationDescription[locale] || specializationDescription.en) : specializationDescription) : ''

        const prompt = `
      You are a professional copywriter for a therapist's booking website.
      Please write a compelling and professional description for a therapy session.
      
      Session Name: ${name}
      Therapist Bio: ${bio}
      Therapist Specialization: ${specialization}
      ${subcategoryText ? `Subcategory: ${subcategoryText}` : ''}
      ${specDescText ? `Specialization Description: ${specDescText}` : ''}
      
      Target Language: ${locale === 'de' ? 'German' : 'English'}
      
      Keep the description concise (max 3-4 sentences), warm, and professional. Focus on the benefits for the patient.
      Do not include any introductory or concluding text, just the description itself.
    `

        const result = await model.generateContentStream(prompt)

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText))
                        }
                    }
                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            }
        })

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        })

    } catch (error) {
        console.error('Generate description error:', error)
        return NextResponse.json(
            createErrorResponse(error, 'POST /api/generate-description'),
            { status: 500 }
        )
    }
}
