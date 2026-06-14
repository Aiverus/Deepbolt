import { useState, useRef, useEffect } from 'react';
import { Pin } from '../types';
import { usePins } from '../hooks/usePins';
import { Search, X, MapPin } from 'lucide-react';

interface SearchBarProps {
  onResultClick: (pin: Pin) => void;
}

export default function SearchBar({ onResultClick }: SearchBarProps) {
  const { searchPins } = usePins();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Pin[]>([]);
  const [show, setShow] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setShow(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const pins = await searchPins(value);
      setResults(pins);
      setShow(true);
      setSearching(false);
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShow(true)}
          placeholder="Search pins..."
          className="w-full bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setShow(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {searching && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {show && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-[1001]">
          <div className="py-1 max-h-64 overflow-y-auto">
            {results.map(pin => (
              <button
                key={pin.id}
                onClick={() => { onResultClick(pin); setShow(false); }}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-800 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pin.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{pin.title}</p>
                  <p className="text-xs text-slate-500 truncate">{pin.body || 'No notes'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {show && query.trim() && results.length === 0 && !searching && (
        <div className="absolute top-full mt-2 w-full bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl p-4 text-center text-sm text-slate-500 z-[1001]">
          No pins found
        </div>
      )}
    </div>
  );
}
