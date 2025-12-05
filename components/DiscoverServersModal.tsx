
import React, { useState, useEffect } from 'react';
import { Community } from '../types';
import { getPublicCommunities, joinCommunity, joinOfficialCommunity } from '../services/firebase';
import { X, Search, Globe, Users, Zap } from 'lucide-react';
import { Button } from './Button';

interface DiscoverServersModalProps {
  onClose: () => void;
  onJoin: (id: string) => void;
}

export const DiscoverServersModal: React.FC<DiscoverServersModalProps> = ({ onClose, onJoin }) => {
  const [servers, setServers] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    const publicServers = await getPublicCommunities();
    setServers(publicServers);
    setLoading(false);
  };

  const handleJoin = async (id: string) => {
    setJoining(id);
    try {
        await joinCommunity(id);
        onJoin(id);
        onClose();
    } catch (e) {
        console.error(e);
    } finally {
        setJoining(null);
    }
  };

  const handleJoinOfficial = async () => {
      setJoining('official');
      try {
          const id = await joinOfficialCommunity();
          onJoin(id);
          onClose();
      } catch (e) {
          console.error(e);
      } finally {
          setJoining(null);
      }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0F0F0F] border border-gray-800 w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
                <div className="flex items-center gap-2">
                    <Globe size={20} className="text-klaus-red" />
                    <h2 className="font-bold text-white uppercase tracking-widest text-sm">Discover Networks</h2>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Official Community Banner */}
                <div className="bg-gradient-to-r from-klaus-red to-black p-1 rounded-lg">
                    <div className="bg-[#1a1a1a] p-6 rounded flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
                            <span className="text-klaus-red font-black text-3xl">K</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                Official Klaus Community <Zap size={16} fill="yellow" className="text-yellow-500" />
                            </h3>
                            <p className="text-sm text-gray-400">Join the central hub for announcements, feedback, and public channels.</p>
                        </div>
                        <Button onClick={handleJoinOfficial} isLoading={joining === 'official'} className="shrink-0">
                            Join Official
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={14} /> Public Servers
                    </h3>
                    
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : servers.length === 0 ? (
                        <div className="text-center p-8 text-gray-600 text-xs">No other public servers found. Be the first to publish one!</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {servers.map(server => (
                                <div key={server.id} className="bg-[#151515] border border-gray-800 p-4 rounded hover:border-gray-600 transition-colors group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: server.color || '#333' }}>
                                            {server.photoURL ? <img src={server.photoURL} className="w-full h-full object-cover rounded" /> : server.name[0]}
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            className="py-1 px-3 text-[10px]" 
                                            onClick={() => handleJoin(server.id)}
                                            isLoading={joining === server.id}
                                        >
                                            Join
                                        </Button>
                                    </div>
                                    <h4 className="text-white font-bold text-sm truncate">{server.name}</h4>
                                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 h-8">{server.description}</p>
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-600 uppercase font-mono">
                                        <Users size={12} /> {server.members?.length || 0} Members
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
