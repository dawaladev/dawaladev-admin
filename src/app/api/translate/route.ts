import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = 'en' } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Skip translation if text is too short or empty
    if (text.trim().length < 3) {
      return NextResponse.json({
        originalText: text,
        translatedText: text,
        targetLang,
        success: true
      })
    }

    // Use Google Translate API (free tier)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`)
    
    if (!response.ok) {
      throw new Error('Google Translate API error')
    }

    const data = await response.json()
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translatedText = data[0].map((item: any) => item[0]).join('')
      
      return NextResponse.json({
        originalText: text,
        translatedText: translatedText,
        targetLang,
        success: true
      })
    } else {
      // Fallback to original text if translation fails
      return NextResponse.json({
        originalText: text,
        translatedText: text,
        targetLang,
        success: true
      })
    }

  } catch (error) {
    console.error('Translation error:', error)
    
    // Fallback to original text if translation fails
    const { text: fallbackText, targetLang: fallbackLang = 'en' } = await request.json()
    return NextResponse.json({
      originalText: fallbackText,
      translatedText: fallbackText,
      targetLang: fallbackLang,
      success: true
    })
  }
}
