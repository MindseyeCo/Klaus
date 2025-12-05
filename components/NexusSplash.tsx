
import React from 'react';
import { Shield, Globe, Database, Check } from 'lucide-react';
import { Button } from './Button';

interface NexusSplashProps {
  onComplete: () => void;
}

export const NexusSplash: React.FC<NexusSplashProps> = ({ onComplete }) => {
  const handleAcknowledge = () => {
    localStorage.setItem('nexus_intro_seen', 'true');
    onComplete();
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#050505] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-lg border border-gray-800 bg-[#0F0F0F] relative overflow-hidden shadow-2xl rounded-lg">
         {/* Industrial Header */}
         <div className="h-1 bg-klaus-red w-full"></div>
         <div className="p-8 pb-0 text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                Klaus<span className="text-klaus-red">.Nexus</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                Secure Data & Media Aggregation Node
            </p>
         </div>

         <div className="p-8 space-y-8">
            <div className="flex gap-4 items-start animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 bg-[#1a1a1a] border border-gray-800 rounded flex items-center justify-center text-klaus-red shrink-0">
                    <Globe size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold uppercase text-sm">Global Archives</h3>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Nexus aggregates data from the Internet Archive, NASA, and open-source libraries. Content is streamed securely.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 items-start animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 bg-[#1a1a1a] border border-gray-800 rounded flex items-center justify-center text-klaus-red shrink-0">
                    <Database size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold uppercase text-sm">Secure Collections</h3>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Save files to your encrypted personal collection. Data is stored via IndexedDB for offline access.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 items-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-12 h-12 bg-[#1a1a1a] border border-gray-800 rounded flex items-center justify-center text-klaus-red shrink-0">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold uppercase text-sm">Cloud Messaging</h3>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Integrated user directory allows instant sharing of Nexus files to Klaus DMs and Channels.
                    </p>
                </div>
            </div>
         </div>

         <div className="p-6 bg-[#151515] border-t border-gray-800 flex justify-end">
             <Button onClick={handleAcknowledge} className="w-full md:w-auto">
                 <Check size={16} className="mr-2" /> Acknowledge Protocol
             </Button>
         </div>
      </div>
    </div>
  );
};
