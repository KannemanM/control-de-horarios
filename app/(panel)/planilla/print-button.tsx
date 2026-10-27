"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  function handlePrint() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    window.setTimeout(() => {
      window.print();
    }, 250);
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="btn-secondary h-10 px-3.5 text-[13px] print:hidden"
      title="Imprimir planilla"
      aria-label="Imprimir planilla"
    >
      <Printer className="h-4 w-4" />
      Imprimir
    </button>
  );
}
