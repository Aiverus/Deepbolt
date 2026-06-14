import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { usePins } from './hooks/usePins';
import AuthScreen from './components/AuthScreen';
import MapView from './components/MapView';
import PinFormModal from './components/PinFormModal';
import PinDetailPanel from './components/PinDetailPanel';
import SearchBar from './components/SearchBar';
import { Pin, Bounds } from './types';
import { MapPin, LogOut, Plus } from 'lucide-react';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const { pins, loading: pinsLoading, fetchPinsInBounds } = usePins();

  const [showPinForm, setShowPinForm] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [initialBounds, setInitialBounds] = useState<Bounds | null>(null);

  const handleBoundsChange = useCallback((bounds: Bounds) => {
    if (!initialBounds) setInitialBounds(bounds);

    const latMargin = (bounds.north - bounds.south) * 0.2;
    const lngMargin = (bounds.east - bounds.west) * 0.2;

    fetchPinsInBounds({
      north: bounds.north + latMargin,
      south: bounds.south - latMargin,
      east: bounds.east + lngMargin,
      west: bounds.west - lngMargin,
    });
  }, [fetchPinsInBounds, initialBounds]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!user) return;
    setNewPinLocation({ lat, lng });
    setEditingPin(null);
    setShowPinForm(true);
  }, [user]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
  }, []);

  const handleSearchResultClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
  }, []);

  const handleEditPin = useCallback((pin: Pin) => {
    setSelectedPin(null);
    setEditingPin(pin);
    setNewPinLocation({ lat: pin.latitude, lng: pin.longitude });
    setShowPinForm(true);
  }, []);

  const handlePinSaved = useCallback(() => {
    setShowPinForm(false);
    setEditingPin(null);
    setNewPinLocation(null);
    if (initialBounds) {
      fetchPinsInBounds(initialBounds);
    }
  }, [initialBounds, fetchPinsInBounds]);

  const handlePinDeleted = useCallback(() => {
    setSelectedPin(null);
    if (initialBounds) {
      fetchPinsInBounds(initialBounds);
    }
  }, [initialBounds, fetchPinsInBounds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const currentSelectedPin = selectedPin
    ? pins.find(p => p.id === selectedPin.id) || selectedPin
    : null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 relative">
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-4 py-2.5 shadow-lg">
            <MapPin className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-white hidden sm:inline">PinPoint</span>
          </div>

          <div className="flex-1">
            <SearchBar onResultClick={handleSearchResultClick} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewPinLocation(null);
                setEditingPin(null);
                setShowPinForm(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Pin</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
              <span className="text-xs text-slate-400 max-w-[120px] truncate">{user.email}</span>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {pins.length > 0 && (
        <div className="absolute bottom-6 left-4 z-[1000] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-3 py-2 shadow-lg">
          <span className="text-xs text-slate-400">
            {pinsLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span>{pins.length} pin{pins.length !== 1 ? 's' : ''} in view</span>
            )}
          </span>
        </div>
      )}

      <MapView
        pins={pins}
        onMapClick={handleMapClick}
        onPinClick={handlePinClick}
        onBoundsChange={handleBoundsChange}
      />

      {showPinForm && (
        <PinFormModal
          pin={editingPin}
          latitude={newPinLocation?.lat ?? 0}
          longitude={newPinLocation?.lng ?? 0}
          onClose={() => { setShowPinForm(false); setEditingPin(null); setNewPinLocation(null); }}
          onSaved={handlePinSaved}
        />
      )}

      {currentSelectedPin && (
        <PinDetailPanel
          pin={currentSelectedPin}
          onClose={() => setSelectedPin(null)}
          onEdit={handleEditPin}
          onDeleted={handlePinDeleted}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
