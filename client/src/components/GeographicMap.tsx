import { useEffect, useState, useRef } from "react";

interface GeographicData {
  state: string;
  value: number;
  color: string;
}

interface GeographicMapProps {
  data: GeographicData[];
  title: string;
}

interface GeoFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][][] | number[][][];
  };
  properties: {
    sigla: string;
    name: string;
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  state: string;
  name: string;
  value: number | null;
}

// Converte coordenadas geográficas [lng, lat] para coordenadas SVG [x, y]
// Bounds do Brasil: lng -73.99 a -28.85, lat -33.75 a 5.27
const BOUNDS = {
  minLng: -73.99,
  maxLng: -28.85,
  minLat: -33.75,
  maxLat: 5.27,
};
const SVG_W = 500;
const SVG_H = 520;

function project(lng: number, lat: number): [number, number] {
  const x =
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * SVG_W;
  // lat invertido pois SVG cresce para baixo
  const y =
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_H;
  return [x, y];
}

function ringToPath(ring: number[][]): string {
  return ring
    .map(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function featureToPath(feature: GeoFeature): string {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    return (coordinates as number[][][])
      .map((ring) => ringToPath(ring))
      .join(" ");
  }
  if (type === "MultiPolygon") {
    return (coordinates as number[][][][])
      .flatMap((poly) => poly.map((ring) => ringToPath(ring)))
      .join(" ");
  }
  return "";
}

export function GeographicMap({ data, title }: GeographicMapProps) {
  const [geoJSON, setGeoJSON] = useState<GeoJSON | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    state: "",
    name: "",
    value: null,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/states/brazil-states.json")
      .then((r) => r.json())
      .then((json) => setGeoJSON(json))
      .catch(console.error);
  }, []);

  const dataMap = new Map(data.map((d) => [d.state, d]));
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  function handleMouseMove(
    e: React.MouseEvent<SVGPathElement>,
    feature: GeoFeature
  ) {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const stateData = dataMap.get(feature.properties.sigla);
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      state: feature.properties.sigla,
      name: feature.properties.name,
      value: stateData?.value ?? null,
    });
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }

  return (
    <div className="bg-white rounded-[31px] p-6">
      <h2 className="text-black text-base font-semibold mb-4">{title}</h2>
      <div className="flex gap-6 items-start">
        {/* Mapa SVG */}
        <div className="flex-1 relative">
          {!geoJSON ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Carregando mapa...
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-full"
              style={{ maxHeight: "340px" }}
            >
              {geoJSON.features.map((feature) => {
                const sigla = feature.properties.sigla;
                const stateData = dataMap.get(sigla);
                const pathD = featureToPath(feature);

                const fill = stateData
                  ? stateData.color
                  : "#e5e7eb";
                const opacity = stateData
                  ? 0.4 + 0.6 * (stateData.value / maxValue)
                  : 1;

                return (
                  <path
                    key={sigla}
                    d={pathD}
                    fill={fill}
                    fillOpacity={opacity}
                    stroke="#fff"
                    strokeWidth="0.8"
                    style={{ cursor: stateData ? "pointer" : "default", transition: "fill-opacity 0.15s" }}
                    onMouseMove={(e) => handleMouseMove(e, feature)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
            </svg>
          )}

          {/* Tooltip */}
          {tooltip.visible && (
            <div
              className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg"
              style={{
                left: tooltip.x + 10,
                top: tooltip.y - 36,
                whiteSpace: "nowrap",
              }}
            >
              <div className="font-semibold">{tooltip.name} ({tooltip.state})</div>
              {tooltip.value !== null && (
                <div className="text-gray-300">{tooltip.value}% das impressões</div>
              )}
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-3 pt-2 min-w-[120px]">
          {data.map((item) => (
            <div key={item.state} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-black text-xs font-medium">{item.state}</span>
              <span className="text-black/50 text-xs ml-auto">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
