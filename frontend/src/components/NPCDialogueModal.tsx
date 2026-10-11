import React, { useState } from 'react';
import { sounds } from '../audio/soundManager';
import { X, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';

interface NPCDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterParty: () => void;
}

export const NPCDialogueModal: React.FC<NPCDialogueModalProps> = ({ isOpen, onClose, onEnterParty }) => {
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOption = (text: string, action?: () => void) => {
    sounds.playClick();
    if (action) {
      action();
      return;
    }
    setCurrentResponse(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#181d2a] to-[#0d1017] border border-cyan-500/30 shadow-2xl p-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Eldrin the Wayfinder</h3>
              <p className="text-xs text-cyan-300/80">Crossroads Guide • WatchRealm Plaza</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue Box */}
        <div className="my-5 p-4 rounded-xl bg-black/40 border border-white/5">
          <p className="text-sm text-white/90 leading-relaxed italic">
            "{currentResponse || 'Greetings, traveler. You stand at the Crossroads of WatchRealm. Every path ahead leads to a distinct universe where minds gather to watch as one. Whither do your footsteps lead?'}"
          </p>
        </div>

        {/* Player Response Choices */}
        <div className="space-y-2">
          <button
            onClick={() => handleOption("Follow the lanterns north into the pine glade. There you will find the Fellowship Watch Pavilion beneath the starlight. Or I can transport you there instantly.")}
            className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-xs text-white/80 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              "Where does the Fantasy World begin?"
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleOption("WatchRealm is not a static list of video links. It is a living park where every stream exists as a physical gathering. When a Host plays, pauses, or seeks, the entire room moves in perfect harmony.")}
            className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-xs text-white/80 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              "What is WatchRealm?"
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              sounds.playEnterPortal();
              onEnterParty();
            }}
            className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-amber-600/40 to-amber-500/20 hover:from-amber-600/60 hover:to-amber-500/40 border border-amber-500/50 text-xs text-amber-200 font-semibold transition-all flex items-center justify-between group cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              "Take me straight to the Fellowship Watch Party!"
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 flex justify-end border-t border-white/10">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/80 cursor-pointer"
          >
            Farewell
          </button>
        </div>
      </div>
    </div>
  );
};
