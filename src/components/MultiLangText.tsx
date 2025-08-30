'use client'

import { useState } from 'react'
import { Languages, Globe } from 'lucide-react'

interface MultiLangTextProps {
  textEn?: string
  defaultText: string
  className?: string
  showLanguageToggle?: boolean
}

export function MultiLangText({ 
  textEn, 
  defaultText, 
  className = '',
  showLanguageToggle = true 
}: MultiLangTextProps) {
  const [currentLang, setCurrentLang] = useState<'id' | 'en'>('id')

  const displayText = currentLang === 'id' 
    ? defaultText
    : (textEn || defaultText)

  if (!showLanguageToggle) {
    return <span className={className}>{displayText}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className={className}>{displayText}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentLang('id')}
          className={`px-2 py-1 text-xs rounded ${
            currentLang === 'id' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Bahasa Indonesia"
        >
          ID
        </button>
        <button
          onClick={() => setCurrentLang('en')}
          className={`px-2 py-1 text-xs rounded ${
            currentLang === 'en' 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="English"
        >
          EN
        </button>
      </div>
    </div>
  )
}

export function MultiLangDescription({ 
  textEn, 
  defaultText, 
  className = '',
  showLanguageToggle = true 
}: MultiLangTextProps) {
  const [currentLang, setCurrentLang] = useState<'id' | 'en'>('id')

  const displayText = currentLang === 'id' 
    ? defaultText
    : (textEn || defaultText)

  if (!showLanguageToggle) {
    return <p className={`whitespace-pre-line ${className}`}>{displayText}</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className={`whitespace-pre-line ${className}`}>{displayText}</p>
        <div className="flex items-center gap-1 ml-4">
          <Languages className="h-4 w-4 text-gray-500" />
          <button
            onClick={() => setCurrentLang('id')}
            className={`px-2 py-1 text-xs rounded ${
              currentLang === 'id' 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Bahasa Indonesia"
          >
            ID
          </button>
          <button
            onClick={() => setCurrentLang('en')}
            className={`px-2 py-1 text-xs rounded ${
              currentLang === 'en' 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="English"
          >
            EN
          </button>
        </div>
      </div>
    </div>
  )
}
