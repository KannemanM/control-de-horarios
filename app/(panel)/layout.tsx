import { Sidebar } from "@/components/sidebar";
import { requireSession } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="panel-layout min-h-screen lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
      <Sidebar />
      <main className="panel-main min-w-0 px-4 pb-20 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="panel-content mx-auto w-full max-w-[1240px]">{children}</div>
      </main>
    </div>
  );
}
