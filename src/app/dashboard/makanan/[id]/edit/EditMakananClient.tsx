'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, X, Edit, Camera, AlertCircle, CheckCircle, Languages } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { makananSchema, type MakananFormData } from '@/lib/validations'
import { Toast } from '@/components/ui/toast'
import { translateText } from '@/lib/translate'

interface JenisPaket {
  id: number
  namaPaket: string
}

interface Makanan {
  id: number
  namaMakanan: string
  deskripsi: string
  deskripsiEn?: string
  foto: string | string[]
  harga: number
  jenisPaketId: number
  jenisPaket: {
    id: number
    namaPaket: string
  }
}

interface EditMakananClientProps {
  id: string
}

export default function EditMakananClient({ id }: EditMakananClientProps) {
  const [makanan, setMakanan] = useState<Makanan | null>(null)
  const [jenisPaketList, setJenisPaketList] = useState<JenisPaket[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [descriptionLength, setDescriptionLength] = useState(0)
  const [deskripsiEn, setDeskripsiEn] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<MakananFormData>({
    resolver: zodResolver(makananSchema),
  })

  // Watch the description field for character count
  const watchedDescription = watch('deskripsi', '')

  useEffect(() => {
    // Update description length
    setDescriptionLength(watchedDescription.length)
  }, [watchedDescription])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch makanan data
        const makananResponse = await fetch(`/api/makanan/${id}`)
        if (makananResponse.ok) {
          const makananData = await makananResponse.json()
          setMakanan(makananData)
          setDeskripsiEn(makananData.deskripsiEn || '')
          
          // Convert foto string to array if it's a single string
          let fotoArray: string[] = []
          if (makananData.foto) {
            if (Array.isArray(makananData.foto)) {
              fotoArray = makananData.foto.filter((url: string) => url && typeof url === 'string' && url.trim() !== '')
            } else if (typeof makananData.foto === 'string') {
              if (makananData.foto.trim() !== '') {
                fotoArray = [makananData.foto]
              }
            }
          }
          setUploadedImages(fotoArray)
          
          // Set form values
          reset({
            namaMakanan: makananData.namaMakanan,
            deskripsi: makananData.deskripsi,
            foto: fotoArray,
            harga: makananData.harga,
            jenisPaketId: makananData.jenisPaketId,
          })
        } else {
          throw new Error('Failed to fetch makanan data')
        }

        // Fetch jenis paket list
        const jenisPaketResponse = await fetch('/api/jenis-paket')
        if (jenisPaketResponse.ok) {
          const jenisPaketData = await jenisPaketResponse.json()
          setJenisPaketList(jenisPaketData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('root', { message: 'Terjadi kesalahan saat memuat data' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, reset, setError])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  const autoTranslateDescription = async () => {
    const text = watch('deskripsi')
    if (!text || text.trim().length < 10) {
      showToast('Deskripsi harus minimal 10 karakter untuk auto-translate', 'error')
      return
    }

    setIsTranslating(true)
    try {
      const translated = await translateText(text, 'en')
      setDeskripsiEn(translated)
      showToast('Deskripsi berhasil di-translate ke English!', 'success')
    } catch (error) {
      console.error('Translation error:', error)
      showToast('Gagal translate deskripsi. Silakan coba lagi.', 'error')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    setUploadError(null)
    
    try {
      // Validate files
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
        const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
        
        if (!isValidType) {
          setUploadError(`File ${file.name} bukan format gambar yang valid`)
          return false
        }
        
        if (!isValidSize) {
          setUploadError(`File ${file.name} terlalu besar (maksimal 5MB)`)
          return false
        }
        
        return true
      })

      if (validFiles.length === 0) {
        setIsUploading(false)
        return
      }

      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      const newImageUrls = data.files.map((file: { url: string }) => file.url)
      const newImages = [...uploadedImages, ...newImageUrls]
      setUploadedImages(newImages)
      setValue('foto', newImages)
      
      // Show success message
      console.log(`Berhasil upload ${data.files.length} foto`)
      
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal upload foto. Silakan coba lagi.'
      setUploadError(errorMessage)
      
      // If it's a storage bucket error, show generic error
      if (errorMessage.includes('bucket') || errorMessage.includes('Storage bucket not configured')) {
        setUploadError('Gagal mengupload foto. Silakan coba lagi.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    setValue('foto', newImages)
  }

  const onSubmit = async (data: MakananFormData) => {
    try {
      const response = await fetch(`/api/makanan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namaMakanan: data.namaMakanan,
          deskripsi: data.deskripsi,
          deskripsiEn: deskripsiEn.trim() || null,
          foto: uploadedImages,
          harga: data.harga,
          jenisPaketId: data.jenisPaketId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Terjadi kesalahan')
      }

      // Show success notification
      showToast('✅ Menu berhasil diperbarui!', 'success')
      
      // Wait a bit before redirecting
      setTimeout(() => {
        router.push('/dashboard/makanan')
      }, 1500)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      setError('root', { message: errorMessage })
      showToast(`❌ ${errorMessage}`, 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat data menu...</p>
        </div>
      </div>
    )
  }

  if (!makanan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Menu yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Link href="/dashboard/makanan">
            <Button className="bg-green-600 hover:bg-green-700">
              Kembali ke Daftar Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/makanan">
          <Button variant="outline" size="sm" className="bg-white border-green-200 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Menu Makanan</h1>
          <p className="text-gray-600">Perbarui informasi menu makanan</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Form Header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
            <div className="p-3 bg-green-100 rounded-xl">
              <Edit className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Form Edit Menu Makanan</h2>
              <p className="text-green-600">Perbarui informasi menu makanan</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <Label htmlFor="namaMakanan" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Nama Menu *
                </Label>
                <Input
                  id="namaMakanan"
                  type="text"
                  {...register('namaMakanan')}
                  placeholder="Contoh: Nasi Goreng Spesial"
                  className={`h-12 text-base ${errors.namaMakanan ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
                />
                {errors.namaMakanan && (
                  <p className="text-red-500 text-sm mt-2">{errors.namaMakanan.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="jenisPaket" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Jenis Paket *
                </Label>
                <Controller
                  name="jenisPaketId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value?.toString() || ''} onValueChange={(value) => field.onChange(parseInt(value))}>
                      <SelectTrigger 
                        className={`h-12 text-base bg-white ${errors.jenisPaketId ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500 hover:border-green-400'}`}
                      >
                        <SelectValue placeholder="Pilih jenis paket" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
                        {jenisPaketList.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Tidak ada jenis paket tersedia
                          </div>
                        ) : (
                          jenisPaketList.map((paket) => (
                            <SelectItem 
                              key={paket.id} 
                              value={paket.id.toString()}
                              className="hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{paket.namaPaket}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.jenisPaketId && (
                  <p className="text-red-500 text-sm mt-2">{errors.jenisPaketId.message}</p>
                )}
                {jenisPaketList.length === 0 && (
                  <p className="text-amber-600 text-sm mt-2">
                    Belum ada jenis paket. 
                    <Link href="/dashboard/jenis-paket/tambah" className="text-green-600 hover:text-green-700 underline ml-1">
                      Buat jenis paket baru
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="harga" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Harga (Rp) *
                </Label>
                <Input
                  id="harga"
                  type="number"
                  {...register('harga', { valueAsNumber: true })}
                  placeholder="25000"
                  min="0"
                  className={`h-12 text-base ${errors.harga ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
                />
                {errors.harga && (
                  <p className="text-red-500 text-sm mt-2">{errors.harga.message}</p>
                )}
              </div>
            </div>

            {/* Description - Full Width */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="deskripsi" className="text-sm font-semibold text-gray-700">
                  Deskripsi Menu *
                </Label>
                <span className={`text-xs font-medium ${
                  descriptionLength > 10000 ? 'text-red-500' : 
                  descriptionLength > 9000 ? 'text-orange-500' : 
                  'text-gray-500'
                }`}>
                  {descriptionLength}/10000 karakter
                </span>
              </div>
              <Textarea
                id="deskripsi"
                {...register('deskripsi')}
                placeholder="Deskripsikan menu makanan dengan detail... (minimal 10 karakter, maksimal 10000 karakter)"
                className={`min-h-[240px] text-base resize-none w-full ${errors.deskripsi ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
              />
              {errors.deskripsi && (
                <p className="text-red-500 text-sm mt-2">{errors.deskripsi.message}</p>
              )}
              {descriptionLength > 10000 && (
                <p className="text-red-500 text-sm mt-2">
                  ⚠️ Deskripsi terlalu panjang! Maksimal 10000 karakter.
                </p>
              )}
            </div>

            {/* English Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="deskripsiEn" className="text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Deskripsi Menu (English)
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={autoTranslateDescription}
                    disabled={isTranslating || !watch('deskripsi') || watch('deskripsi').trim().length < 10}
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                  >
                    {isTranslating ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="h-3 w-3 mr-1" />
                        Auto Translate
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-gray-500">
                    {deskripsiEn.length} karakter
                  </span>
                </div>
              </div>
              <Textarea
                id="deskripsiEn"
                value={deskripsiEn}
                onChange={(e) => setDeskripsiEn(e.target.value)}
                placeholder="Describe the food menu in detail in English... (optional)"
                className="min-h-[120px] text-base resize-none w-full border-gray-300 focus:border-blue-500"
              />
              {deskripsiEn && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Preview (English):</span>
                  </div>
                  <p className="text-sm text-blue-800 whitespace-pre-line">{deskripsiEn}</p>
                </div>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                  Foto Menu *
                </Label>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600 h-12 px-6"
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Tambah Foto Menu
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Klik untuk memilih foto atau drag & drop file gambar
                    </p>
                    <p className="text-xs text-gray-400">
                      Format: JPG, PNG, GIF, WebP • Maksimal 5MB per file • Tidak ada batasan jumlah foto
                    </p>
                  </div>
                </div>
                
                {/* Upload Error */}
                {uploadError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-red-600 text-sm font-medium">{uploadError}</p>
                    </div>
                    

                  </div>
                )}
                
                {errors.foto && (
                  <p className="text-red-500 text-sm mt-2">{errors.foto.message}</p>
                )}
              </div>

              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                    Preview Foto ({uploadedImages.length} foto)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-colors">
                          <Image
                            src={url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTE2LjU2OSA3MCAxMzAgODMuNDMxIDEzMCAxMDBDMTMwIDExNi41NjkgMTE2LjU2OSAxMzAgMTAwIDEzMEM4My40MzEgMTMwIDcwIDExNi41NjkgNzAgMTAwQzcwIDgzLjQzMSA4My40MzEgNzAgMTAwIDcwWiIgZmlsbD0iI0QxRDU5QiIvPgo8cGF0aCBkPSJNMTAwIDE0MEMxMTYuNTY5IDE0MCAxMzAgMTUzLjQzMSAxMzAgMTcwQzEzMCAxODYuNTY5IDExNi41NjkgMjAwIDEwMCAyMDBDODMuNDMxIDIwMCA3MCAxODYuNTY5IDcwIDE3MEM3MCAxNTMuNDMxIDgzLjQzMSAxNDAgMTAwIDE0MFoiIGZpbGw9IiNEQ0U3RjAiLz4KPC9zdmc+'}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Use a simple data URL for placeholder
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTE2LjU2OSA3MCAxMzAgODMuNDMxIDEzMCAxMDBDMTMwIDExNi41NjkgMTE2LjU2OSAxMzAgMTAwIDEzMEM4My40MzEgMTMwIDcwIDExNi41NjkgNzAgMTAwQzcwIDgzLjQzMSA4My40MzEgNzAgMTAwIDcwWiIgZmlsbD0iI0QxRDU5QiIvPgo8cGF0aCBkPSJNMTAwIDE0MEMxMTYuNTY5IDE0MCAxMzAgMTUzLjQzMSAxMzAgMTcwQzEzMCAxODYuNTY5IDExNi41NjkgMjAwIDEwMCAyMDBDODMuNDMxIDIwMCA3MCAxODYuNTY5IDcwIDE3MEM3MCAxNTMuNDMxIDgzLjQzMSAxNDAgMTAwIDE0MFoiIGZpbGw9IiNEQ0U3RjAiLz4KPC9zdmc+'
                              e.currentTarget.alt = 'Image failed to load'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                          {index + 1}
                        </div>
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          ✓ Uploaded
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                {errors.root.message}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
              <Link href="/dashboard/makanan" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-12 text-base border-gray-300 text-gray-700 hover:bg-gray-50">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
