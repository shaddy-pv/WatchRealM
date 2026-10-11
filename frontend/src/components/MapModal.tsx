import React from 'react';
import { sounds } from '../audio/soundManager';
import { X, Navigation, Compass, Radio, Users, Sparkles } from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFastTravel: (destination: string) => void;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, onFastTravel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl rounded-2xl bg-gradient-to-b from-[#131722] to-[#0a0d14] border border-white/10 shadow-2xl p-6 overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">WatchRealm Astral Map</h2>
              <p className="text-xs text-white/50">Select any living district to fast-travel instantly</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Diagram Grid */}
        <div className="relative my-6 aspect-[16/9] w-full rounded-xl bg-[#080a10] border border-white/10 overflow-hidden flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 flex flex-col items-center text-[10px] text-white/30 font-mono">
            <span>N</span>
            <div className="w-4 h-4 border border-white/20 rounded-full flex items-center justify-center my-0.5">
              <div className="w-1 h-1 bg-purple-400 rounded-full" />
            </div>
            <span>S</span>
          </div>

          {/* North: Fantasy Realm */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="group relative p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 hover:border-amber-400 transition-all text-center cursor-pointer shadow-lg w-56">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Fantasy Realm
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">LIVE</span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">The Fellowship Watch Party</p>
              <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-white/10 pt-1.5 mb-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 24 watching</span>
                <span>Host: Shadan</span>
              </div>
              <button
                onClick={() => {
                  sounds.playEnterPortal();
                  onFastTravel('fantasy');
                }}
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                Fast Travel
              </button>
            </div>
          </div>

          {/* Center: Central WatchRealm Plaza */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative p-3 rounded-full bg-purple-950/60 border-2 border-purple-500 shadow-xl shadow-purple-500/20 flex items-center justify-center">
              <Radio className="w-6 h-6 text-purple-300 animate-pulse" />
              {/* Radar pulse */}
              <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-30" />
            </div>
            <span className="mt-2 text-xs font-bold text-purple-200 tracking-wider">WATCHREALM PLAZA</span>
            <span className="text-[10px] text-purple-400/80 font-medium flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-400" /> You Are Here
            </span>
          </div>

          {/* East: Sci-Fi Metropolis */}
          <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center w-48 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Sci-Fi District</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">LIVE</span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">Neon Pod 07</p>
              <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-white/10 pt-1.5 mb-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 18 watching</span>
              </div>
              <button
                onClick={() => {
                  sounds.playEnterPortal();
                  onFastTravel('scifi');
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Fast Travel
              </button>
            </div>
          </div>

          {/* West: Anime Village */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-pink-950/40 border border-pink-500/30 text-center w-48 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Anime Village</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">LIVE</span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">Cherry Blossom Café</p>
              <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-white/10 pt-1.5 mb-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 32 watching</span>
              </div>
              <button
                onClick={() => {
                  sounds.playEnterPortal();
                  onFastTravel('anime');
                }}
                className="w-full py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-pink-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Fast Travel
              </button>
            </div>
          </div>

          {/* South: Gaming Arena */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center w-52 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Gaming Arena</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">LIVE</span>
              </div>
              <p className="text-[11px] text-white/60 mb-2">Esports Colosseum</p>
              <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-white/10 pt-1.5 mb-2">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 45 watching</span>
              </div>
              <button
                onClick={() => {
                  sounds.playEnterPortal();
                  onFastTravel('gaming');
                }}
                className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-semibold text-xs transition-all cursor-pointer"
              >
                Fast Travel
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-white/50 border-t border-white/10">
          <span>Tip: Press [M] or click crosshair to return to first-person walking anytime</span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
