'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
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

function createMarkerIcon(kategori: string, isSelected: boolean = false): L.DivIcon {
  const color = KATEGORI_COLORS[kategori] || '#6b7280';
  const size = isSelected ? 36 : 26;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size + 10}px;
      ">
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: 0;
          top: 0;
          background: ${color};
          border: ${isSelected ? 3 : 2}px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: ${isSelected ? '0 0 0 4px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.25)'};
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: ${isSelected ? 10 : 7}px;
            height: ${isSelected ? 10 : 7}px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 4)],
  });
}

function createPopupContent(marker: MapMarker): string {
  const color = KATEGORI_COLORS[marker.kategori] || '#6b7280';
  const label = KATEGORI_LABELS[marker.kategori] || marker.kategori;

  return `
    <div style="padding: 14px 16px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%; flex-shrink: 0;"></div>
        <span style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.5px;">
          ${label}${marker.keterangan ? ` · ${marker.keterangan}` : ''}
        </span>
      </div>
      <h3 style="font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">${marker.nama}</h3>
      ${marker.nik && marker.nik !== '-' ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span style="color: #888;">NIK</span>
          <span style="color: #333; font-weight: 500; font-family: monospace;">${marker.nik}</span>
        </div>
      ` : ''}
      ${marker.kk && marker.kk !== '-' ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span style="color: #888;">KK</span>
          <span style="color: #333; font-weight: 500; font-family: monospace;">${marker.kk}</span>
        </div>
      ` : ''}
      ${marker.alamat ? `
        <div style="font-size: 12px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
          📍 ${marker.alamat}
        </div>
      ` : ''}
      <div style="font-size: 10px; color: #aaa; margin-top: 6px;">
        🌐 ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}
      </div>
    </div>
  `;
}

export default function MapComponent({
  markers,
  center = [-7.08, 107.79],
  zoom = 13,
  selectedId,
  onSelect,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const markersMap = useMemo(() => {
    const map = new Map<string, MapMarker>();
    markers.forEach((m) => map.set(m.id, m));
    return map;
  }, [markers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const containerEl = mapContainerRef.current;

    // Small delay to ensure container has dimensions
    const initTimeout = setTimeout(() => {
      const map = L.map(containerEl, {
        center,
        zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      // Multiple invalidateSize calls to ensure proper rendering
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
      setTimeout(() => map.invalidateSize(), 1000);
    }, 50);

    return () => {
      clearTimeout(initTimeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update markers when data changes or map becomes ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    markers.forEach((markerData) => {
      const isSelected = markerData.id === selectedId;
      const marker = L.marker([markerData.lat, markerData.lng], {
        icon: createMarkerIcon(markerData.kategori, isSelected),
      });

      marker.bindPopup(createPopupContent(markerData), {
        maxWidth: 300,
        closeButton: true,
      });

      marker.on('click', () => {
        if (onSelect) {
          onSelect(markerData.id);
        }
      });

      marker.addTo(map);
      markersRef.current.set(markerData.id, marker);
    });
  }, [markers, selectedId, onSelect, mapReady]);

  // Fly to selected marker + open popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const markerData = markersMap.get(selectedId);
    if (markerData) {
      map.flyTo([markerData.lat, markerData.lng], 16, { duration: 0.8 });
      const marker = markersRef.current.get(selectedId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 500);
      }
    }
  }, [selectedId, markersMap]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 500);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    />
  );
}
