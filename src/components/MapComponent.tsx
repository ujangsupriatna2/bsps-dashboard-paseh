'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  nama: string;
  kategori: string;
  nik?: string | null;
  kk?: string | null;
  alamat?: string | null;
  keterangan?: string | null;
}

interface MapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const KATEGORI_COLORS: Record<string, string> = {
  data_awal: '#22c55e',
  data_susulan: '#22c55e',
  layak_huni: '#eab308',
  data_cadangan: '#ef4444',
};

const KATEGORI_LABELS: Record<string, string> = {
  data_awal: 'Data Awal',
  data_susulan: 'Data Susulan',
  layak_huni: 'Layak Huni',
  data_cadangan: 'Data Cadangan',
};

function createCustomIcon(kategori: string, isSelected: boolean = false): L.DivIcon {
  const color = KATEGORI_COLORS[kategori] || '#6b7280';
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 4 : 3;
  const shadow = isSelected
    ? '0 0 0 6px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.25)';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        transition: all 0.2s ease;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createPopupContent(marker: MapMarker): string {
  const color = KATEGORI_COLORS[marker.kategori] || '#6b7280';
  const label = KATEGORI_LABELS[marker.kategori] || marker.kategori;

  return `
    <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="
          width: 12px;
          height: 12px;
          background: ${color};
          border-radius: 50%;
          flex-shrink: 0;
        "></div>
        <span style="
          font-size: 11px;
          font-weight: 600;
          color: ${color};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">${label}${marker.keterangan ? ` - ${marker.keterangan}` : ''}</span>
      </div>
      <h3 style="
        font-size: 16px;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 8px 0;
      ">${marker.nama}</h3>
      ${marker.nik && marker.nik !== '-' ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
          <span style="color: #666;">NIK</span>
          <span style="color: #333; font-weight: 500;">${marker.nik}</span>
        </div>
      ` : ''}
      ${marker.kk && marker.kk !== '-' ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
          <span style="color: #666;">KK</span>
          <span style="color: #333; font-weight: 500;">${marker.kk}</span>
        </div>
      ` : ''}
      ${marker.alamat ? `
        <div style="font-size: 12px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          📍 ${marker.alamat}
        </div>
      ` : ''}
      <div style="font-size: 11px; color: #999; margin-top: 8px;">
        🌐 ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}
      </div>
    </div>
  `;
}

export default function MapComponent({ markers, center = [-7.08, 107.79], zoom = 13, selectedId, onSelect }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const isSelected = marker.id === selectedId;
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(marker.kategori, isSelected),
      });

      leafletMarker.bindPopup(createPopupContent(marker), {
        maxWidth: 300,
        closeButton: true,
      });

      leafletMarker.on('click', () => {
        if (onSelect) {
          onSelect(marker.id);
        }
      });

      markersLayerRef.current!.addLayer(leafletMarker);
    });
  }, [markers, selectedId, onSelect]);

  // Fly to selected marker
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;

    const marker = markers.find((m) => m.id === selectedId);
    if (marker) {
      mapRef.current.flyTo([marker.lat, marker.lng], 16, {
        duration: 0.8,
      });
    }
  }, [selectedId, markers]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
  );
}
