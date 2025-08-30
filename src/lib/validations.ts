import { z } from "zod"

// Login form validation
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Register form validation
export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Forgot password form validation
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Reset password form validation
export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// JenisPaket form validation
export const jenisPaketSchema = z.object({
  namaPaket: z.string().min(2, "Nama paket minimal 2 karakter").max(100, "Nama paket maksimal 100 karakter"),
  namaPaketEn: z.string().optional(),
})

export type JenisPaketFormData = z.infer<typeof jenisPaketSchema>

// Makanan form validation
export const makananSchema = z.object({
  namaMakanan: z.string().min(2, "Nama makanan minimal 2 karakter").max(100, "Nama makanan maksimal 100 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter").max(10000, "Deskripsi maksimal 2000 karakter"),
  deskripsiEn: z.string().optional(),
  foto: z.array(z.string().url("URL foto tidak valid")).min(1, "Minimal 1 foto harus diupload"),
  harga: z.number().min(1000, "Harga minimal Rp 1.000").max(1000000, "Harga maksimal Rp 1.000.000"),
  jenisPaketId: z.number().min(1, "Jenis paket harus dipilih"),
})

export type MakananFormData = z.infer<typeof makananSchema>

// Admin form validation
export const adminSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
})

export type AdminFormData = z.infer<typeof adminSchema>

// Admin edit form validation (without password)
export const adminEditSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
})

export type AdminEditFormData = z.infer<typeof adminEditSchema> 