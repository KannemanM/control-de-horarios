import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { isValidMonthKey, monthKeyOf } from "@/lib/time";
import { getPlanillaMonth } from "@/lib/planilla-data";
import { PlanillaBoard } from "./planilla-board";
import { MonthPicker } from "./month-picker";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planilla" };

export default async function PlanillaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  await requireSession();

  const params = await searchParams;
  const mesParam = Array.isArray(params.mes) ? params.mes[0] : params.mes;
  const mes = isValidMonthKey(mesParam) ? mesParam : monthKeyOf(new Date());

  const { operators, weeks } = await getPlanillaMonth(mes);

  return (
    <div className="animate-fade-in">
      <div className="print:hidden">
        <PageHeader
          title="Planilla"
          description="Cargá horarios de entrada y salida por turno, más horas extras. Los totales se calculan solos."
          actions={
            <>
              <MonthPicker month={mes} />
              <PrintButton />
            </>
          }
        />
      </div>

      <PlanillaBoard
        key={mes}
        month={mes}
        initialOperators={operators}
        weeks={weeks}
      />
    </div>
  );
}
