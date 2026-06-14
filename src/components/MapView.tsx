import { useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { Pin } from '../types';
import { useAuth } from '../hooks/useAuth';

interface MapViewProps {
  pins: Pin[];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (pin: Pin) => void;
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

function createCustomIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="16" cy="15" r="6" fill="white" opacity="0.9"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: 'custom-pin-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

function MapEventHandler({ onMapClick, onBoundsChange }: { onMapClick: (lat: number, lng: number) => void; onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });
  return null;
}

function LocateButton() {
  const map = useMap();

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      () => {},
    );
  }, [map]);

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-6 right-4 z-[1000] bg-white hover:bg-slate-50 text-slate-700 p-3 rounded-xl shadow-lg border border-slate-200 transition-all duration-200 hover:shadow-xl"
      title="My Location"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    </button>
  );
}

const PIN_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316',
];

export default function MapView({ pins, onMapClick, onPinClick, onBoundsChange }: MapViewProps) {
  const { user } = useAuth();

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={12}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onMapClick={onMapClick} onBoundsChange={onBoundsChange} />

        {pins.map(pin => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={createCustomIcon(pin.color || PIN_COLORS[0])}
          >
            <Popup maxWidth={280} minWidth={200} className="pin-popup">
              <div className="py-1">
                <h3 className="font-semibold text-slate-900 text-base mb-1">{pin.title}</h3>
                {pin.body && (
                  <p className="text-slate-600 text-sm line-clamp-3 mb-2">{pin.body}</p>
                )}
                {pin.images && pin.images.length > 0 && (
                  <div className="flex gap-1 mb-2 overflow-x-auto">
                    {pin.images.slice(0, 3).map(img => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ))}
                    {pin.images.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                        +{pin.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => onPinClick(pin)}
                  className="w-full text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors py-1"
                >
                  {pin.user_id === user?.id ? 'Edit Pin' : 'View Details'}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <LocateButton />
      </MapContainer>
    </div>
  );
}
