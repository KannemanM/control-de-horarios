-- AlterTable
ALTER TABLE "Operario" ADD COLUMN "fechaAlta" TIMESTAMP(3);
ALTER TABLE "Operario" ADD COLUMN "fechaBaja" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Operario_fechaBaja_idx" ON "Operario"("fechaBaja");
