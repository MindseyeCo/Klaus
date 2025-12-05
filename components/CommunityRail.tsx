
import React, { useState } from 'react';
import { Community } from '../types';
import { Home, Plus, Globe, LogOut, Compass, Users } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import { leaveCommunity } from '../services/firebase';

interface CommunityRailProps {
  communities: Community[];
  selectedCommunityId: string | null;
  onSelectCommunity: (id: string | null) => void;
  onCreateCommunity: () => void;
  onSelectNexus: () => void;
  onSelectHub?: () => void;
  currentTab: 'chat' | 'nexus' | 'social' | 'hub';
  isMobile?: boolean;
  horizontal?: boolean;
  onDiscoverServers?: () => void;
}

export const CommunityRail: React.FC<CommunityRailProps> = ({ 
  communities, selectedCommunityId, onSelectCommunity, onCreateCommunity, onSelectNexus, onSelectHub, currentTab, isMobile, horizontal, onDiscoverServers
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, communityId: string } | null>(null);
  const [hiddenCommunities, setHiddenCommunities] = useState<string[]>([]);

  const handleContextMenu = (e: React.MouseEvent, communityId: string) => { e.preventDefault(); if (!isMobile) setContextMenu({ x: e.clientX, y: e.clientY, communityId }); };
  const handleLeave = async () => {
      if (contextMenu) {
          if (confirm("Disconnect from this secure server?")) {
            setHiddenCommunities(prev => [...prev, contextMenu.communityId]);
            if (selectedCommunityId === contextMenu.communityId) onSelectCommunity(null);
            await leaveCommunity(contextMenu.communityId);
          }
          setContextMenu(null);
      }
  };

  const visibleCommunities = communities.filter(c => !hiddenCommunities.includes(c.id));
  const railClass = horizontal ? "flex flex-row items-center w-full px-4 py-3 gap-3 overflow-x-auto scrollbar-hide bg-[#050505] border-b border-gray-800 shrink-0" : `bg-[#050505] border-r border-gray-800 flex-col items-center py-3 gap-3 z-30 ${isMobile ? 'hidden' : 'flex w-[72px] h-full overflow-y-auto scrollbar-hide'}`;
  const iconClass = (active: boolean) => `w-12 h-12 rounded-[24px] overflow-hidden transition-all duration-300 border-2 border-transparent flex items-center justify-center shrink-0 ${active ? 'rounded-[16px] border-white' : 'group-hover:rounded-[16px] group-hover:scale-105'}`;

  return (
    <div className={railClass}>
       {!horizontal && (
           <>
            <div className="relative group flex items-center justify-center w-full">
                {selectedCommunityId === null && currentTab === 'chat' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-fade-in" />}
                <button onClick={() => onSelectCommunity(null)} className={`w-12 h-12 rounded-[24px] bg-gray-800 hover:bg-klaus-red text-white flex items-center justify-center transition-all duration-300 ${(selectedCommunityId === null && currentTab === 'chat') ? 'rounded-[16px] bg-klaus-red' : 'group-hover:rounded-[16px]'}`}>
                    <Home size={24} />
                </button>
            </div>

            <div className="relative group flex items-center justify-center w-full">
                {currentTab === 'nexus' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-fade-in" />}
                <button onClick={onSelectNexus} className={`w-12 h-12 rounded-[24px] bg-gray-800 hover:bg-klaus-red text-white flex items-center justify-center transition-all duration-300 ${currentTab === 'nexus' ? 'rounded-[16px] bg-klaus-red' : 'group-hover:rounded-[16px]'}`}>
                    <Globe size={24} />
                </button>
            </div>

            <div className="relative group flex items-center justify-center w-full">
                {currentTab === 'hub' && <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full animate-fade-in" />}
                <button onClick={onSelectHub} className={`w-12 h-12 rounded-[24px] bg-gray-800 hover:bg-klaus-red text-white flex items-center justify-center transition-all duration-300 ${currentTab === 'hub' ? 'rounded-[16px] bg-klaus-red' : 'group-hover:rounded-[16px]'}`}>
                    <Users size={24} />
                </button>
            </div>

            <div className="w-8 h-0.5 bg-gray-800 rounded-full mx-auto my-2" />
           </>
       )}

       {visibleCommunities.map(comm => (
         <div key={comm.id} className="relative group flex items-center justify-center animate-slide-up">
            {!horizontal && selectedCommunityId === comm.id && (currentTab === 'chat' || currentTab === 'social') && <div className="absolute left-0 w-1 h-10 bg-white rounded-r-full animate-fade-in" />}
            <button onClick={() => onSelectCommunity(comm.id)} onContextMenu={(e) => handleContextMenu(e, comm.id)} className={iconClass(selectedCommunityId === comm.id && (currentTab === 'chat' || currentTab === 'social'))} style={{ backgroundColor: comm.photoURL ? 'transparent' : (comm.color || '#333') }}>
                {comm.photoURL ? <img src={comm.photoURL} alt={comm.name} className="w-full h-full object-cover" /> : <div className="text-white font-bold text-lg">{comm.name.substring(0,1).toUpperCase()}</div>}
            </button>
            {!horizontal && <div className="absolute left-16 px-2 py-1 bg-black border border-gray-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">{comm.name}</div>}
         </div>
       ))}

       <button onClick={onCreateCommunity} className={`w-12 h-12 rounded-[24px] bg-[#151515] hover:bg-green-600 text-green-500 hover:text-white flex items-center justify-center transition-all duration-300 hover:rounded-[16px] shrink-0 ${horizontal ? '' : 'mt-auto'}`} title="Create Server"><Plus size={24} /></button>
       <button onClick={onDiscoverServers} className={`w-12 h-12 rounded-[24px] bg-[#151515] hover:bg-blue-600 text-blue-500 hover:text-white flex items-center justify-center transition-all duration-300 hover:rounded-[16px] shrink-0 ${horizontal ? '' : 'mb-2 mt-2'}`} title="Discover Servers"><Compass size={24} /></button>
       
       {contextMenu && (
           <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}>
               <button onClick={handleLeave} className="w-full text-left px-4 py-2 hover:bg-red-900/20 text-red-400 hover:text-red-200 text-xs font-bold uppercase flex items-center gap-2"><LogOut size={14} /> Leave Server</button>
           </ContextMenu>
       )}
    </div>
  );
};
