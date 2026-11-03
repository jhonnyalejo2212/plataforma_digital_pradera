import { Suspense, type ReactNode } from "react";

export function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-64 rounded-lg bg-line/70" />
      <div className="h-[320px] rounded-[13px] bg-line/50" />
    </div>
  );
}

/** Envuelve una página del panel que lee datos de la petición para que cargue en streaming con un esqueleto. */
export function withPanelSuspense<P extends object>(Page: (props: P) => Promise<ReactNode>) {
  return function PanelPage(props: P) {
    return (
      <Suspense fallback={<PanelSkeleton />}>
        <Page {...props} />
      </Suspense>
    );
  };
}
