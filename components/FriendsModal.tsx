
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getFriendsList, getUserProfile, acceptFriendRequest, removeFriend, createChat, searchUsers, getSuggestedUsers, sendFriendRequest, browseUsers } from '../services/firebase';
import { UserPlus, MessageSquare, Check, Trash2, Users, Search, Sparkles, FolderOpen, List, Clock, UserCheck } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface SocialHubViewProps {
  currentUser: User;
  onStartChat: (chatId: string) => void;
}

export const SocialHubView: React.FC<SocialHubViewProps> = ({ currentUser, onStartChat }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'directory' | 'recommended'>('all');
  const [friends, setFriends] = useState<User[]>([]);
  const [pending, setPending] = useState<User[]>([]);
  const [recommended, setRecommended] = useState<User[]>([]);
  const [directoryList, setDirectoryList] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser, activeTab]);

  useEffect(() => {
      const delayDebounce = setTimeout(async () => {
          if (searchTerm.trim().length > 1) {
              setIsSearching(true);
              const users = await searchUsers(searchTerm);
              setSearchResults(users);
              setIsSearching(false);
          } else {
              setSearchResults([]);
          }
      }, 500);
      return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const loadData = async () => {
      setLoading(true);
      if (activeTab === 'all' && currentUser.friends) {
          const list = await getFriendsList(currentUser.friends);
          setFriends(list);
      } else if (activeTab === 'pending') {
          const incoming = currentUser.friendRequests?.incoming || [];
          if (incoming.length > 0) {
            const list = await getFriendsList(incoming);
            setPending(list);
          } else {
            setPending([]);
          }
      } else if (activeTab === 'recommended') {
          const list = await getSuggestedUsers();
          setRecommended(list);
      } else if (activeTab === 'directory') {
          const list = await browseUsers();
          setDirectoryList(list);
      }
      setLoading(false);
  };

  const handleAccept = async (uid: string) => {
      await acceptFriendRequest(uid);
      setPending(prev => prev.filter(p => p.uid !== uid));
  };

  const handleStartChat = async (user: User) => {
      const chatId = await createChat([user]);
      onStartChat(chatId);
  };

  const handleAddFriend = async (uid: string) => {
      await sendFriendRequest(uid);
      alert("Request transmitted.");
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] relative w-full overflow-hidden">
         {/* Header */}
         <div className="h-14 bg-[#0F0F0F] border-b border-gray-800 flex items-center px-4 justify-between shrink-0 z-40 relative shadow-md">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-klaus-red rounded-full animate-pulse" />
                 <span className="font-bold text-white tracking-widest uppercase text-sm">Social Hub</span>
             </div>
         </div>

         {/* Desktop Tabs */}
         <div className="bg-[#0F0F0F] border-b border-gray-800 p-2 flex justify-center shrink-0 z-30">
             <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-700/50 w-full max-w-lg">
                 <button onClick={() => setActiveTab('all')} className={`flex-1 py-1.5 px-4 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'all' ? 'bg-klaus-red text-white' : 'text-gray-400 hover:text-white'}`}>Friends</button>
                 <button onClick={() => setActiveTab('pending')} className={`flex-1 py-1.5 px-4 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'pending' ? 'bg-klaus-red text-white' : 'text-gray-400 hover:text-white'}`}>Pending</button>
                 <button onClick={() => setActiveTab('directory')} className={`flex-1 py-1.5 px-4 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'directory' ? 'bg-klaus-red text-white' : 'text-gray-400 hover:text-white'}`}>Directory</button>
                 <button onClick={() => setActiveTab('recommended')} className={`flex-1 py-1.5 px-4 text-xs font-bold uppercase rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'recommended' ? 'bg-klaus-red text-white' : 'text-gray-400 hover:text-white'}`}>Suggested</button>
             </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-4 bg-[#0A0A0A] pb-24">
             {loading ? (
                 <div className="flex justify-center p-8">
                     <div className="w-6 h-6 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div>
                 </div>
             ) : (
                 <div className="max-w-3xl mx-auto space-y-2">
                     {/* DIRECTORY */}
                     {activeTab === 'directory' && (
                         <div className="space-y-4">
                             <div className="relative sticky top-0 z-10">
                                 <Search className="absolute left-3 top-3 text-gray-500" size={16} />
                                 <input 
                                     autoFocus
                                     className="w-full bg-[#151515] text-white border border-gray-800 focus:border-klaus-red focus:outline-none pl-10 pr-4 py-2 uppercase tracking-wide text-xs rounded"
                                     placeholder="SEARCH DATABASE (NAME / EMAIL / ID)..."
                                     value={searchTerm}
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                 />
                             </div>
                             
                             {isSearching && <div className="text-center text-xs text-gray-500 animate-pulse">Scanning...</div>}

                             {searchTerm.trim().length > 1 ? (
                                 <>
                                    {searchResults.length === 0 && !isSearching && <div className="text-center text-xs text-gray-500 py-4">No personnel matches found.</div>}
                                    {searchResults.map(u => (
                                        <UserListItem 
                                            key={u.uid} 
                                            user={u} 
                                            onAdd={() => handleAddFriend(u.uid)} 
                                            onMessage={() => handleStartChat(u)}
                                            isFriend={currentUser.friends?.includes(u.uid)} 
                                            hasSentRequest={currentUser.friendRequests?.outgoing?.includes(u.uid)}
                                        />
                                    ))}
                                 </>
                             ) : (
                                 <>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">
                                        Global Personnel List ({directoryList.length})
                                    </div>
                                    {directoryList.map(u => (
                                        <UserListItem 
                                            key={u.uid} 
                                            user={u} 
                                            onAdd={() => handleAddFriend(u.uid)} 
                                            onMessage={() => handleStartChat(u)} 
                                            isFriend={currentUser.friends?.includes(u.uid)} 
                                            hasSentRequest={currentUser.friendRequests?.outgoing?.includes(u.uid)}
                                        />
                                    ))}
                                    {directoryList.length === 0 && <div className="text-center text-gray-500 text-xs py-8">Directory Empty.</div>}
                                 </>
                             )}
                         </div>
                     )}

                     {/* RECOMMENDED */}
                     {activeTab === 'recommended' && (
                         <div className="grid grid-cols-1 gap-2">
                             {recommended.length === 0 && <div className="text-center text-gray-500 text-xs py-8">No recommendations available.</div>}
                             {recommended.map(u => (
                                 <UserListItem 
                                     key={u.uid} 
                                     user={u} 
                                     onAdd={() => handleAddFriend(u.uid)} 
                                     hasSentRequest={currentUser.friendRequests?.outgoing?.includes(u.uid)}
                                 />
                             ))}
                         </div>
                     )}

                     {/* FRIENDS & PENDING */}
                     {(activeTab === 'all' || activeTab === 'pending') && (
                         <>
                            {(activeTab === 'all' ? friends : pending).length === 0 && (
                                 <div className="text-center text-gray-500 text-xs py-8">
                                     {activeTab === 'all' ? "No personnel in roster." : "No incoming pending requests."}
                                 </div>
                            )}
                            {(activeTab === 'all' ? friends : pending).map(u => (
                                <div key={u.uid} className="flex items-center justify-between p-3 bg-[#151515] border border-gray-800 rounded">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={u.photoURL || ''} 
                                            className="w-10 h-10 rounded bg-gray-800 object-cover" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || '')}&background=B30000&color=fff`;
                                            }}
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-white">{u.displayName}</div>
                                            <div className="text-[10px] text-gray-500">{u.handle || u.uid.substring(0,8)}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {activeTab === 'all' ? (
                                            <button onClick={() => handleStartChat(u)} className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors" title="Message">
                                                <MessageSquare size={16} />
                                            </button>
                                        ) : (
                                            <button onClick={() => handleAccept(u.uid)} className="px-3 py-1.5 bg-green-900/30 hover:bg-green-900 text-green-500 border border-green-900 rounded transition-colors text-xs font-bold uppercase flex items-center gap-2" title="Accept">
                                                <Check size={14} /> Accept
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                         </>
                     )}
                 </div>
             )}
         </div>
    </div>
  );
};

const UserListItem: React.FC<{ user: User, onAdd: () => void, onMessage?: () => void, isFriend?: boolean, hasSentRequest?: boolean }> = ({ user, onAdd, onMessage, isFriend, hasSentRequest }) => (
    <div className="flex items-center justify-between p-3 bg-[#151515] border border-gray-800 rounded hover:border-gray-700 transition-colors">
        <div className="flex items-center gap-3">
            <img 
                src={user.photoURL || ''} 
                className="w-10 h-10 rounded bg-gray-800 object-cover" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=B30000&color=fff`;
                }}
            />
            <div>
                <div className="text-sm font-bold text-white">{user.displayName}</div>
                <div className="text-[10px] text-gray-500">{user.email}</div>
            </div>
        </div>
        <div className="flex gap-2">
            {onMessage && (
                <button onClick={onMessage} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-bold uppercase transition-colors" title="Message">
                    <MessageSquare size={14} />
                </button>
            )}
            
            {!isFriend && (
                <>
                    {hasSentRequest ? (
                         <button disabled className="p-2 bg-gray-800 text-gray-500 rounded cursor-not-allowed" title="Request Sent">
                             <Clock size={16} />
                         </button>
                    ) : (
                        <button onClick={onAdd} className="p-2 bg-gray-800 hover:bg-klaus-red hover:text-white text-gray-400 rounded transition-colors" title="Add Friend">
                            <UserPlus size={16} />
                        </button>
                    )}
                </>
            )}
        </div>
    </div>
);
