import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building2,
  PackageCheck
} from 'lucide-react';
import { CityOption, VideoItem } from '../types';

interface InteractiveMapViewProps {
  cities: CityOption[];
  selectedCityId?: string;
  onSelectCity: (cityId: string) => void;
  onNavigateTab: (tab: any) => void;
  products?: VideoItem[];
}


export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  cities,
  selectedCityId,
  onSelectCity,
  onNavigateTab,
  products = []
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [cityId: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeCityId, setActiveCityId] = useState<string>(selectedCityId || cities[0]?.id || 'casa');
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [closestCity, setClosestCity] = useState<CityOption | null>(null);

  const activeCity = cities.find(c => c.id === activeCityId) || cities[0];

  // Helper to calculate distance between two coordinates in km (Haversine)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center Morocco: [31.7917, -7.0926], zoom 6
    const initialLat = activeCity?.lat || 33.5731;
    const initialLng = activeCity?.lng || -7.5898;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 6.5,
      minZoom: 5,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Dark luxury CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Render City Markers
    cities.forEach((city) => {
      const isSelected = city.id === activeCityId;
      
      const customIcon = L.divIcon({
        className: 'custom-city-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-2 bg-purple-600/30 rounded-full animate-ping opacity-75"></div>
            <div class="relative w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 ${
              isSelected 
                ? 'bg-gradient-to-tr from-purple-700 to-indigo-500 text-white border-2 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.8)]' 
                : 'bg-[#150D27] text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
            }">
              <span class="text-xs font-black tracking-wider">${city.name.substring(0, 3).toUpperCase()}</span>
            </div>
            <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-[#0A0614]/90 backdrop-blur-md border border-purple-500/30 text-[10px] font-bold text-white whitespace-nowrap shadow-md pointer-events-none">
              ${city.name}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([city.lat, city.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setActiveCityId(city.id);
        map.flyTo([city.lat, city.lng], 11, { duration: 1.2 });
      });

      markersRef.current[city.id] = marker;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker icons when activeCityId changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    cities.forEach((city) => {
      const marker = markersRef.current[city.id];
      if (!marker) return;

      const isSelected = city.id === activeCityId;
      const customIcon = L.divIcon({
        className: 'custom-city-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            ${isSelected ? '<div class="absolute -inset-2.5 bg-purple-600/40 rounded-full animate-ping opacity-90"></div>' : ''}
            <div class="relative w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 ${
              isSelected 
                ? 'bg-gradient-to-tr from-purple-700 to-indigo-500 text-white border-2 border-purple-300 shadow-[0_0_22px_rgba(168,85,247,0.85)] scale-110' 
                : 'bg-[#150D27] text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
            }">
              <span class="text-xs font-black tracking-wider">${city.name.substring(0, 3).toUpperCase()}</span>
            </div>
            <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-[#0A0614]/90 backdrop-blur-md border border-purple-500/30 text-[10px] font-bold text-white whitespace-nowrap shadow-md pointer-events-none">
              ${city.name}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      marker.setIcon(customIcon);
    });
  }, [activeCityId, cities]);

  // Pan to selected city
  const handleSelectCityCard = (city: CityOption) => {
    setActiveCityId(city.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 12, { duration: 1.2 });
    }
  };

  // Geolocate user position
  const handleLocateMe = () => {
    setLocating(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          // Remove previous user marker if any
          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          // User pulsing marker
          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute -inset-3 bg-emerald-500/30 rounded-full animate-ping"></div>
                <div class="relative w-7 h-7 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center border-2 border-white shadow-[0_0_18px_rgba(16,185,129,0.9)]">
                  <span class="w-2.5 h-2.5 rounded-full bg-black"></span>
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<div class="text-xs font-bold text-zinc-900 p-1">📍 Votre position actuelle</div>`)
            .openPopup();

          userMarkerRef.current = userMarker;

          // Find closest city hub
          let minDistance = Infinity;
          let nearest: CityOption | null = null;
          cities.forEach((city) => {
            const dist = getDistanceKm(latitude, longitude, city.lat, city.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = city;
            }
          });

          if (nearest) {
            setClosestCity(nearest);
            setActiveCityId((nearest as CityOption).id);
            // Fit bounds to include both user and nearest hub
            const bounds = L.latLngBounds(
              [latitude, longitude],
              [(nearest as CityOption).lat, (nearest as CityOption).lng]
            );
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          } else {
            mapInstanceRef.current.flyTo([latitude, longitude], 13);
          }
        }
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Autorisation refusée pour la localisation.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Position indisponible.");
            break;
          case error.TIMEOUT:
            setGeoError("Délai de localisation dépassé.");
            break;
          default:
            setGeoError("Erreur lors de la localisation.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Filter cities by search query
  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hubName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Header bar with title & stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#140B26] via-[#100820] to-[#0D0618] p-4 rounded-2xl border border-purple-900/40 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <MapPin className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
              Réseau & Emplacements
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Direct Maroc
              </span>
            </h2>
            <p className="text-xs text-purple-300/70">
              {cities.length} Hubs officiels THE HASHMAN SHOP actifs
            </p>
          </div>
        </div>

        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Recherche GPS...' : 'Ma position GPS'}</span>
        </button>
      </div>

      {geoError && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {closestCity && userCoords && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Hub le plus proche détecté : <strong className="text-white font-black">{closestCity.name}</strong> ({getDistanceKm(userCoords.lat, userCoords.lng, closestCity.lat, closestCity.lng)} km)
            </span>
          </div>
          <button 
            onClick={() => handleSelectCityCard(closestCity)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-extrabold text-[11px] hover:bg-emerald-400 transition-colors"
          >
            Sélectionner
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une ville (Casablanca, Rabat, Marrakech, Tanger...)"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0D071B] border border-purple-900/50 text-white placeholder-purple-400/40 text-xs focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Quick City Horizontal Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {filteredCities.map((city) => {
          const isSelected = city.id === activeCityId;
          return (
            <button
              key={city.id}
              onClick={() => handleSelectCityCard(city)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : 'bg-[#120A22] text-purple-300 hover:text-white border-purple-900/40 hover:border-purple-700/60'
              }`}
            >
              <span>📍 {city.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-purple-800 text-white' : 'bg-purple-950/60 text-purple-400'}`}>
                {city.deliveryTime || '24-48h'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-[360px] sm:h-[440px] rounded-3xl overflow-hidden border border-purple-800/40 shadow-2xl bg-[#070310]">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Subtle overlay gradient vignette */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_40px_rgba(7,3,16,0.8)] border border-purple-500/20" />

        {/* Floating badge top-left */}
        <div className="absolute top-3 left-3 pointer-events-none z-[1000] flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0B0616]/85 backdrop-blur-md border border-purple-500/30 shadow-lg text-[11px] font-bold text-purple-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Réseau Express Actif</span>
        </div>
      </div>

      {/* Selected City Detailed Info Card */}
      {activeCity && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#130A24] via-[#0E061B] to-[#090312] border border-purple-800/50 shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">📍</span>
                <h3 className="text-xl font-black text-white tracking-wide uppercase">
                  {activeCity.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Actif
                </span>
              </div>
              <p className="text-xs text-purple-300/80 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                {activeCity.hubName || `Hub Central ${activeCity.name}`}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-purple-400/80 font-bold block">
                Délai estimé
              </span>
              <span className="text-xs font-black text-purple-200 flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {activeCity.deliveryTime || '24h - 48h'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#170D2D]/60 border border-purple-900/40">
              <span className="text-[10px] uppercase font-bold text-purple-400/80 flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-purple-400" /> Stock Live
              </span>
              <p className="text-sm font-black text-white mt-0.5">
                {products.length} références
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#170D2D]/60 border border-purple-900/40">
              <span className="text-[10px] uppercase font-bold text-purple-400/80 flex items-center gap-1">
                <Truck className="w-3 h-3 text-purple-400" /> Expédition
              </span>
              <p className="text-sm font-black text-white mt-0.5">
                Discrète & Sécurisée
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-[#170D2D]/60 border border-purple-900/40">
              <span className="text-[10px] uppercase font-bold text-purple-400/80 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" /> Qualité
              </span>
              <p className="text-sm font-black text-purple-200 mt-0.5">
                100% Vérifié Hashman
              </p>
            </div>
          </div>

          {activeCity.address && (
            <p className="text-[11px] text-zinc-400 italic">
              Zone couverte : {activeCity.address} et agglomérations voisines.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <button
              onClick={() => {
                onSelectCity(activeCity.id);
                onNavigateTab('catalog');
              }}
              className="w-full flex-1 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] active:scale-[0.98]"
            >
              <span>Commander pour {activeCity.name}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedCityId === activeCity.id ? (
              <span className="px-4 py-3 rounded-2xl bg-purple-950/60 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ville active
              </span>
            ) : (
              <button
                onClick={() => onSelectCity(activeCity.id)}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#1A0E34] hover:bg-[#25154A] text-purple-200 border border-purple-700/50 text-xs font-bold transition-colors"
              >
                Définir par défaut
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
