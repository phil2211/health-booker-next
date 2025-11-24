import { GoogleGenerativeAI } from '@google/generative-ai'

export async function translateText(text: string, targetLanguage: 'en' | 'de'): Promise<string> {
    if (!text || !text.trim()) return ''

    const apiKey = process.env.GEMINI_API_KEY
    console.log('Translation requested. API Key present:', !!apiKey)

    if (!apiKey) {
        console.warn('GEMINI_API_KEY is not set, skipping translation')
        return ''
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        const languageName = targetLanguage === 'en' ? 'English' : 'German'
        const prompt = `Translate the following text to ${languageName}. Only provide the translation, no explanations or additional text: \n\n${text} `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const translated = response.text().trim()
        console.log('Translation success:', translated)
        return translated
    } catch (error) {
        console.error('Translation error:', error)
        return ''
    }
}
