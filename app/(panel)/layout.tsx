import { cookies } from "next/headers";
import { PanelShell } from "@/components/panel-shell";
import { requireSession } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  const store = await cookies();
  const defaultCollapsed = store.get("panel_sidebar")?.value === "collapsed";

  return <PanelShell defaultCollapsed={defaultCollapsed}>{children}</PanelShell>;
}
