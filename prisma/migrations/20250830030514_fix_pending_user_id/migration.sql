-- AlterTable
ALTER TABLE "public"."pending_users" ADD CONSTRAINT "pending_users_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "public"."pending_users_id_key";
