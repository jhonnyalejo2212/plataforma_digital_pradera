"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type MapViewProps = { latitud: number; longitud: number; titulo: string; zoom?: number; className?: string };

/**
 * Único punto que conoce el proveedor de mapas (hoy Leaflet + OpenStreetMap).
 * Para migrar a Google Maps basta con reemplazar la implementación de este componente.
 */
export function MapView({ latitud, longitud, titulo, zoom = 16, className }: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([latitud, longitud], zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const label = document.createElement("span");
      label.textContent = titulo;
      L.marker([latitud, longitud], {
        title: titulo,
        icon: L.divIcon({
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          html: '<span style="display:block;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#286b4c;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3)"></span>',
        }),
      })
        .addTo(map)
        .bindTooltip(label, { direction: "top", offset: [0, -28] });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitud, longitud, titulo, zoom]);

  return <div ref={ref} role="img" aria-label={`Mapa de ubicación de ${titulo}`} className={className ?? "h-[260px] w-full overflow-hidden rounded-[13px] bg-[#e8eee9]"} />;
}
