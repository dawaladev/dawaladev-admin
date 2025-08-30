export interface TranslateResponse {
  originalText: string
  translatedText: string
  targetLang: string
  success: boolean
}

export async function translateText(text: string, targetLang: string = 'en'): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLang,
      }),
    })

    if (!response.ok) {
      throw new Error('Translation failed')
    }

    const data: TranslateResponse = await response.json()
    return data.translatedText
  } catch (error) {
    console.error('Translation error:', error)
    // Return original text if translation fails
    return text
  }
}

export async function translateMultipleTexts(texts: string[], targetLang: string = 'en'): Promise<string[]> {
  try {
    const promises = texts.map(text => translateText(text, targetLang))
    return await Promise.all(promises)
  } catch (error) {
    console.error('Multiple translation error:', error)
    return texts // Return original texts if translation fails
  }
}
