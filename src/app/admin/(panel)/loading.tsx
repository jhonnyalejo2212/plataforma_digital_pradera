export default function PanelLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-64 rounded-lg bg-line/70" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[100px] rounded-[13px] bg-line/60" />)}
      </div>
      <div className="h-[260px] rounded-[13px] bg-line/50" />
    </div>
  );
}
