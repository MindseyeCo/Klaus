
import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { createChannel } from '../services/firebase';
import { X, Hash } from 'lucide-react';

interface CreateChannelModalProps {
  communityId: string;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ communityId, onClose }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
        await createChannel(communityId, name.trim().toLowerCase().replace(/\s+/g, '-'));
    } catch (e) {
        console.error("Channel creation failed", e);
    } finally {
        // Ensure state is cleared and modal closed regardless of outcome
        setLoading(false);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0F0F0F] border border-gray-800 w-full max-w-sm rounded-lg overflow-hidden shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X size={20} />
            </button>
            
            <div className="p-6">
                <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Hash size={18} /> New Channel
                </h2>
                
                <Input 
                   autoFocus
                   placeholder="channel-name"
                   value={name}
                   onChange={e => setName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                />
                
                <div className="flex gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button onClick={handleCreate} isLoading={loading} disabled={!name} className="flex-1">Create</Button>
                </div>
            </div>
        </div>
    </div>
  );
};
