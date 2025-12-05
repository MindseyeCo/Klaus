
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { searchUsers, createChat } from '../services/firebase';
import { Input } from './Input';
import { Button } from './Button';
import { X, Search, UserPlus, Users } from 'lucide-react';

interface NewChatModalProps {
  currentUser: User;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ currentUser, onClose, onChatCreated }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setLoading(true);
        const users = await searchUsers(searchTerm);
        setResults(users);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const toggleUser = (user: User) => {
    if (selectedUsers.find(u => u.uid === user.uid)) {
      setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const chatId = await createChat(selectedUsers, selectedUsers.length > 1 ? groupName || 'New Group' : undefined);
      onChatCreated(chatId);
    } catch (e) {
      console.error("Failed to create chat", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0F0F0F] border border-gray-800 w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative Top Bar */}
        <div className="h-1 bg-klaus-red w-full"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">New Transmission</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">
              Select personnel for secure channel
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Selected Users Pill Area */}
        {selectedUsers.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-800 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
             {selectedUsers.map(u => (
               <div key={u.uid} className="flex items-center gap-1 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700">
                  <span>{u.displayName}</span>
                  <button onClick={() => toggleUser(u)} className="hover:text-red-400 ml-1"><X size={12}/></button>
               </div>
             ))}
          </div>
        )}

        {/* Group Name Input (if multiple) */}
        {selectedUsers.length > 1 && (
           <div className="px-6 pt-4">
              <Input 
                placeholder="GROUP DESIGNATION (OPTIONAL)" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="text-sm"
              />
           </div>
        )}

        {/* Search Input */}
        <div className="p-6 pb-2">
           <div className="relative">
             <Search className="absolute left-3 top-3 text-gray-500" size={16} />
             <input 
               autoFocus
               className="w-full bg-[#151515] text-white border-b-2 border-gray-800 focus:border-klaus-red focus:outline-none pl-10 pr-4 py-2 uppercase tracking-wide text-sm transition-colors"
               placeholder="SEARCH PERSONNEL BY NAME OR ID..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             {loading && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div>}
           </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 mx-4 mb-4 border border-gray-800/50 bg-[#0A0A0A]">
           {results.length === 0 && searchTerm.length > 1 && !loading && (
             <div className="text-center p-8 text-gray-600 text-xs uppercase tracking-widest">No personnel found</div>
           )}
           {results.map(user => {
             const isSelected = !!selectedUsers.find(u => u.uid === user.uid);
             return (
               <div 
                 key={user.uid}
                 onClick={() => toggleUser(user)}
                 className={`
                   p-3 mb-1 flex items-center gap-3 cursor-pointer transition-all border border-transparent
                   ${isSelected ? 'bg-red-900/20 border-red-900/50' : 'hover:bg-white/5'}
                 `}
               >
                 <div className="relative">
                   <img 
                      src={user.photoURL || 'https://via.placeholder.com/150'} 
                      alt="" 
                      className="w-8 h-8 rounded bg-gray-700 object-cover"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=B30000&color=fff`;
                      }}
                   />
                   {isSelected && (
                     <div className="absolute -top-1 -right-1 bg-klaus-red text-white rounded-full p-0.5">
                       <UserPlus size={10} />
                     </div>
                   )}
                 </div>
                 <div className="flex-1">
                    <div className="text-sm font-bold text-gray-200">{user.displayName}</div>
                    <div className="text-[10px] text-gray-500">{user.email}</div>
                 </div>
                 <div className={`w-3 h-3 border border-gray-600 ${isSelected ? 'bg-klaus-red border-klaus-red' : ''}`}></div>
               </div>
             );
           })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 border-t border-gray-800 bg-[#0F0F0F]">
          <Button 
             onClick={handleCreate} 
             disabled={selectedUsers.length === 0 || creating}
             className="w-full"
          >
             {creating ? 'INITIALIZING...' : selectedUsers.length > 1 ? 'ESTABLISH GROUP CHANNEL' : 'ESTABLISH LINK'}
          </Button>
        </div>
      </div>
    </div>
  );
};
