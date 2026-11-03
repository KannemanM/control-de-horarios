-- CreateTable
CREATE TABLE "ObservacionDia" (
    "id" SERIAL NOT NULL,
    "operarioId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObservacionDia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObservacionDia_fecha_idx" ON "ObservacionDia"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ObservacionDia_operarioId_fecha_key" ON "ObservacionDia"("operarioId", "fecha");

-- AddForeignKey
ALTER TABLE "ObservacionDia" ADD CONSTRAINT "ObservacionDia_operarioId_fkey" FOREIGN KEY ("operarioId") REFERENCES "Operario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
