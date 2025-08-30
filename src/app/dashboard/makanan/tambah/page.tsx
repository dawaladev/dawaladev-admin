'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { translateText } from '@/lib/translate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Utensils, Upload, X, Image as ImageIcon, Plus, Camera, ChevronDown, AlertCircle, CheckCircle, Languages } from 'lucide-react'
import Link from 'next/link'
import { makananSchema, type MakananFormData } from '@/lib/validations'
import { Toast } from '@/components/ui/toast'

interface JenisPaket {
  id: number
  namaPaket: string
}

export default function TambahMakananPage() {
  const [jenisPaketList, setJenisPaketList] = useState<JenisPaket[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
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
  } = useForm<MakananFormData>({
    resolver: zodResolver(makananSchema),
  })

  // Watch the description field for character count
  const watchedDescription = watch('deskripsi', '')

  useEffect(() => {
    // Update description length
    setDescriptionLength(watchedDescription.length)
  }, [watchedDescription])

  const handleAutoTranslateDescription = async (text: string) => {
    if (!text.trim()) {
      setDeskripsiEn('')
      return
    }

    setIsTranslating(true)
    try {
      const translated = await translateText(text, 'en')
      setDeskripsiEn(translated)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }

  useEffect(() => {
    // Fetch jenis paket list
    const fetchJenisPaket = async () => {
      try {
        const response = await fetch('/api/jenis-paket')
        if (response.ok) {
          const data = await response.json()
          setJenisPaketList(data)
        }
      } catch (error) {
        console.error('Error fetching jenis paket:', error)
      }
    }

    fetchJenisPaket()
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
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
      const newImageUrls = data.files.map((file: any) => file.url)
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
      const response = await fetch('/api/makanan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namaMakanan: data.namaMakanan,
          deskripsi: data.deskripsi,
          deskripsiEn: deskripsiEn,
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
      showToast('Menu berhasil disimpan!', 'success')
      
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
          <h1 className="text-3xl font-bold text-gray-900">Tambah Menu Makanan</h1>
          <p className="text-gray-600">Tambah menu makanan baru ke database</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Form Header */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
            <div className="p-3 bg-green-100 rounded-xl">
              <Utensils className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Form Menu Makanan</h2>
              <p className="text-green-600">Lengkapi informasi menu makanan</p>
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
                onChange={(e) => {
                  register('deskripsi').onChange(e)
                  // Auto-translate after user stops typing (debounced)
                  clearTimeout((window as any).translateTimeout)
                  ;(window as any).translateTimeout = setTimeout(() => {
                    handleAutoTranslateDescription(e.target.value)
                  }, 2000) // Wait 2 seconds after user stops typing
                }}
                placeholder="Deskripsikan menu makanan dengan detail... (minimal 10 karakter, maksimal 2000 karakter)"
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

            {/* English Description Preview */}
            {deskripsiEn && (
              <div>
                <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi (English) - Preview
                  {isTranslating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  <Languages className="h-4 w-4 text-blue-600" />
                </Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 whitespace-pre-line">{deskripsiEn}</p>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Terjemahan otomatis dari bahasa Indonesia ke English
                </p>
              </div>
            )}

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
                            Upload Foto Menu
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
                          <img
                            src={url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTE2LjU2OSA3MCAxMzAgODMuNDMxIDEzMCAxMDBDMTMwIDExNi41NjkgMTE2LjU2OSAxMzAgMTAwIDEzMEM4My40MzEgMTMwIDcwIDExNi41NjkgNzAgMTAwQzcwIDgzLjQzMSA4My40MzEgNzAgMTAwIDcwWiIgZmlsbD0iI0QxRDU5QiIvPgo8cGF0aCBkPSJNMTAwIDE0MEMxMTYuNTY5IDE0MCAxMzAgMTUzLjQzMSAxMzAgMTcwQzEzMCAxODYuNTY5IDExNi41NjkgMjAwIDEwMCAyMDBDODMuNDMxIDIwMCA3MCAxODYuNTY5IDcwIDE3MEM3MCAxNTMuNDMxIDgzLjQzMSAxNDAgMTAwIDE0MFoiIGZpbGw9IiNEQ0U3RjAiLz4KPC9zdmc+'}
                            alt={`Preview ${index + 1}`}
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
                    <Plus className="h-4 w-4 mr-2" />
                    Simpan Menu
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