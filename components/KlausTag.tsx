
import React from 'react';
import { X, Copy, QrCode } from 'lucide-react';
import { User } from '../types';

interface KlausTagProps {
  user: User;
  onClose: () => void;
}

export const KlausTag: React.FC<KlausTagProps> = ({ user, onClose }) => {
  // Generate a URL that points to the app with a profile query param
  const profileLink = `${window.location.origin}?profile=${user.uid}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(profileLink)}&bgcolor=000000&color=B30000&margin=10`;

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink);
    alert("Identity Link copied to clipboard.");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-[#0A0A0A] border-2 border-klaus-red/50 relative overflow-hidden shadow-[0_0_30px_rgba(179,0,0,0.3)] flex flex-col items-center p-8 rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={24} />
        </button>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Klaus<span className="text-klaus-red">.ID</span></h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">PERSONNEL IDENTITY TAG</p>
        </div>

        <div className="relative group cursor-pointer mb-6" onClick={copyLink}>
            <div className="absolute inset-0 bg-klaus-red blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-black p-4 border border-gray-800 rounded-lg">
                <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 font-bold text-white text-xs uppercase tracking-widest rounded-lg">
                Copy Link
            </div>
        </div>

        <div className="text-center space-y-2 mb-6">
            <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
            <p className="text-xs text-gray-500 font-mono">{user.uid}</p>
        </div>

        <div className="w-full flex gap-2">
            <button 
                onClick={copyLink}
                className="flex-1 py-3 bg-[#151515] hover:bg-[#202020] border border-gray-800 text-white text-xs font-bold uppercase rounded flex items-center justify-center gap-2"
            >
                <Copy size={16} /> Copy ID
            </button>
        </div>
        
        <div className="mt-6 text-[8px] text-gray-700 font-mono text-center">
            SCAN TO INITIALIZE DIRECT COMMS LINK
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-klaus-red rounded-tl-xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-klaus-red rounded-br-xl pointer-events-none"></div>
      </div>
    </div>
  );
};
