import { PrismaClient } from "@prisma/client";
import { hashSecret } from "../lib/password";
import {
  combineDateAndTime,
  dateFromKey,
  monthDays,
  monthKeyOf,
  shiftMonthKey,
  todayKey,
  weekdayOfKey,
} from "../lib/time";

const prisma = new PrismaClient();

type ShiftSeed = {
  operarioId: number;
  fecha: Date;
  entrada: Date;
  salida: Date;
};

function makeShift(
  operarioId: number,
  day: string,
  entrada: string,
  salida: string,
): ShiftSeed {
  return {
    operarioId,
    fecha: dateFromKey(day),
    entrada: combineDateAndTime(day, entrada),
    salida: combineDateAndTime(day, salida),
  };
}

async function main() {
  await prisma.turno.deleteMany();
  await prisma.operario.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.usuario.create({
    data: { passwordHash: hashSecret("admin123") },
  });

  const [juan, maria, lucas] = await Promise.all([
    prisma.operario.create({ data: { nombre: "Juan Pérez" } }),
    prisma.operario.create({ data: { nombre: "María Gómez" } }),
    prisma.operario.create({ data: { nombre: "Lucas Fernández" } }),
  ]);

  const currentMonth = monthKeyOf(new Date());
  const previousMonth = shiftMonthKey(currentMonth, -1);
  const today = todayKey();
  const shifts: ShiftSeed[] = [];

  function addMonth(month: string, onlyPast: boolean) {
    for (const day of monthDays(month)) {
      if (onlyPast && day > today) continue;

      const weekday = weekdayOfKey(day);

      if (weekday === 0) continue;

      if (weekday === 6) {
        const dayNumber = Number(day.slice(8));
        if (dayNumber >= 8 && dayNumber <= 14) {
          shifts.push(makeShift(juan.id, day, "09:00", "13:00"));
        }
        continue;
      }

      shifts.push(makeShift(juan.id, day, "09:00", "17:00"));
      shifts.push(makeShift(maria.id, day, "08:30", "16:30"));
      shifts.push(makeShift(lucas.id, day, "09:15", "17:15"));
    }
  }

  addMonth(previousMonth, false);
  addMonth(currentMonth, true);

  await prisma.turno.createMany({ data: shifts });

  console.log(
    `Listo: 3 operarios, ${shifts.length} horarios y contraseña admin123.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
