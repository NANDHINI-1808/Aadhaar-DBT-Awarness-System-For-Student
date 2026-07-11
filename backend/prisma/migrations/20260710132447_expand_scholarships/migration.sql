/*
  Warnings:

  - You are about to drop the column `deadline` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Scholarship` table. All the data in the column will be lost.
  - Added the required column `eligibilityCriteria` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `officialLink` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `procedure` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `renewalInfo` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Scholarship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Scholarship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scholarship" DROP COLUMN "deadline",
DROP COLUMN "type",
ADD COLUMN     "courseEligibility" TEXT[],
ADD COLUMN     "eligibilityCriteria" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "genderEligibility" TEXT[],
ADD COLUMN     "officialLink" TEXT NOT NULL,
ADD COLUMN     "procedure" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "renewalInfo" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "stateEligibility" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL;
