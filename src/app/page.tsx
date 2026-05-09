'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  MapPin, Users, Home, AlertTriangle, Search, Filter,
  ChevronRight, ChevronDown, ChevronUp, Building2,
  CheckCircle2, Clock, XCircle, Camera, X, ImageOff,
  Navigation, LocateFixed, Route, ExternalLink, Lock, ShieldCheck,
  ArrowLeft, List, Map, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Memuat peta...</p>
      </div>
    </div>
  ),
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface BspsEntry {
  id: string;
  nama: string;
  nik: string | null;
  kk: string | null;
  alamat: string | null;
  kecamatan: string;
  desa: string;
  rt: string | null;
  rw: string | null;
  lat: number;
  lng: number;
  kategori: string;
  keterangan: string | null;
}

interface Stats {
  total: number;
  countByKategori: Record<string, number>;
  countByDesa: Record<string, number>;
  countByKecamatan: Record<string, number>;
  kategoriPerDesa: Record<string, Record<string, number>>;
}

interface DokumentasiPhoto {
  key: string;
  label: string;
  exists: boolean;
  url: string | null;
}

interface DokumentasiData {
  id: string;
  nama: string;
  photos: DokumentasiPhoto[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KATEGORI_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  data_awal: {
    label: 'Data Awal',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  data_susulan: {
    label: 'Data Susulan',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: <Clock className="w-4 h-4" />,
  },
  layak_huni: {
    label: 'Layak Huni',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  data_cadangan: {
    label: 'Data Cadangan',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const MARKER_COLORS: Record<string, string> = {
  data_awal: '#22c55e',
  data_susulan: '#22c55e',
  layak_huni: '#eab308',
  data_cadangan: '#ef4444',
};

// ─── Passcode Screen ─────────────────────────────────────────────────────────

function PasscodeScreen({ onAccess }: { onAccess: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('bsps_access', 'true');
        onAccess();
      } else {
        setError(data.error || 'Kode akses salah');
      }
    } catch {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="BSPS" className="w-20 h-20 rounded-2xl shadow-xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Dashboard BSPS</h1>
          <p className="text-sm text-gray-500 mt-1">Pemetaan Bantuan Stimulan Perumahan Swadaya</p>
          <p className="text-xs text-gray-400 mt-0.5">Kecamatan Paseh · Desa Loa · Kabupaten Bandung</p>
        </div>

        <Card className="shadow-xl border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Akses Terbatas</h2>
                <p className="text-xs text-gray-500">Masukkan kode akses untuk melanjutkan</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Masukkan kode akses"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  className="h-12 text-center text-lg tracking-widest font-mono"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold"
                disabled={loading || !code}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-gray-400 mt-6">
          Hubungi administrator untuk mendapatkan kode akses
        </p>
      </div>
    </div>
  );
}

// ─── Photo Grid Component ────────────────────────────────────────────────────

function PhotoGrid({
  photos,
  loading,
  nama,
  onPhotoClick,
}: {
  photos: DokumentasiPhoto[];
  loading: boolean;
  nama: string;
  onPhotoClick: (photo: DokumentasiPhoto) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {photos.map((photo) => (
        <div key={photo.key} className="flex flex-col items-center gap-1">
          {photo.exists && photo.url ? (
            <button
              type="button"
              onClick={() => onPhotoClick(photo)}
              className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-all duration-200 hover:shadow-md cursor-pointer group relative"
            >
              <img
                src={photo.url}
                alt={`${photo.label} - ${nama}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md" />
              </div>
            </button>
          ) : (
            <div className="w-full aspect-[4/3] rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-gray-300" />
            </div>
          )}
          <span className="text-[10px] sm:text-xs text-gray-500 text-center leading-tight">
            {photo.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Detail Panel Component ──────────────────────────────────────────────────

function DetailPanel({
  entry,
  dokumentasi,
  dokLoading,
  onPhotoClick,
  onNavigate,
  userLocation,
}: {
  entry: BspsEntry;
  dokumentasi: DokumentasiData | null;
  dokLoading: boolean;
  onPhotoClick: (photo: DokumentasiPhoto) => void;
  onNavigate: (entry: BspsEntry) => void;
  userLocation: { lat: number; lng: number } | null;
}) {
  const config = KATEGORI_CONFIG[entry.kategori];
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${entry.lat},${entry.lng}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base">
            {entry.nama}
          </h3>
          {entry.keterangan && (
            <p className="text-xs text-gray-500 mt-0.5">{entry.keterangan}</p>
          )}
        </div>
        <Badge
          className={cn('text-[10px] shrink-0', config?.bgColor, config?.color, config?.borderColor)}
          variant="outline"
        >
          {config?.label}
        </Badge>
      </div>

      <Separator />

      {/* Info Section */}
      <div className="space-y-1.5 text-xs">
        {entry.nik && entry.nik !== '-' && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 shrink-0">NIK</span>
            <span className="font-mono text-gray-700 text-right">{entry.nik}</span>
          </div>
        )}
        {entry.kk && entry.kk !== '-' && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 shrink-0">KK</span>
            <span className="font-mono text-gray-700 text-right">{entry.kk}</span>
          </div>
        )}
        {entry.alamat && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 shrink-0">Alamat</span>
            <span className="text-gray-700 text-right max-w-[200px]">{entry.alamat}</span>
          </div>
        )}
        {(entry.rt || entry.rw) && (
          <div className="flex justify-between gap-2">
            <span className="text-gray-400 shrink-0">RT/RW</span>
            <span className="text-gray-700">{entry.rt || '-'}/{entry.rw || '-'}</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span className="text-gray-400 shrink-0">Koordinat</span>
          <span className="font-mono text-[10px] text-gray-700">
            {entry.lat.toFixed(6)}, {entry.lng.toFixed(6)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Navigation Buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'w-full text-xs h-9 border-blue-200 text-blue-700 hover:bg-blue-50',
            userLocation && 'bg-blue-50',
          )}
          onClick={() => onNavigate(entry)}
        >
          <Route className="w-3.5 h-3.5 mr-1.5" />
          Tampilkan Rute di Peta
        </Button>
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-1.5 text-xs h-9 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Buka Rute Google Maps
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </div>

      <Separator />

      {/* Dokumentasi Foto */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Camera className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Dokumentasi Foto</span>
          {dokumentasi && (
            <span className="text-[10px] text-gray-400">
              ({dokumentasi.photos.filter(p => p.exists).length}/{dokumentasi.photos.length})
            </span>
          )}
        </div>
        <PhotoGrid
          photos={dokumentasi?.photos || []}
          loading={dokLoading}
          nama={entry.nama}
          onPhotoClick={onPhotoClick}
        />
      </div>
    </div>
  );
}

// ─── Data List Item ──────────────────────────────────────────────────────────

function DataListItem({
  item,
  isSelected,
  onSelect,
}: {
  item: BspsEntry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const config = KATEGORI_CONFIG[item.kategori];
  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all duration-150',
        'hover:bg-gray-50 border border-transparent',
        isSelected ? `${config?.bgColor} ${config?.borderColor} border` : '',
      )}
      onClick={() => onSelect(item.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-1 ring-white/50"
            style={{ backgroundColor: MARKER_COLORS[item.kategori] }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.nama}</p>
            <p className="text-xs text-gray-500 truncate">
              {item.alamat || `${item.desa}, ${item.kecamatan}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge
            className={cn('text-[9px] px-1.5 py-0', config?.bgColor, config?.color, config?.borderColor)}
            variant="outline"
          >
            {config?.label}
          </Badge>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Data state
  const [data, setData] = useState<BspsEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Documentation state
  const [dokumentasi, setDokumentasi] = useState<DokumentasiData | null>(null);
  const [dokLoading, setDokLoading] = useState(false);

  // Photo dialog state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DokumentasiPhoto | null>(null);

  // Mobile view state - 'map' | 'list' | 'detail'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Location & routing state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [routeTarget, setRouteTarget] = useState<BspsEntry | null>(null);

  // Overlay visibility state
  const [showLocationPanel, setShowLocationPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Check existing auth
  useEffect(() => {
    const stored = localStorage.getItem('bsps_access');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Fetch main data
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter) params.set('kategori', activeFilter);
      if (searchQuery) params.set('search', searchQuery);

      const [dataRes, statsRes] = await Promise.all([
        fetch(`/api/bsps?${params.toString()}`),
        fetch('/api/bsps/stats'),
      ]);

      const dataJson = await dataRes.json();
      const statsJson = await statsRes.json();

      setData(dataJson.data || []);
      setStats(statsJson);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [fetchData, isAuthenticated]);

  // Fetch documentation when selected
  useEffect(() => {
    if (!selectedId) {
      setDokumentasi(null);
      return;
    }
    const fetchDok = async () => {
      setDokLoading(true);
      try {
        const res = await fetch(`/api/bsps/dokumentasi?id=${selectedId}`);
        const json = await res.json();
        setDokumentasi(json);
      } catch (error) {
        console.error('Failed to fetch dokumentasi:', error);
        setDokumentasi(null);
      } finally {
        setDokLoading(false);
      }
    };
    fetchDok();
  }, [selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setRouteTarget(null);
    setMobileDetailOpen(true);
  }, []);

  const handlePhotoClick = useCallback((photo: DokumentasiPhoto) => {
    setSelectedPhoto(photo);
    setPhotoDialogOpen(true);
  }, []);

  // Detect user location
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung oleh browser Anda');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
        setManualLat(position.coords.latitude.toString());
        setManualLng(position.coords.longitude.toString());
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Izin lokasi ditolak. Aktifkan GPS/lokasi di pengaturan browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Informasi lokasi tidak tersedia');
            break;
          case error.TIMEOUT:
            setLocationError('Waktu permintaan lokasi habis');
            break;
          default:
            setLocationError('Terjadi kesalahan saat mendeteksi lokasi');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const setManualLocation = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setUserLocation({ lat, lng });
      setLocationError(null);
    } else {
      setLocationError('Koordinat tidak valid. Lat: -90 s/d 90, Lng: -180 s/d 180');
    }
  }, [manualLat, manualLng]);

  const handleNavigate = useCallback((entry: BspsEntry) => {
    if (!userLocation) detectLocation();
    setRouteTarget(entry);
    setMobileDetailOpen(false);
  }, [userLocation, detectLocation]);

  const selectedEntry = data.find((d) => d.id === selectedId);

  const filteredData = data.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(q) ||
      (item.nik && item.nik.toLowerCase().includes(q)) ||
      (item.alamat && item.alamat.toLowerCase().includes(q))
    );
  });

  // ─── Auth gate ──────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasscodeScreen onAccess={() => setIsAuthenticated(true)} />;
  }

  // ─── Filter Buttons ──────────────────────────────────────────────

  const filterButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={activeFilter === null ? 'default' : 'outline'}
        size="sm"
        className="text-xs h-8"
        onClick={() => setActiveFilter(null)}
      >
        <Filter className="w-3 h-3 mr-1" />
        Semua
      </Button>
      {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
        <Button
          key={key}
          variant={activeFilter === key ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'text-xs h-8',
            activeFilter === key && config.bgColor,
            activeFilter === key && config.color,
            activeFilter === key && config.borderColor,
          )}
          onClick={() => setActiveFilter(activeFilter === key ? null : key)}
        >
          <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: MARKER_COLORS[key] }} />
          {config.label}
        </Button>
      ))}
    </div>
  );

  // ─── Stats Cards ─────────────────────────────────────────────────

  const statsCards = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {stats?.countByKategori &&
        Object.entries(KATEGORI_CONFIG).map(([key, config]) => {
          const count = stats.countByKategori[key] || 0;
          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md border',
                activeFilter === key ? `${config.bgColor} ${config.borderColor} shadow-md` : 'hover:border-gray-300',
              )}
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
            >
              <CardContent className="p-2.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className={cn('p-1.5 sm:p-2 rounded-lg', config.bgColor)}>
                    <div className={config.color}>{config.icon}</div>
                  </div>
                  <span className={cn('text-xl sm:text-3xl font-bold', config.color)}>{count}</span>
                </div>
                <p className={cn('text-[10px] sm:text-sm font-medium mt-1 sm:mt-2', config.color)}>{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  // ─── Legend Overlay ──────────────────────────────────────────────

  const legendOverlay = (
    <div className="absolute top-3 left-3 z-[1000]">
      {showLegend ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2.5 sm:p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-700">Legenda</p>
            <button
              type="button"
              onClick={() => setShowLegend(false)}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="Sembunyikan legenda"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm ring-1 ring-white/50" style={{ backgroundColor: MARKER_COLORS[key] }} />
                <span className="text-[10px] sm:text-xs text-gray-600">{config.label}</span>
              </div>
            ))}
            {userLocation && (
              <div className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-gray-200 mt-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 ring-2 ring-blue-200" />
                <span className="text-[10px] sm:text-xs text-gray-600">Lokasi Anda</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLegend(true)}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Tampilkan legenda"
        >
          <EyeOff className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );

  // ─── Location Panel Overlay ──────────────────────────────────────

  const locationPanel = (
    <div className="absolute bottom-16 left-3 z-[1000]">
      {showLocationPanel ? (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2.5 sm:p-3 border border-gray-100 max-w-[260px] sm:max-w-[280px]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              <span className="text-[10px] sm:text-xs font-semibold text-gray-700">Lokasi & Rute</span>
              {routeTarget && (
                <Badge className="text-[8px] sm:text-[9px] bg-blue-50 text-blue-700 border-blue-200" variant="outline">Rute aktif</Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowLocationPanel(false)}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="Sembunyikan panel lokasi"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>

      {userLocation ? (
        <div className="space-y-1.5">
          <div className="text-[10px] sm:text-xs text-gray-600">
            📍 {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </div>
          {routeTarget && (
            <div className="text-[10px] sm:text-xs text-blue-700 bg-blue-50 rounded-md px-2 py-1.5 border border-blue-100">
              🧭 Rute ke: <strong>{routeTarget.nama}</strong>
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${routeTarget.lat},${routeTarget.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-green-700 hover:text-green-800 font-semibold"
              >
                Buka Google Maps →
              </a>
            </div>
          )}
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="text-[9px] sm:text-[10px] h-6 sm:h-7 flex-1" onClick={() => { setUserLocation(null); setRouteTarget(null); setManualLat(''); setManualLng(''); }}>
              Hapus
            </Button>
            <Button variant="outline" size="sm" className="text-[9px] sm:text-[10px] h-6 sm:h-7 flex-1" onClick={detectLocation} disabled={locating}>
              {locating ? '...' : 'Refresh'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          <Button variant="default" size="sm" className="w-full text-[10px] sm:text-xs h-7 sm:h-8 bg-blue-600 hover:bg-blue-700" onClick={detectLocation} disabled={locating}>
            {locating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" /> : <LocateFixed className="w-3 h-3 mr-1" />}
            {locating ? 'Mendeteksi...' : 'Deteksi Lokasi Saya'}
          </Button>
          <div className="text-[9px] sm:text-[10px] text-gray-400 text-center">— atau masukkan manual —</div>
          <div className="flex gap-1.5">
            <Input placeholder="Lat" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="h-6 sm:h-7 text-[9px] sm:text-[10px] font-mono" />
            <Input placeholder="Lng" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="h-6 sm:h-7 text-[9px] sm:text-[10px] font-mono" />
          </div>
          <Button variant="outline" size="sm" className="w-full text-[9px] sm:text-[10px] h-6 sm:h-7" onClick={setManualLocation} disabled={!manualLat || !manualLng}>
            Set Lokasi Manual
          </Button>
        </div>
      )}

      {locationError && (
        <div className="text-[9px] sm:text-[10px] text-red-600 mt-1 bg-red-50 px-2 py-1 rounded border border-red-100">{locationError}</div>
      )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLocationPanel(true)}
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors",
            routeTarget && "ring-2 ring-blue-300"
          )}
          title="Tampilkan panel lokasi & rute"
        >
          <LocateFixed className="w-4 h-4 text-blue-600" />
        </button>
      )}
    </div>
  );

  // ─── Search Overlay ──────────────────────────────────────────────

  const searchOverlay = (
    <div className="absolute top-3 right-3 z-[1000]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
        <Input
          placeholder="Cari nama, NIK..."
          className="pl-8 sm:pl-9 w-40 sm:w-64 bg-white/95 backdrop-blur-sm shadow-lg border-0 text-xs sm:text-sm h-8 sm:h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );

  // ─── Map Markers ─────────────────────────────────────────────────

  const mapMarkers = filteredData.map((d) => ({
    id: d.id, lat: d.lat, lng: d.lng, nama: d.nama, kategori: d.kategori,
    nik: d.nik, kk: d.kk, alamat: d.alamat, keterangan: d.keterangan,
  }));

  // ─── Desktop Sidebar Content ─────────────────────────────────────

  const desktopSidebar = (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 pb-3">{filterButtons}</div>

      {selectedEntry && (
        <Card className={cn('border-2 shadow-md shrink-0 mb-3', KATEGORI_CONFIG[selectedEntry.kategori]?.borderColor, KATEGORI_CONFIG[selectedEntry.kategori]?.bgColor)}>
          <CardContent className="p-3">
            <DetailPanel
              entry={selectedEntry} dokumentasi={dokumentasi} dokLoading={dokLoading}
              onPhotoClick={handlePhotoClick} onNavigate={handleNavigate} userLocation={userLocation}
            />
          </CardContent>
        </Card>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden shadow-md min-h-0">
        <CardHeader className="p-3 pb-2 shrink-0">
          <CardTitle className="text-sm font-semibold">Daftar Penerima ({filteredData.length})</CardTitle>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Home className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Tidak ada data ditemukan</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <DataListItem key={item.id} item={item} isSelected={selectedId === item.id} onSelect={handleSelect} />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/favicon.svg" alt="BSPS" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shadow-md" />
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-gray-900">Dashboard BSPS</h1>
                <p className="text-[10px] sm:text-sm text-gray-500">Kecamatan Paseh · Desa Loa</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {userLocation && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs hidden sm:inline-flex">
                  <LocateFixed className="w-3 h-3 mr-1" /> Lokasi Aktif
                </Badge>
              )}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] sm:text-xs">
                <MapPin className="w-3 h-3 mr-1" /> {data.length}
              </Badge>
              {/* Mobile toggle button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setMobileView(mobileView === 'map' ? 'list' : 'map')}
              >
                {mobileView === 'map' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto w-full px-3 sm:px-6 pt-3 sm:pt-4 shrink-0">
        {statsCards}
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 flex-1 min-h-0" style={{ minHeight: '400px' }}>

          {/* ── Mobile: List View ── */}
          {mobileView === 'list' && (
            <div className="flex flex-col flex-1 min-h-0 lg:hidden">
              <div className="shrink-0 pb-2">{filterButtons}</div>
              <Card className="flex-1 flex flex-col overflow-hidden shadow-md min-h-0">
                <CardHeader className="p-3 pb-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Daftar Penerima ({filteredData.length})</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-50 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      ))
                    ) : filteredData.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Home className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Tidak ada data ditemukan</p>
                      </div>
                    ) : (
                      filteredData.map((item) => (
                        <DataListItem key={item.id} item={item} isSelected={selectedId === item.id} onSelect={handleSelect} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}

          {/* ── Map Container (Desktop: always visible, Mobile: only in map view) ── */}
          <div className={cn(
            'relative rounded-xl overflow-hidden shadow-lg border border-gray-200 shrink-0 lg:shrink lg:flex-1',
            mobileView === 'list' ? 'hidden lg:block' : 'block',
          )}
            style={{ height: mobileView === 'list' ? '55vh' : '55vh', minHeight: '280px' }}
          >
            {legendOverlay}
            {searchOverlay}
            {locationPanel}

            <MapComponent
              markers={mapMarkers}
              center={[-7.08, 107.79]}
              zoom={13}
              selectedId={selectedId}
              onSelect={handleSelect}
              userLocation={userLocation}
              routeTarget={routeTarget}
            />
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-[380px] shrink-0 min-h-0 flex-col">{desktopSidebar}</div>
        </div>
      </div>

      {/* ── Mobile Full-Screen Detail Dialog ── */}
      <Dialog open={mobileDetailOpen && !!selectedEntry} onOpenChange={(open) => { if (!open) setMobileDetailOpen(false); }}>
        <DialogContent className="lg:hidden sm:max-w-lg max-h-[92vh] p-0 overflow-hidden">
          <DialogHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <button type="button" onClick={() => setMobileDetailOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              Detail Penerima
            </DialogTitle>
            <button type="button" onClick={() => setMobileDetailOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-4">
              {selectedEntry && (
                <DetailPanel
                  entry={selectedEntry} dokumentasi={dokumentasi} dokLoading={dokLoading}
                  onPhotoClick={handlePhotoClick} onNavigate={handleNavigate} userLocation={userLocation}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black border-gray-800">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
            <DialogTitle className="text-white text-sm">
              {selectedPhoto?.label}{selectedEntry ? ` - ${selectedEntry.nama}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto?.url && (
            <div className="relative w-full aspect-[4/3] bg-gray-900 flex items-center justify-center">
              <img src={selectedPhoto.url} alt={`${selectedPhoto.label} - ${selectedEntry?.nama || ''}`} className="w-full h-full object-contain" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setPhotoDialogOpen(false)}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t py-2.5 sm:py-3 shrink-0">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <p className="text-[10px] sm:text-xs text-center text-gray-400">
            Dashboard Pemetaan BSPS · Kecamatan Paseh · Desa Loa · Kabupaten Bandung · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
