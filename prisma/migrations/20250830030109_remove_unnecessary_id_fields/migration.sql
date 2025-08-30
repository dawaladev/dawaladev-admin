/*
  Warnings:

  - You are about to drop the column `nama_paket_id` on the `jenis_paket` table. All the data in the column will be lost.
  - You are about to drop the column `deskripsi_id` on the `makanan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."jenis_paket" DROP COLUMN "nama_paket_id";

-- AlterTable
ALTER TABLE "public"."makanan" DROP COLUMN "deskripsi_id";
