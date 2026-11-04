import { requireSession } from "@/lib/auth";
import { getPlanillaMonth } from "@/lib/planilla-data";
import { buildPlanillaWorkbook } from "@/lib/planilla-export";
import { isValidMonthKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireSession();

  const url = new URL(request.url);
  const mes = url.searchParams.get("mes") ?? "";

  if (!isValidMonthKey(mes)) {
    return new Response("Mes inválido.", { status: 400 });
  }

  const operarioParam = url.searchParams.get("operario");
  const operarioId =
    operarioParam && /^\d+$/.test(operarioParam) ? Number(operarioParam) : null;

  const data = await getPlanillaMonth(mes);

  let operators = data.operators;
  let operatorName: string | null = null;

  if (operarioId !== null) {
    const selected = data.operators.find(
      (operator) => operator.id === operarioId,
    );
    if (!selected) {
      return new Response("El operario no está activo en este mes.", {
        status: 400,
      });
    }
    operators = [selected];
    operatorName = selected.nombre;
  }

  const { buffer, filename } = await buildPlanillaWorkbook(
    { ...data, operators },
    { operatorName },
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
        filename,
      )}`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
