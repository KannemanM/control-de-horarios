export default function PanelLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-4 w-80 max-w-full" />
        </div>
        <div className="skeleton h-10 w-56" />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="skeleton h-9 w-56" />
          <div className="skeleton h-10 w-28" />
        </div>
        <div className="space-y-px bg-ink-100">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[36%_25%_25%_14%] gap-2 bg-white px-3 py-2.5"
            >
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-7 w-full" />
              <div className="skeleton h-7 w-full" />
              <div className="skeleton ml-auto h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
