import { useState, useRef, useEffect } from 'react';
import { Pin, Image } from '../types';
import { usePins } from '../hooks/usePins';
import { X, MapPin, Upload, Trash2, Save, Loader2 } from 'lucide-react';

const PIN_COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Orange', hex: '#f97316' },
];

interface PinFormModalProps {
  pin?: Pin | null;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function PinFormModal({ pin, latitude, longitude, onClose, onSaved }: PinFormModalProps) {
  const { createPin, updatePin, uploadImage, deleteImage } = usePins();
  const [title, setTitle] = useState(pin?.title || '');
  const [body, setBody] = useState(pin?.body || '');
  const [color, setColor] = useState(pin?.color || '#3b82f6');
  const [images, setImages] = useState<Image[]>(pin?.images || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!pin;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      if (isEditing && pin) {
        await updatePin(pin.id, { title: title.trim(), body: body.trim(), color });
      } else {
        await createPin({
          latitude,
          longitude,
          title: title.trim(),
          body: body.trim(),
          color,
        });
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save pin:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const targetPinId = pin?.id;
    if (!targetPinId) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (images.length >= 5) break;
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const result = await uploadImage(targetPinId, file);
        if (result) {
          setImages(prev => [...prev, result]);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async (image: Image) => {
    if (!pin) return;
    try {
      await deleteImage(image.id, image.storage_path, pin.id);
      setImages(prev => prev.filter(img => img.id !== image.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: color + '20', color }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit Pin' : 'New Pin'}
              </h2>
              <p className="text-xs text-slate-500">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Pin Color</label>
            <div className="flex gap-2 flex-wrap">
              {PIN_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c.hex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give this pin a name..."
              maxLength={200}
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Add your notes about this location..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none"
            />
          </div>

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Images ({images.length}/5)
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group aspect-square">
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handleImageDelete(img)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 5 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={e => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl py-4 flex flex-col items-center gap-1.5 text-slate-500 hover:text-teal-400 transition-all duration-200"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    <span className="text-xs">{uploading ? 'Uploading...' : 'Click to upload images'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Update' : 'Create Pin'}
              </>
            )}
          </button>
        </div>

        {!isEditing && (
          <p className="text-xs text-slate-600 px-5 pb-4">
            After creating, you can add images by editing the pin.
          </p>
        )}
      </div>
    </div>
  );
}
