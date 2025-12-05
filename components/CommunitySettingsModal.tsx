
import React, { useState, useEffect } from 'react';
import { Community, User, ChatRoom } from '../types';
import { X, Copy, Check, Search, UserPlus, Users, Hash, PlusCircle, Trash2, Globe, Lock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { searchUsers, addMemberToCommunity, getCommunityMembers, createChannel, subscribeToChannels, deleteCommunity, updateCommunity } from '../services/firebase';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';

interface CommunitySettingsModalProps {
  community: Community;
  onClose: () => void;
}

const COLORS = ['#B30000', '#0055B3', '#00B347', '#6600B3', '#333333'];

export const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({ community, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'channels'>('overview');
  const [copied, setCopied] = useState(false);
  const [memberDetails, setMemberDetails] = useState<User[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  // Channel State
  const [channels, setChannels] = useState<ChatRoom[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [creatingChannel, setCreatingChannel] = useState(false);
  
  // Settings State
  const [isPublic, setIsPublic] = useState(community.isPublic || false);

  // Auth check for owner
  const auth = getAuth();
  const db = getFirestore();
  const isOwner = auth.currentUser?.uid === community.ownerId;

  useEffect(() => {
     if (activeTab === 'members') {
         getCommunityMembers(community.members).then(setMemberDetails);
     }
     if (activeTab === 'channels') {
         const unsubscribe = subscribeToChannels(community.id, setChannels);
         return unsubscribe;
     }
  }, [activeTab, community.members, community.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(community.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (val: string) => {
     setSearchTerm(val);
     if (val.trim().length > 1) {
         const res = await searchUsers(val);
         setSearchResults(res);
     } else {
         setSearchResults([]);
     }
  };

  const handleInvite = async (userId: string) => {
      await addMemberToCommunity(community.id, userId);
      const u = searchResults.find(r => r.uid === userId);
      if (u) {
          setMemberDetails(prev => [...prev, u]);
          setSearchResults(prev => prev.filter(r => r.uid !== userId));
      }
  };

  const handleCreateChannel = async () => {
      if (!newChannelName.trim()) return;
      setCreatingChannel(true);
      try {
          await createChannel(community.id, newChannelName.trim().toLowerCase().replace(/\s+/g, '-'));
          setNewChannelName('');
      } catch (e) {
          console.error("Failed to create channel", e);
      } finally {
          setCreatingChannel(false);
      }
  };

  const handleDeleteCommunity = async () => {
      if (confirm("Are you sure you want to delete this server? This action cannot be undone.")) {
          await deleteCommunity(community.id);
          onClose();
          window.location.reload(); 
      }
  }

  const handleUpdateColor = async (color: string) => {
      if (!isOwner) return;
      await updateDoc(doc(db, 'communities', community.id), { color });
  }

  const handleTogglePublic = async () => {
      if (!isOwner) return;
      const newState = !isPublic;
      setIsPublic(newState);
      await updateCommunity(community.id, { isPublic: newState });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0F0F0F] border border-gray-800 w-full max-w-lg rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#151515]">
                <h2 className="font-bold text-white uppercase tracking-widest text-sm">Server Protocols</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-3 px-4 text-xs font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-klaus-red text-white' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}
                >
                    Overview
                </button>
                <button 
                  onClick={() => setActiveTab('channels')}
                  className={`flex-1 py-3 px-4 text-xs font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'channels' ? 'bg-klaus-red text-white' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}
                >
                    Channels
                </button>
                <button 
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-3 px-4 text-xs font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'members' ? 'bg-klaus-red text-white' : 'text-gray-500 hover:bg-[#1a1a1a]'}`}
                >
                    Personnel ({community.members.length})
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: community.color }}>
                                {community.name[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{community.name}</h3>
                                <p className="text-sm text-gray-500">{community.description || 'Secure Server'}</p>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="bg-[#151515] p-4 rounded border border-gray-800">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                    Server Branding Color
                                </label>
                                <div className="flex gap-2">
                                     {COLORS.map(c => (
                                         <button 
                                           key={c}
                                           onClick={() => handleUpdateColor(c)}
                                           className={`w-6 h-6 rounded-full border-2 ${community.color === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'} transition-all`}
                                           style={{ backgroundColor: c }}
                                         />
                                     ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-[#151515] p-4 rounded border border-gray-800">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Server Access Code (Invite ID)
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-black border border-gray-800 p-2 text-sm font-mono text-gray-300 rounded">
                                    {community.id}
                                </div>
                                <Button onClick={handleCopy} className="py-0 px-4">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="flex items-center justify-between bg-[#151515] p-3 rounded border border-gray-800">
                                <div className="flex items-center gap-3">
                                    {isPublic ? <Globe size={18} className="text-green-500" /> : <Lock size={18} className="text-gray-500" />}
                                    <div>
                                        <div className="text-xs font-bold text-white uppercase">{isPublic ? 'Public Server' : 'Private Server'}</div>
                                        <div className="text-[10px] text-gray-500">{isPublic ? 'Visible in Discovery' : 'Invite Only'}</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={handleTogglePublic} />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-klaus-red"></div>
                                </label>
                            </div>
                        )}

                        {isOwner && (
                            <div className="border-t border-gray-800 pt-6 mt-6">
                                <h4 className="text-red-500 font-bold uppercase text-xs mb-2">Danger Zone</h4>
                                <Button variant="danger" onClick={handleDeleteCommunity} className="w-full">
                                    <Trash2 size={16} className="mr-2" /> Delete Server
                                </Button>
                            </div>
                        )}
                    </div>
                )}
                {/* Channels and Members Tabs Content (Restored) */}
                {activeTab === 'channels' && (
                    <div className="space-y-6">
                        <div className="bg-[#151515] p-4 rounded border border-gray-800 space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Create New Channel</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Hash size={14} className="absolute left-3 top-3.5 text-gray-500" />
                                    <Input placeholder="channel-name" value={newChannelName} onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s/g, '-'))} className="pl-8" />
                                </div>
                                <Button onClick={handleCreateChannel} disabled={!newChannelName} isLoading={creatingChannel}><PlusCircle size={18} /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Channels</label>
                            <div className="space-y-1">
                                {channels.map(channel => (
                                    <div key={channel.id} className="flex items-center gap-3 p-3 bg-[#151515] rounded border border-gray-800/50 hover:bg-[#1a1a1a]">
                                        <Hash size={16} className="text-gray-500" />
                                        <div className="flex-1"><div className="text-sm font-bold text-white">{channel.channelName}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'members' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Add Personnel</label>
                            <div className="relative">
                                <input className="w-full bg-[#151515] border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-klaus-red focus:outline-none pl-9" placeholder="Search by name..." value={searchTerm} onChange={e => handleSearch(e.target.value)} />
                                <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="bg-black border border-gray-800 rounded max-h-40 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-[#151515]">
                                            <div className="flex items-center gap-2"><img src={u.photoURL || ''} className="w-6 h-6 rounded bg-gray-700" /><span className="text-sm text-gray-300">{u.displayName}</span></div>
                                            {!community.members.includes(u.uid) && <button onClick={() => handleInvite(u.uid)} className="text-klaus-red hover:text-white"><UserPlus size={16} /></button>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Personnel</label>
                            <div className="space-y-1">
                                {memberDetails.map(m => (
                                    <div key={m.uid} className="flex items-center gap-3 p-2 bg-[#151515] rounded border border-gray-800/50">
                                        <img src={m.photoURL || ''} className="w-8 h-8 rounded bg-gray-800" />
                                        <div><div className="text-sm font-bold text-gray-300">{m.displayName}</div><div className="text-[10px] text-gray-600">{m.status || 'Active'}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
