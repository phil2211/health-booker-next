import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Ensure this route runs in Node.js runtime
export const runtime = 'nodejs'
import { translateText } from '@/lib/translation'

/**
 * POST /api/translate
 * Translate text using Google Gemini API
 * 
 * Request body: { text: string, targetLanguage: 'en' | 'de' }
 * Returns: { translatedText: string }
 */
export async function POST(request: Request) {
    try {
        const { text, targetLanguage } = await request.json()

        if (!text || !targetLanguage) {
            return NextResponse.json(
                { error: 'Text and target language are required' },
                { status: 400 }
            )
        }

        if (targetLanguage !== 'en' && targetLanguage !== 'de') {
            return NextResponse.json(
                { error: 'Invalid target language. Supported: en, de' },
                { status: 400 }
            )
        }

        const translatedText = await translateText(text, targetLanguage)

        if (!translatedText) {
            return NextResponse.json(
                { error: 'Translation failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            translatedText,
        })
    } catch (error) {
        console.error('Translation API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
