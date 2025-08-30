-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pending_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."jenis_paket" (
    "id" SERIAL NOT NULL,
    "nama_paket" TEXT NOT NULL,
    "nama_paket_id" TEXT,
    "nama_paket_en" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jenis_paket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."makanan" (
    "id" SERIAL NOT NULL,
    "nama_makanan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "deskripsi_id" TEXT,
    "deskripsi_en" TEXT,
    "foto" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jenis_paket_id" INTEGER NOT NULL,

    CONSTRAINT "makanan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_id_key" ON "public"."pending_users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pending_users_email_key" ON "public"."pending_users"("email");

-- AddForeignKey
ALTER TABLE "public"."makanan" ADD CONSTRAINT "makanan_jenis_paket_id_fkey" FOREIGN KEY ("jenis_paket_id") REFERENCES "public"."jenis_paket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
