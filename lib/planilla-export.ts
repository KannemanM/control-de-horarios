import ExcelJS from "exceljs";
import {
  dateFromKey,
  formatDateNumeric,
  formatTime,
  monthLabel,
  weekdayName,
} from "./time";
import {
  totalForOperator,
  totalForWeek,
  type PlanillaWeek,
} from "./planilla";
import type { PlanillaMonthData } from "./planilla-data";

const HEADER_FILL = "FF0F172A";
const HEADER_TEXT = "FFFFFFFF";
const TOTAL_FILL = "FFF1F5F9";
const BORDER_COLOR = "FFE2E8F0";
const MUTED_TEXT = "FF64748B";

const HOURS_FORMAT = "0.00";
const DATE_FORMAT = "dd/mm/yyyy";

/** Minutos -> horas decimales con 2 decimales (7:20 -> 7.33). */
function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

function weekRange(week: PlanillaWeek): string {
  const [, range] = week.label.split(" · ");
  return range ?? "";
}

function styleHeaderRow(row: ExcelJS.Row, columns: number) {
  row.height = 30;
  for (let i = 1; i <= columns; i += 1) {
    const cell = row.getCell(i);
    cell.font = { bold: true, size: 11, color: { argb: HEADER_TEXT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF334155" } },
    };
  }
}

function styleDataCell(cell: ExcelJS.Cell, align: "left" | "center" | "right") {
  cell.font = { size: 11, color: { argb: "FF0F172A" } };
  cell.alignment = { vertical: "middle", horizontal: align };
  cell.border = {
    bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  };
}

function styleTotalRow(row: ExcelJS.Row, columns: number) {
  for (let i = 1; i <= columns; i += 1) {
    const cell = row.getCell(i);
    cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TOTAL_FILL },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "double", color: { argb: "FF94A3B8" } },
    };
  }
}

function writeTitle(
  sheet: ExcelJS.Worksheet,
  columns: number,
  title: string,
  subtitle: string,
) {
  sheet.mergeCells(1, 1, 1, columns);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 15, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, columns);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { size: 10, color: { argb: MUTED_TEXT } };
  subtitleCell.alignment = { vertical: "middle" };
  sheet.getRow(2).height = 18;
}

