
import React from 'react';
import { X, Zap, Globe, Shield, Radio } from 'lucide-react';

interface WhatsNewModalProps {
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#0F0F0F] border-2 border-yellow-500 w-full max-w-md rounded-lg overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-yellow-500 p-4 flex justify-between items-center text-black">
           <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
             <Zap fill="black" size={24} />
             System Update 3.1
           </h2>
           <button onClick={onClose} className="hover:bg-black/20 p-1 rounded transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/30">
                 <Globe size={20} />
              </div>
              <div>
                 <h3 className="text-yellow-500 font-bold uppercase text-sm tracking-wide">Nexus Global Feed</h3>
                 <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Access the Internet Archive, NASA footage, and curated vintage tech collections directly from the Nexus tab. Now features a dedicated Home discovery view.
                 </p>
              </div>
           </div>

           <div className="flex gap-4">
              <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/30">
                 <Radio size={20} />
              </div>
              <div>
                 <h3 className="text-yellow-500 font-bold uppercase text-sm tracking-wide">Social Hub & Handles</h3>
                 <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Establish your unique network identity with @handles. Browse the global personnel directory and manage friend requests in the redesigned Social Hub.
                 </p>
              </div>
           </div>

           <div className="flex gap-4">
              <div className="w-10 h-10 rounded bg-[#1a1a1a] flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/30">
                 <Shield size={20} />
              </div>
              <div>
                 <h3 className="text-yellow-500 font-bold uppercase text-sm tracking-wide">Secure Data Protocol</h3>
                 <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Enhanced user data architecture linking credentials securely to email designations. Improved persistence for profile customizations and server memberships.
                 </p>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#151515] border-t border-gray-800 text-center">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-widest text-xs rounded transition-colors"
            >
                Acknowledge
            </button>
        </div>
      </div>
    </div>
  );
};
