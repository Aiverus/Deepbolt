import { Pin } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePins } from '../hooks/usePins';
import { X, MapPin, Clock, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PinDetailPanelProps {
  pin: Pin;
  onClose: () => void;
  onEdit: (pin: Pin) => void;
  onDeleted: () => void;
}

export default function PinDetailPanel({ pin, onClose, onEdit, onDeleted }: PinDetailPanelProps) {
  const { user } = useAuth();
  const { deletePin } = usePins();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const isOwner = pin.user_id === user?.id;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deletePin(pin.id);
      onDeleted();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl shadow-black/40 z-[1500] flex flex-col"
      style={{ animation: 'slideLeft 0.25s ease-out' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: pin.color }} />
          <span className="text-sm text-slate-400">Pin Details</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {pin.images && pin.images.length > 0 && (
        <div className="relative aspect-video bg-slate-800">
          <img
            src={pin.images[imageIndex]?.url}
            alt=""
            className="w-full h-full object-cover"
          />
          {pin.images.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex(i => (i - 1 + pin.images!.length) % pin.images!.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setImageIndex(i => (i + 1) % pin.images!.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {pin.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === imageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{pin.title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3 h-3" />
            <span>{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</span>
          </div>
        </div>

        {pin.body && (
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{pin.body}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Created {formatDate(pin.created_at)}</span>
        </div>

        {pin.updated_at !== pin.created_at && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Updated {formatDate(pin.updated_at)}</span>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => onEdit(pin)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-teal-400 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit Pin
          </button>

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Pin
            </button>
          )}
        </div>
      )}
    </div>
  );
}
