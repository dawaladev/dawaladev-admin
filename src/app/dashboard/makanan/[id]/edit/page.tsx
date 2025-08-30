import { Suspense } from 'react'
import { use } from 'react'
import EditMakananClient from './EditMakananClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditMakananPage({ params }: PageProps) {
  const { id } = use(params)
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data menu...</p>
        </div>
      </div>
    }>
      <EditMakananClient id={id} />
    </Suspense>
  )
} 