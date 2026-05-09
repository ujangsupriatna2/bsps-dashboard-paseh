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
  ChevronRight, ChevronDown, Building2,
  CheckCircle2, Clock, XCircle, Camera, X, ImageOff,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
  compact = false,
}: {
  entry: BspsEntry;
  dokumentasi: DokumentasiData | null;
  dokLoading: boolean;
  onPhotoClick: (photo: DokumentasiPhoto) => void;
  compact?: boolean;
}) {
  const config = KATEGORI_CONFIG[entry.kategori];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cn('font-bold text-gray-900 truncate', compact ? 'text-sm' : 'text-base')}>
            {entry.nama}
          </h3>
          {entry.keterangan && (
            <p className="text-xs text-gray-500 mt-0.5">{entry.keterangan}</p>
          )}
        </div>
        <Badge
          className={cn(
            'text-[10px] shrink-0',
            config?.bgColor,
            config?.color,
            config?.borderColor,
          )}
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
  isExpanded,
  onSelect,
}: {
  item: BspsEntry;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
}) {
  const config = KATEGORI_CONFIG[item.kategori];
  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all duration-150',
        'hover:bg-gray-50 border border-transparent',
        isSelected
          ? `${config?.bgColor} ${config?.borderColor} border`
          : '',
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
            <p className="text-sm font-semibold text-gray-900 truncate">
              {item.nama}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {item.alamat || `${item.desa}, ${item.kecamatan}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge
            className={cn(
              'text-[9px] px-1.5 py-0',
              config?.bgColor,
              config?.color,
              config?.borderColor,
            )}
            variant="outline"
          >
            {config?.label}
          </Badge>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
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

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
    fetchData();
  }, [fetchData]);

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
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleMobileSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileDrawerOpen(true);
  }, []);

  const handlePhotoClick = useCallback((photo: DokumentasiPhoto) => {
    setSelectedPhoto(photo);
    setPhotoDialogOpen(true);
  }, []);

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

  // ─── Filter Buttons ──────────────────────────────────────────────────

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
          <div
            className="w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: MARKER_COLORS[key] }}
          />
          {config.label}
        </Button>
      ))}
    </div>
  );

  // ─── Stats Cards ─────────────────────────────────────────────────────

  const statsCards = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats?.countByKategori &&
        Object.entries(KATEGORI_CONFIG).map(([key, config]) => {
          const count = stats.countByKategori[key] || 0;
          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md border',
                activeFilter === key
                  ? `${config.bgColor} ${config.borderColor} shadow-md`
                  : 'hover:border-gray-300',
              )}
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <div className={config.color}>{config.icon}</div>
                  </div>
                  <span className={cn('text-2xl sm:text-3xl font-bold', config.color)}>
                    {count}
                  </span>
                </div>
                <p className={cn('text-xs sm:text-sm font-medium mt-2', config.color)}>
                  {config.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  // ─── Legend Overlay ──────────────────────────────────────────────────

  const legendOverlay = (
    <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-100">
      <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
      <div className="space-y-1.5">
        {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/50"
              style={{ backgroundColor: MARKER_COLORS[key] }}
            />
            <span className="text-xs text-gray-600">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Search Overlay ──────────────────────────────────────────────────

  const searchOverlay = (
    <div className="absolute top-3 right-3 z-[1000]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari nama, NIK..."
          className="pl-9 w-48 sm:w-64 bg-white/95 backdrop-blur-sm shadow-lg border-0 text-sm h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );

  // ─── Map Markers ─────────────────────────────────────────────────────

  const mapMarkers = filteredData.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    nama: d.nama,
    kategori: d.kategori,
    nik: d.nik,
    kk: d.kk,
    alamat: d.alamat,
    keterangan: d.keterangan,
  }));

  // ─── Desktop Sidebar Content ─────────────────────────────────────────

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter Buttons */}
      <div className="shrink-0 pb-3">{filterButtons}</div>

      {/* Detail Panel */}
      {selectedEntry && (
        <Card
          className={cn(
            'border-2 shadow-md shrink-0 mb-3',
            KATEGORI_CONFIG[selectedEntry.kategori]?.borderColor,
            KATEGORI_CONFIG[selectedEntry.kategori]?.bgColor,
          )}
        >
          <CardContent className="p-3">
            <DetailPanel
              entry={selectedEntry}
              dokumentasi={dokumentasi}
              dokLoading={dokLoading}
              onPhotoClick={handlePhotoClick}
            />
          </CardContent>
        </Card>
      )}

      {/* Data List */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-md min-h-0">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Daftar Penerima ({filteredData.length})
            </CardTitle>
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
                <DataListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  isExpanded={selectedId === item.id}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Dashboard Pemetaan BSPS
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Kecamatan Paseh · Desa Loa
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {data.length} Titik
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                <Users className="w-3 h-3 mr-1" />
                {stats?.total || 37} Total
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pt-4 shrink-0">
        {statsCards}
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0" style={{ minHeight: '480px' }}>
          {/* Map Container - responsive */}
          <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 shrink-0 lg:shrink lg:flex-1"
            style={{ height: '55vh', minHeight: '280px' }}
          >
            {legendOverlay}
            {searchOverlay}

            {/* Mobile list toggle button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-5 py-2.5 flex items-center gap-2 border border-gray-100 hover:shadow-xl transition-shadow active:scale-95"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-gray-700">
                {filteredData.length} Penerima
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
            </button>

            <MapComponent
              markers={mapMarkers}
              center={[-7.08, 107.79]}
              zoom={13}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>

          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden lg:flex w-[380px] shrink-0 min-h-0 flex-col">{sidebarContent}</div>
        </div>
      </div>

      {/* Mobile Bottom Drawer */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Daftar Penerima BSPS
              </span>
              <Badge variant="outline" className="text-xs">
                {filteredData.length} data
              </Badge>
            </DrawerTitle>
          </DrawerHeader>

          {/* Mobile Filters */}
          <div className="px-4 pb-2 overflow-x-auto">
            {filterButtons}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {/* Mobile Detail Panel */}
            {selectedEntry && (
              <div className="px-4 pb-3">
                <Card
                  className={cn(
                    'border-2 shadow-md',
                    KATEGORI_CONFIG[selectedEntry.kategori]?.borderColor,
                    KATEGORI_CONFIG[selectedEntry.kategori]?.bgColor,
                  )}
                >
                  <CardContent className="p-3">
                    <DetailPanel
                      entry={selectedEntry}
                      dokumentasi={dokumentasi}
                      dokLoading={dokLoading}
                      onPhotoClick={handlePhotoClick}
                      compact
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mobile Data List */}
            <ScrollArea className="max-h-[40vh]">
              <div className="px-4 pb-4 space-y-1">
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
                    <DataListItem
                      key={item.id}
                      item={item}
                      isSelected={selectedId === item.id}
                      isExpanded={selectedId === item.id}
                      onSelect={(id) => {
                        handleSelect(id);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>

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
              <img
                src={selectedPhoto.url}
                alt={`${selectedPhoto.label} - ${selectedEntry?.nama || ''}`}
                className="w-full h-full object-contain"
              />
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
      <footer className="mt-auto bg-white border-t py-3 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <p className="text-xs text-center text-gray-400">
            Dashboard Pemetaan BSPS · Kecamatan Paseh · Desa Loa · Kabupaten Bandung · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
