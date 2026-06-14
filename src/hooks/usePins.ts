import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Pin, Image, Bounds } from '../types';

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPinsInBounds = useCallback(async (bounds: Bounds) => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pins')
        .select('*, images(*)')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPins(data as Pin[]);
      }
      setLoading(false);
    }, 300);
  }, []);

  const searchPins = useCallback(async (query: string) => {
    if (!query.trim()) {
      return [];
    }
    const { data, error } = await supabase
      .from('pins')
      .select('*, images(*)')
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data as Pin[];
    }
    return [];
  }, []);

  const createPin = useCallback(async (pin: Omit<Pin, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'images'>) => {
    const { data, error } = await supabase
      .from('pins')
      .insert(pin)
      .select('*, images(*)')
      .maybeSingle();

    if (error) throw error;
    if (data) {
      setPins(prev => [data as Pin, ...prev]);
      return data as Pin;
    }
    return null;
  }, []);

  const updatePin = useCallback(async (id: string, updates: Partial<Pick<Pin, 'title' | 'body' | 'color' | 'latitude' | 'longitude'>>) => {
    const { data, error } = await supabase
      .from('pins')
      .update(updates)
      .eq('id', id)
      .select('*, images(*)')
      .maybeSingle();

    if (error) throw error;
    if (data) {
      setPins(prev => prev.map(p => p.id === id ? (data as Pin) : p));
      return data as Pin;
    }
    return null;
  }, []);

  const deletePin = useCallback(async (id: string) => {
    const { data: images } = await supabase
      .from('images')
      .select('storage_path')
      .eq('pin_id', id);

    if (images && images.length > 0) {
      const paths = images.map(img => img.storage_path);
      await supabase.storage.from('pin-images').remove(paths);
    }

    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setPins(prev => prev.filter(p => p.id !== id));
  }, []);

  const uploadImage = useCallback(async (pinId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${pinId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('pin-images')
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('pin-images')
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from('images')
      .insert({ pin_id: pinId, storage_path: path, url: publicUrl })
      .select()
      .maybeSingle();

    if (error) throw error;

    if (data) {
      setPins(prev => prev.map(p =>
        p.id === pinId
          ? { ...p, images: [...(p.images || []), data as Image] }
          : p
      ));
      return data as Image;
    }
    return null;
  }, []);

  const deleteImage = useCallback(async (imageId: string, storagePath: string, pinId: string) => {
    await supabase.storage.from('pin-images').remove([storagePath]);

    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;

    setPins(prev => prev.map(p =>
      p.id === pinId
        ? { ...p, images: (p.images || []).filter(img => img.id !== imageId) }
        : p
    ));
  }, []);

  return {
    pins,
    loading,
    fetchPinsInBounds,
    searchPins,
    createPin,
    updatePin,
    deletePin,
    uploadImage,
    deleteImage,
  };
}
