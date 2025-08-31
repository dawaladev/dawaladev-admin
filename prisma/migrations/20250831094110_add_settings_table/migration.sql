-- CreateTable
CREATE TABLE "public"."settings" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "no_telp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
