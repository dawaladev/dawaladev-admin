'use client'

import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg-auth.JPG)' }}
      ></div>
      <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-black/50 to-transparent opacity-70 backdrop-blur-xs"></div>
      
      {/* Centered Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphism Form Panel */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-8  shadow-black/10 hover:shadow-3xl transition-all duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/Dawala.png" alt="Dawala Logo" className="h-24 w-auto" />
          </div>
          <div className="flex justify-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">
              {title}
            </h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
} 