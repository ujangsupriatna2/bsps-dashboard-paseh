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
  MapPin, Users, Home, AlertTriangle, Search, Filter, 
  ChevronRight, ChevronDown, LayoutDashboard, List,
  CheckCircle2, Clock, XCircle, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/30 flex items-center justify-center rounded-xl">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    </div>
  ),
});

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
}

const KATEGORI_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
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

export default function DashboardPage() {
  const [data, setData] = useState<BspsEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setExpandedItem(id);
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
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
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                <Users className="w-3 h-3 mr-1" />
                {stats?.total || 37} Total
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats?.countByKategori && Object.entries(KATEGORI_CONFIG).map(([key, config]) => {
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
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-240px)] min-h-[500px]">
          {/* Map */}
          <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
            {/* Legend */}
            <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
              <div className="space-y-1.5">
                {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: MARKER_COLORS[key] }}
                    />
                    <span className="text-xs text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search on map */}
            <div className="absolute top-3 right-3 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, NIK..."
                  className="pl-9 w-56 sm:w-64 bg-white/95 backdrop-blur-sm shadow-lg border-0 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <MapComponent
              markers={filteredData.map((d) => ({
                id: d.id,
                lat: d.lat,
                lng: d.lng,
                nama: d.nama,
                kategori: d.kategori,
                nik: d.nik,
                kk: d.kk,
                alamat: d.alamat,
                keterangan: d.keterangan,
              }))}
              center={[-7.08, 107.79]}
              zoom={13}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-[380px] flex flex-col gap-3">
            {/* Filter Bar */}
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
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 lg:hidden"
                  onClick={() => setShowList(!showList)}
                >
                  {showList ? <LayoutDashboard className="w-3 h-3 mr-1" /> : <List className="w-3 h-3 mr-1" />}
                  {showList ? 'Peta' : 'Daftar'}
                </Button>
              </div>
            </div>

            {/* Selected Entry Detail */}
            {selectedEntry && (
              <Card className={cn(
                'border-2 shadow-md',
                KATEGORI_CONFIG[selectedEntry.kategori]?.borderColor,
                KATEGORI_CONFIG[selectedEntry.kategori]?.bgColor,
              )}>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      {selectedEntry.nama}
                    </CardTitle>
                    <Badge
                      className={cn(
                        'text-[10px]',
                        KATEGORI_CONFIG[selectedEntry.kategori]?.bgColor,
                        KATEGORI_CONFIG[selectedEntry.kategori]?.color,
                        KATEGORI_CONFIG[selectedEntry.kategori]?.borderColor,
                      )}
                      variant="outline"
                    >
                      {KATEGORI_CONFIG[selectedEntry.kategori]?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 text-sm">
                  {selectedEntry.nik && selectedEntry.nik !== '-' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">NIK</span>
                      <span className="font-mono text-xs">{selectedEntry.nik}</span>
                    </div>
                  )}
                  {selectedEntry.kk && selectedEntry.kk !== '-' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">KK</span>
                      <span className="font-mono text-xs">{selectedEntry.kk}</span>
                    </div>
                  )}
                  {selectedEntry.alamat && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alamat</span>
                      <span className="text-xs text-right max-w-[200px]">{selectedEntry.alamat}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Koordinat</span>
                    <span className="font-mono text-xs">
                      {selectedEntry.lat.toFixed(6)}, {selectedEntry.lng.toFixed(6)}
                    </span>
                  </div>
                  {selectedEntry.keterangan && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Keterangan</span>
                      <span className="text-xs">{selectedEntry.keterangan}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Data List */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-md">
              <CardHeader className="p-3 pb-2">
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
                    filteredData.map((item) => {
                      const config = KATEGORI_CONFIG[item.kategori];
                      const isExpanded = expandedItem === item.id;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'p-3 rounded-lg cursor-pointer transition-all duration-150',
                            'hover:bg-gray-50 border border-transparent',
                            selectedId === item.id
                              ? `${config?.bgColor} ${config?.borderColor} border`
                              : '',
                          )}
                          onClick={() => {
                            handleSelect(item.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
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
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                              {item.nik && item.nik !== '-' && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">NIK</span>
                                  <span className="font-mono">{item.nik}</span>
                                </div>
                              )}
                              {item.kk && item.kk !== '-' && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">KK</span>
                                  <span className="font-mono">{item.kk}</span>
                                </div>
                              )}
                              {item.alamat && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Alamat</span>
                                  <span className="text-right max-w-[180px]">{item.alamat}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-400">Koordinat</span>
                                <span className="font-mono text-[10px]">
                                  {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                                </span>
                              </div>
                              {item.keterangan && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Ket</span>
                                  <span>{item.keterangan}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t py-3">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <p className="text-xs text-center text-gray-400">
            Dashboard Pemetaan BSPS · Kecamatan Paseh · Desa Loa · Kabupaten Bandung · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
