-- CreateEnum
CREATE TYPE "TipoTurno" AS ENUM ('ORDINARIO', 'EXTRA');

-- AlterTable
ALTER TABLE "Turno" DROP CONSTRAINT "Turno_operarioId_fecha_key";
ALTER TABLE "Turno" ADD COLUMN "tipo" "TipoTurno" NOT NULL DEFAULT 'ORDINARIO';
ALTER TABLE "Turno" ADD COLUMN "secuencia" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Turno" ALTER COLUMN "entrada" DROP NOT NULL;
ALTER TABLE "Turno" ALTER COLUMN "salida" DROP NOT NULL;
ALTER TABLE "Turno" ADD COLUMN "horasExtras" INTEGER;

-- AlterIndex
DROP INDEX "Turno_operarioId_fecha_key";
CREATE INDEX "Turno_operarioId_fecha_idx" ON "Turno"("operarioId", "fecha");
