
import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { createCommunity, joinCommunity } from '../services/firebase';
import { X, Users, Globe, AlertTriangle, Palette, Lock, Unlock } from 'lucide-react';

interface CreateCommunityModalProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

const COLORS = [
  '#B30000', // Klaus Red
  '#0055B3', // Industrial Blue
  '#00B347', // Signal Green
  '#6600B3', // Deep Purple
  '#333333', // Carbon Gray
];

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({ onClose, onCreated }) => {
  const [mode, setMode] = useState<'create'|'join'>('create');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
        // Enforce a strict timeout to prevent infinite "Processing"
        const createPromise = createCommunity(name, desc, selectedColor, isPublic);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Network timed out. Please try again.")), 5000)
        );

        const id = await Promise.race([createPromise, timeoutPromise]) as string;
        setLoading(false); // Stop loading BEFORE closing to prevent state glitches
        onCreated(id);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to initialize server.");
        setLoading(false);
    }
  };

  const handleJoin = async () => {
      if (!joinId) return;
      setLoading(true);
      setError(null);
      try {
          const joinPromise = joinCommunity(joinId);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Connection timed out.")), 5000)
          );
          
          await Promise.race([joinPromise, timeoutPromise]);
          setLoading(false);
          onCreated(joinId); 
      } catch (e: any) {
          console.error(e);
          setError(e.message || "Failed to join network.");
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0F0F0F] border border-gray-800 w-full max-w-md relative rounded-lg overflow-hidden shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X size={20} />
            </button>
            
            <div className="p-8 pb-0">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 text-center">
                    {mode === 'create' ? 'Initialize Server' : 'Join Network'}
                </h2>
                
                <div className="flex gap-2 mb-6 bg-black p-1 rounded">
                    <button 
                        onClick={() => { setMode('create'); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${mode === 'create' ? 'bg-klaus-red text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Create
                    </button>
                    <button 
                        onClick={() => { setMode('join'); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${mode === 'join' ? 'bg-klaus-red text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Join
                    </button>
                </div>
            </div>

            <div className="p-8 pt-0 space-y-4">
                {error && (
                    <div className="bg-red-900/20 border border-red-900 p-3 rounded flex items-center gap-2 text-xs text-red-200">
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                )}

                {mode === 'create' ? (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center transition-colors" style={{ backgroundColor: selectedColor }}>
                                <span className="text-2xl font-bold text-white">
                                    {name ? name[0].toUpperCase() : '?'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-center gap-2 mb-4">
                             {COLORS.map(c => (
                                 <button 
                                   key={c}
                                   onClick={() => setSelectedColor(c)}
                                   className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'} transition-all`}
                                   style={{ backgroundColor: c }}
                                 />
                             ))}
                        </div>

                        <Input 
                            label="Server Name"
                            placeholder="My Community"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                        <div className="w-full">
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                            <textarea 
                                className="w-full bg-klaus-gray border-l-4 border-transparent text-white placeholder-gray-600 px-4 py-3 focus:outline-none focus:border-klaus-red focus:bg-black transition-all text-sm min-h-[80px]"
                                placeholder="What is this server about?"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between bg-[#151515] p-3 rounded border border-gray-800">
                            <div className="flex items-center gap-3">
                                {isPublic ? <Globe size={18} className="text-green-500" /> : <Lock size={18} className="text-gray-500" />}
                                <div>
                                    <div className="text-xs font-bold text-white uppercase">{isPublic ? 'Public Server' : 'Private Server'}</div>
                                    <div className="text-[10px] text-gray-500">{isPublic ? 'Visible in Discovery' : 'Invite Only'}</div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-klaus-red"></div>
                            </label>
                        </div>

                        <Button onClick={handleCreate} isLoading={loading} disabled={!name} className="w-full mt-4">
                            Create Server
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <Globe size={48} className="text-gray-700" />
                        </div>
                        <Input 
                            label="Invite ID / Community ID"
                            placeholder="Paste ID here"
                            value={joinId}
                            onChange={e => setJoinId(e.target.value)}
                        />
                        <Button onClick={handleJoin} isLoading={loading} disabled={!joinId} className="w-full mt-4">
                            Connect
                        </Button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};