function buildResumen(
  workbook: ExcelJS.Workbook,
  data: PlanillaMonthData,
  operatorLabel: string,
  generatedAt: string,
) {
  const sheet = workbook.addWorksheet("Resumen", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  const headers = [
    "Operario",
    "Días",
    ...data.weeks.map((week, index) => {
      const range = weekRange(week);
      return range ? `Sem ${index + 1} (${range})` : `Sem ${index + 1}`;
    }),
    "Total mes",
    "Hs ordinarias",
    "Hs extra",
  ];

  writeTitle(
    sheet,
    headers.length,
    `Planilla · ${monthLabel(data.month)}`,
    `${operatorLabel} · Generado el ${generatedAt}`,
  );

  const headerRow = sheet.getRow(4);
  headers.forEach((header, index) => {
    headerRow.getCell(index + 1).value = header;
  });
  styleHeaderRow(headerRow, headers.length);

  const widths = [28, 8, ...data.weeks.map(() => 13), 13, 14, 12];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  let rowIndex = 5;
  const weekTotals = data.weeks.map(() => 0);
  let totalMinutes = 0;
  let ordinarioMinutes = 0;
  let extraMinutes = 0;

  for (const operator of data.operators) {
    const row = sheet.getRow(rowIndex);
    const weekValues = data.weeks.map((week) =>
      totalForWeek(operator.shifts, week),
    );
    const operatorTotal = totalForOperator(operator.shifts);
    const ordinario = Object.values(operator.shifts).reduce(
      (acc, day) => acc + day.ordinarioMinutes,
      0,
    );
    const extra = Object.values(operator.shifts).reduce(
      (acc, day) => acc + day.extraMinutes,
      0,
    );
    const workedDays = Object.values(operator.shifts).filter(
      (day) => day.totalMinutes > 0,
    ).length;

    weekValues.forEach((minutes, index) => {
      weekTotals[index] += minutes;
    });
    totalMinutes += operatorTotal;
    ordinarioMinutes += ordinario;
    extraMinutes += extra;

    row.getCell(1).value = operator.nombre;
    row.getCell(2).value = workedDays;
    weekValues.forEach((minutes, index) => {
      row.getCell(3 + index).value = toHours(minutes);
    });
    row.getCell(3 + weekValues.length).value = toHours(operatorTotal);
    row.getCell(4 + weekValues.length).value = toHours(ordinario);
    row.getCell(5 + weekValues.length).value = toHours(extra);

    for (let i = 1; i <= headers.length; i += 1) {
      const cell = row.getCell(i);
      styleDataCell(cell, i === 1 ? "left" : i === 2 ? "center" : "right");
      if (i >= 3) cell.numFmt = HOURS_FORMAT;
    }

    rowIndex += 1;
  }

  const totalRow = sheet.getRow(rowIndex);
  totalRow.getCell(1).value = "TOTAL";
  weekTotals.forEach((minutes, index) => {
    totalRow.getCell(3 + index).value = toHours(minutes);
  });
  totalRow.getCell(3 + weekTotals.length).value = toHours(totalMinutes);
  totalRow.getCell(4 + weekTotals.length).value = toHours(ordinarioMinutes);
  totalRow.getCell(5 + weekTotals.length).value = toHours(extraMinutes);

  for (let i = 1; i <= headers.length; i += 1) {
    const cell = totalRow.getCell(i);
    cell.alignment = {
      vertical: "middle",
      horizontal: i === 1 ? "left" : "right",
    };
    if (i >= 3) cell.numFmt = HOURS_FORMAT;
  }
  styleTotalRow(totalRow, headers.length);
}

function buildDetalle(
  workbook: ExcelJS.Workbook,
  data: PlanillaMonthData,
  operatorLabel: string,
  generatedAt: string,
) {
  const sheet = workbook.addWorksheet("Detalle", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 4 }],
  });

  const headers = [
    "Operario",
    "Fecha",
    "Día",
    "Semana",
    "Entrada 1",
    "Salida 1",
    "Entrada 2",
    "Salida 2",
    "Hs ord.",
    "Hs extra",
    "Total",
    "Observación",
  ];

  writeTitle(
    sheet,
    headers.length,
    `Detalle diario · ${monthLabel(data.month)}`,
    `${operatorLabel} · Generado el ${generatedAt}`,
  );

  const headerRow = sheet.getRow(4);
  headers.forEach((header, index) => {
    headerRow.getCell(index + 1).value = header;
  });
  styleHeaderRow(headerRow, headers.length);

  const widths = [28, 12, 11, 10, 10, 10, 10, 10, 10, 10, 10, 42];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const weekByDay = new Map<string, string>();
  data.weeks.forEach((week, index) => {
    for (const day of week.days) {
      weekByDay.set(day.key, `Sem ${index + 1}`);
    }
  });

  let rowIndex = 5;
  for (const operator of data.operators) {
    for (const day of data.days) {
      const dayData = operator.shifts[day.key];
      if (!dayData) continue;
      if (dayData.turnos.length === 0 && !dayData.observacion) continue;

      const manana = dayData.turnos.find(
        (turno) => turno.tipo === "ORDINARIO" && turno.secuencia === 1,
      );
      const tarde = dayData.turnos.find(
        (turno) => turno.tipo === "ORDINARIO" && turno.secuencia === 2,
      );

      const row = sheet.getRow(rowIndex);
      row.getCell(1).value = operator.nombre;
      row.getCell(2).value = dateFromKey(day.key);
      row.getCell(2).numFmt = DATE_FORMAT;
      row.getCell(3).value = weekdayName(day.weekday);
      row.getCell(4).value = weekByDay.get(day.key) ?? "";
      row.getCell(5).value = manana?.entrada ?? "";
      row.getCell(6).value = manana?.salida ?? "";
      row.getCell(7).value = tarde?.entrada ?? "";
      row.getCell(8).value = tarde?.salida ?? "";
      row.getCell(9).value = toHours(dayData.ordinarioMinutes);
      row.getCell(10).value = toHours(dayData.extraMinutes);
      row.getCell(11).value = toHours(dayData.totalMinutes);
      row.getCell(12).value = dayData.observacion ?? "";

      for (let i = 1; i <= headers.length; i += 1) {
        const cell = row.getCell(i);
        const align =
          i === 1 || i === 12
            ? "left"
            : i === 2 || i === 3 || i === 4
              ? "center"
              : "right";
        styleDataCell(cell, align);
        if (i === 2) cell.numFmt = DATE_FORMAT;
        if (i === 9 || i === 10 || i === 11) cell.numFmt = HOURS_FORMAT;
      }
      row.getCell(12).alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };

      rowIndex += 1;
    }
  }

  if (rowIndex > 5) {
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: rowIndex - 1, column: headers.length },
    };
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function buildPlanillaWorkbook(
  data: PlanillaMonthData,
  options: { operatorName?: string | null } = {},
): Promise<{ buffer: Buffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Turnos";
  workbook.created = new Date();

  const operatorName = options.operatorName?.trim() || null;
  const operatorLabel = operatorName
    ? `Operario: ${operatorName}`
    : "Todos los operarios";
  const now = new Date();
  const generatedAt = `${formatDateNumeric(now)} ${formatTime(now)}`;

  buildResumen(workbook, data, operatorLabel, generatedAt);
  buildDetalle(workbook, data, operatorLabel, generatedAt);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const suffix = operatorName ? `-${slugify(operatorName)}` : "";
  const filename = `planilla-${data.month}${suffix}.xlsx`;

  return { buffer, filename };
}
