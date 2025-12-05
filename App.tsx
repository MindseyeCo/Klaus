


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, ChatRoom, Message, Community, NexusSearchFilters } from './types';
import { subscribeToAuth, logout, subscribeToChats, subscribeToMessages, sendMessage, uploadMedia, subscribeToUserProfile, firebaseInitializationError, updateFirebaseConfig, subscribeToCommunities, createCommunity, subscribeToChannels, requestNotificationPermission, findOrCreateKlausChat, hideChat, leaveCommunity, loginWithEmail, registerWithEmail, loginWithGoogle, ensureUserHandle } from './services/firebase';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { MessageBubble } from './components/MessageBubble';
import { SettingsScreen } from './components/Settings';
import { NewChatModal } from './components/NewChatModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SplashScreen } from './components/SplashScreen';
import { Nexus } from './components/Nexus';
import { CommunityRail } from './components/CommunityRail';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { CommunitySettingsModal } from './components/CommunitySettingsModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { SocialHubView } from './components/FriendsModal';
import { DiscoverServersModal } from './components/DiscoverServersModal';
import { Zap, Users, Search, Settings, Plus, Globe, MessageSquare, Hash, Trash2, X, MessagesSquare, Eye, EyeOff } from 'lucide-react';
import { ContextMenu } from './components/ContextMenu';
import { ChatArea } from './components/ChatArea';

const useLongPress = (callback: () => void, ms = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  useEffect(() => {
    let timerId: any;
    if (startLongPress) timerId = setTimeout(callback, ms);
    else clearTimeout(timerId);
    return () => clearTimeout(timerId);
  }, [callback, ms, startLongPress]);
  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };
};

const SidebarItem = React.memo(({ chat, activeChatId, user, onSelectChat, handleContextMenu, isCommunityContext, isPinned }: any) => {
    let displayName = 'Unknown';
    let photoURL = '';
    let statusState = 'offline';
    let isKlaus = false;

    if (isCommunityContext) {
        displayName = `# ${chat.channelName || 'general'}`;
        statusState = 'online'; 
    } else {
        if (chat.isGroup) {
            displayName = chat.groupName || 'Group Chat';
            photoURL = 'https://ui-avatars.com/api/?name=Group&background=333&color=fff'; 
            statusState = 'online';
        } else {
            const otherUser = chat.participantDetails.find((u: User) => u.uid !== user.uid) || chat.participantDetails[0];
            displayName = otherUser?.displayName || 'Unknown';
            photoURL = otherUser?.photoURL || '';
            statusState = otherUser?.statusState || (otherUser?.isOnline ? 'online' : 'offline');
            isKlaus = otherUser?.uid === 'klaus-ai';
        }
    }
    const longPressProps = useLongPress(() => handleContextMenu(null, chat.id, 'chat'), 600);

    return (
      <div 
          onClick={() => onSelectChat(chat.id)}
          onContextMenu={(e) => { if (!isPinned && !isCommunityContext) handleContextMenu(e, chat.id, 'chat'); }}
          className={`mx-2 mb-1 p-3 rounded-md cursor-pointer transition-colors group relative overflow-hidden animate-slide-up ${activeChatId === chat.id ? 'bg-[#1a1a1a] border-l-2 border-klaus-red' : 'hover:bg-[#151515] border-l-2 border-transparent'} ${isPinned ? 'border-l-2 border-yellow-500 bg-[#151515]/50' : ''}`}
          {...longPressProps} 
      >
          <div className="flex gap-3 items-center relative z-10">
            {!isCommunityContext && (
                <div className="relative">
                <img src={photoURL || 'https://via.placeholder.com/150'} alt="" loading="lazy" className={`w-10 h-10 rounded bg-gray-800 object-cover ${isKlaus || isPinned ? 'border-2 border-yellow-500' : ''}`} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=B30000&color=fff`; }} />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#0F0F0F] rounded-full ${statusState === 'online' ? 'bg-green-500' : statusState === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className={`text-sm font-semibold truncate flex items-center gap-2 ${activeChatId === chat.id ? 'text-white' : 'text-gray-300'} ${isPinned ? 'text-yellow-500' : ''}`}>
                  {isCommunityContext && <Hash size={14} className="text-gray-500" />}
                  {displayName}
                  {(isKlaus || isPinned) && <span className="ml-2 text-[8px] bg-yellow-500 text-black px-1 py-0.5 rounded font-bold">AI</span>}
                </h3>
                {!isCommunityContext && <span className="text-[10px] text-gray-600">{chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleDateString() : ''}</span>}
              </div>
              {!isCommunityContext && (
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage?.senderId === user.uid ? 'You: ' : ''}{chat.lastMessage?.text || 'No messages yet'}</p>
              )}
            </div>
          </div>
      </div>
    );
});


interface SidebarProps {
  chats: ChatRoom[]; 
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  user: User;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  showMobileList: boolean;
  onNewChat: () => void;
  currentTab: 'chat' | 'nexus' | 'social' | 'hub';
  isCommunityContext: boolean;
  currentCommunity?: Community;
  onOpenCommunitySettings?: () => void;
  onCreateChannel?: () => void;
  onOpenHub: () => void;
  onOptimisticRemove: (id: string) => void;
  communities?: Community[];
  onSelectCommunity?: (id: string | null) => void;
  onCreateCommunity?: () => void;
  nexusFilters?: NexusSearchFilters;
  setNexusFilters?: React.Dispatch<React.SetStateAction<NexusSearchFilters>>;
  onDiscoverServers?: () => void;
  onSelectNexus: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, activeChatId, onSelectChat, user, onOpenSettings, onOpenProfile, onNewChat, currentTab, isCommunityContext, currentCommunity, onOpenCommunitySettings, onCreateChannel, onOpenHub, onOptimisticRemove, communities, onSelectCommunity, onCreateCommunity, nexusFilters, setNexusFilters, onDiscoverServers, onSelectNexus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'chat' | 'server' } | null>(null);

  const filteredChats = useMemo(() => chats.filter(c => {
    if (c.channelName) return c.channelName.toLowerCase().includes(searchTerm.toLowerCase());
    if (c.groupName) return c.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    const otherUser = c.participantDetails.find(u => u.uid !== user.uid);
    return otherUser?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
  }), [chats, searchTerm, user.uid]);

  const klausChat = useMemo(() => filteredChats.find(c => !isCommunityContext && c.participantDetails.some(p => p.uid === 'klaus-ai')), [filteredChats, isCommunityContext]);
  const otherChats = useMemo(() => filteredChats.filter(c => c.id !== klausChat?.id), [filteredChats, klausChat]);

  const getStatusColor = (state: string | undefined) => {
    switch(state) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent | null, id: string, type: 'chat') => {
      e?.preventDefault();
      if(e) setContextMenu({ x: e.clientX, y: e.clientY, id, type });
      else setContextMenu({ x: window.innerWidth/2, y: window.innerHeight/2, id, type }); // Fallback for long press
  }, []);

  const handleHideChat = async () => {
      if(contextMenu && contextMenu.type === 'chat') {
          onOptimisticRemove(contextMenu.id);
          await hideChat(contextMenu.id);
          setContextMenu(null);
      }
  };

  return (
    <div className="w-full md:w-80 h-full bg-[#0F0F0F] border-r border-gray-800 flex flex-col transition-transform duration-300">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0F0F0F]">
         <div className="flex items-center gap-3 overflow-hidden">
            {isCommunityContext && currentCommunity ? (
                <>
                    {currentCommunity.photoURL ? ( <img src={currentCommunity.photoURL} className="w-8 h-8 rounded bg-gray-800" /> ) : ( <div className="w-8 h-8 bg-gray-800 flex items-center justify-center font-bold text-white rounded">{currentCommunity.name.substring(0,1).toUpperCase()}</div> )}
                    <span className="font-bold tracking-wide text-sm truncate">{currentCommunity.name}</span>
                    <button onClick={onOpenCommunitySettings} className="ml-1 text-gray-500 hover:text-white p-1"><Settings size={14} /></button>
                </>
            ) : (
                <>
                    <div className="w-8 h-8 bg-klaus-red clip-path-hex flex items-center justify-center font-bold text-white text-sm">K</div>
                    <span className="font-bold tracking-widest text-sm">KLAUS</span>
                </>
            )}
         </div>
      </div>

      {currentTab === 'nexus' ? (
        <div className="p-4 flex-1 overflow-y-auto">
           <div className="bg-[#151515] p-4 rounded border border-gray-800 mb-6">
             <h3 className="text-klaus-red font-bold uppercase tracking-widest text-xs mb-2">Nexus Network</h3>
             <p className="text-gray-500 text-xs leading-relaxed">Global archive feed operational. Access historical data, visual media, and engineering logs.</p>
           </div>
        </div>
      ) : currentTab === 'hub' ? (
          <div className="p-4 flex-1 overflow-y-auto">
             <div className="bg-[#151515] p-4 rounded border border-gray-800 mb-6">
                <h3 className="text-klaus-red font-bold uppercase tracking-widest text-xs mb-2">Social Hub</h3>
                <p className="text-gray-500 text-xs leading-relaxed">Global personnel directory and network connections.</p>
             </div>
          </div>
      ) : (
        <>
            {currentTab === 'social' && communities && (
                 <CommunityRail communities={communities} selectedCommunityId={currentCommunity?.id || null} onSelectCommunity={onSelectCommunity!} onCreateCommunity={onCreateCommunity!} onSelectNexus={onSelectNexus} currentTab='social' isMobile={false} horizontal={true} onDiscoverServers={onDiscoverServers} />
            )}

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
                <input type="text" placeholder={isCommunityContext ? "FILTER CHANNELS" : "FILTER CHATS"} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#1a1a1a] text-gray-300 text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-klaus-red border border-transparent placeholder-gray-600 uppercase tracking-wide transition-all" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pb-2 flex justify-between items-center">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{isCommunityContext ? 'Text Channels' : 'Direct Messages'}</span>
                 {isCommunityContext ? ( <button onClick={onCreateChannel} className="text-gray-500 hover:text-klaus-red p-1"><Plus size={14}/></button> ) : ( <button onClick={onNewChat} className="text-gray-500 hover:text-klaus-red p-1"><Plus size={14}/></button> )}
              </div>
              
              {klausChat && <SidebarItem key={klausChat.id} chat={klausChat} activeChatId={activeChatId} user={user} onSelectChat={onSelectChat} handleContextMenu={handleContextMenu} isCommunityContext={isCommunityContext} isPinned={true} />}
              {otherChats.map(chat => ( <SidebarItem key={chat.id} chat={chat} activeChatId={activeChatId} user={user} onSelectChat={onSelectChat} handleContextMenu={handleContextMenu} isCommunityContext={isCommunityContext} /> ))}
            </div>
        </>
      )}

      {contextMenu && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}>
              <button onClick={handleHideChat} className="flex items-center gap-2 text-red-400 hover:text-white px-4 py-2 w-full text-left text-xs font-bold uppercase hover:bg-red-900/20"><Trash2 size={14} /> Remove Chat</button>
          </ContextMenu>
      )}

      <div className="hidden md:flex p-4 border-t border-gray-800 items-center gap-3 bg-[#0A0A0A]">
        <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={onOpenProfile}>
          <img src={user.photoURL || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded bg-gray-700 object-cover" alt="me" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=B30000&color=fff`; }} />
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-2 border-[#0A0A0A] rounded-full ${getStatusColor(user.statusState)}`} />
        </div>
        <div className="flex-1 overflow-hidden cursor-pointer" onClick={onOpenProfile}>
          <div className="text-xs font-bold text-white truncate">{user.displayName}</div>
          <div className="text-[10px] text-gray-400 truncate">{user.handle || user.status || 'Ready'}</div>
        </div>
        <button onClick={onOpenSettings} className="text-gray-500 hover:text-white cursor-pointer transition-colors p-2" title="Settings"><Settings size={16} /></button>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [currentTab, setCurrentTab] = useState<'chat' | 'nexus' | 'social' | 'hub'>('chat');
  const [nexusFilters, setNexusFilters] = useState<NexusSearchFilters>({});
  
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => sessionStorage.getItem('activeChatId') || null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [channelList, setChannelList] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showMobileList, setShowMobileList] = useState(true); 
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [showCommunitySettingsModal, setShowCommunitySettingsModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [hiddenChatIds, setHiddenChatIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if(user?.uid) return subscribeToCommunities(user.uid, setCommunities); }, [user]);
  useEffect(() => { if(user?.uid) return subscribeToChats(user.uid, (updatedChats) => setChats(updatedChats)); }, [user]);
  useEffect(() => { if(selectedCommunityId) return subscribeToChannels(selectedCommunityId, (channels) => setChannelList(channels.sort((a,b) => (a.channelName || '').localeCompare(b.channelName || '')))); else setChannelList([]); }, [selectedCommunityId]);
  useEffect(() => { if(activeChatId) { setShowMobileList(false); const u = subscribeToMessages(activeChatId, (msgs) => { setMessages(msgs); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }); return u; } }, [activeChatId]);

  const handleSend = async () => { if(!text.trim() || !activeChatId) return; const txt = text; setText(''); await sendMessage(activeChatId, { text: txt, type: 'text', senderId: user.uid, senderName: user.displayName || 'Unknown' }); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file && activeChatId) { const url = await uploadMedia(file); await sendMessage(activeChatId, { text: 'Sent an image', type: file.type.startsWith('image/') ? 'image' : 'text', mediaUrl: url, senderId: user.uid, senderName: user.displayName || 'Unknown' }); } };
  const handleSendMessageNexus = async (chatId: string, messageText: string) => { await sendMessage(chatId, { text: messageText, type: 'text', senderId: user.uid, senderName: user.displayName || 'Unknown' }); setSelectedCommunityId(null); setCurrentTab('chat'); setActiveChatId(chatId); };
  
  const handleSelectCommunity = (id: string | null) => { setSelectedCommunityId(id); setActiveChatId(null); sessionStorage.removeItem('activeChatId'); setShowMobileList(true); if (window.innerWidth < 768) setCurrentTab('social'); else setCurrentTab('chat'); };

  const visibleChats = (selectedCommunityId ? channelList : chats).filter(c => !hiddenChatIds.includes(c.id));

  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F0F0F] border-t border-gray-800 flex items-center justify-around z-50 px-2 pb-safe">
       <button onClick={() => { setCurrentTab('social'); setSelectedCommunityId(null); setShowMobileList(true); setView('main'); }} className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${currentTab === 'social' && !selectedCommunityId && view === 'main' ? 'text-klaus-red animate-bounce-short' : 'text-gray-500'}`}>
         <MessagesSquare size={20} className={currentTab === 'social' && !selectedCommunityId && view === 'main' ? 'animate-pulse-glow' : ''} />
         <span className="text-[10px] font-bold uppercase">Chats</span>
       </button>
       <button onClick={() => { setCurrentTab('hub'); setView('main'); setSelectedCommunityId(null); }} className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${currentTab === 'hub' && view === 'main' ? 'text-klaus-red animate-bounce-short' : 'text-gray-500'}`}>
         <Users size={20} className={currentTab === 'hub' && view === 'main' ? 'animate-pulse-glow' : ''} />
         <span className="text-[10px] font-bold uppercase">Social</span>
       </button>
       <button onClick={() => { setCurrentTab('nexus'); setView('main'); setSelectedCommunityId(null); }} className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${currentTab === 'nexus' && view === 'main' ? 'text-klaus-red animate-bounce-short' : 'text-gray-500'}`}>
         <Globe size={20} className={currentTab === 'nexus' && view === 'main' ? 'animate-pulse-glow' : ''} />
         <span className="text-[10px] font-bold uppercase">Nexus</span>
       </button>
       <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${view === 'settings' ? 'text-white' : ''}`}>
         <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${view === 'settings' ? 'border-klaus-red animate-pulse-glow' : 'border-gray-500'}`}>
            <img src={user.photoURL || 'https://via.placeholder.com/32'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || '')}&background=B30000&color=fff`; }} />
         </div>
         <span className="text-[10px] font-bold uppercase truncate max-w-[60px] text-gray-500">{user.displayName ? (user.displayName.length > 8 ? user.displayName.substring(0,6) + '...' : user.displayName) : 'User'}</span>
       </button>
    </div>
  );

  if (view === 'settings') return <div className="h-full"><SettingsScreen user={user} onBack={() => setView('main')} /><MobileNav /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A] text-white font-sans relative">
      <div className="hidden md:block relative z-50">
        <CommunityRail communities={communities} selectedCommunityId={selectedCommunityId} onSelectCommunity={handleSelectCommunity} onCreateCommunity={() => setShowCreateCommunityModal(true)} onSelectNexus={() => { setCurrentTab('nexus'); setSelectedCommunityId(null); setActiveChatId(null); }} currentTab={currentTab} isMobile={window.innerWidth < 768} onDiscoverServers={() => setShowDiscoverModal(true)} onSelectHub={() => { setCurrentTab('hub'); setSelectedCommunityId(null); setActiveChatId(null); }} />
      </div>

      <div className={`${((currentTab === 'chat' || currentTab === 'social' || currentTab === 'nexus' || currentTab === 'hub') && showMobileList) ? 'flex' : 'hidden md:flex'} w-full md:w-80 h-full flex-col z-20 absolute md:relative bg-[#0F0F0F] border-r border-gray-800`}>
         <Sidebar chats={visibleChats} activeChatId={activeChatId} onSelectChat={(id) => { setActiveChatId(id); sessionStorage.setItem('activeChatId', id); }} user={user} onOpenSettings={() => setView('settings')} onOpenProfile={() => setViewingProfileId(user.uid)} showMobileList={showMobileList} onNewChat={selectedCommunityId ? () => {} : () => setShowNewChatModal(true)} currentTab={currentTab} onSelectNexus={() => { setCurrentTab('nexus'); setSelectedCommunityId(null); }} isCommunityContext={!!selectedCommunityId} currentCommunity={communities.find(c => c.id === selectedCommunityId)} onOpenCommunitySettings={() => setShowCommunitySettingsModal(true)} onCreateChannel={() => setShowCreateChannelModal(true)} onOpenHub={() => { setCurrentTab('hub'); setSelectedCommunityId(null); }} onOptimisticRemove={(id) => setHiddenChatIds(prev => [...prev, id])} communities={communities} onSelectCommunity={handleSelectCommunity} onCreateCommunity={() => setShowCreateCommunityModal(true)} nexusFilters={nexusFilters} setNexusFilters={setNexusFilters} onDiscoverServers={() => setShowDiscoverModal(true)} />
      </div>

      <div className={`flex-1 h-full relative ${((currentTab === 'chat' || currentTab === 'social') && showMobileList) ? 'hidden md:block' : 'block'}`}>
         {(currentTab === 'chat' || currentTab === 'social') ? (
            <ChatArea activeChatId={activeChatId} activeChat={visibleChats.find(c => c.id === activeChatId)} user={user} messages={messages} text={text} setText={setText} onSend={handleSend} onFileUpload={handleFileUpload} setShowMobileList={(show) => { setShowMobileList(show); if(show) setActiveChatId(null); }} fileInputRef={fileInputRef} messagesEndRef={messagesEndRef} onViewProfile={(uid) => setViewingProfileId(uid)} onImageClick={(url) => setLightboxUrl(url)} />
         ) : currentTab === 'hub' ? (
             <SocialHubView currentUser={user} onStartChat={(id) => { setActiveChatId(id); setCurrentTab('chat'); }} />
         ) : (
            <Nexus chats={chats} onShareToChat={handleSendMessageNexus} sidebarFilters={nexusFilters} />
         )}
      </div>
      
      {showNewChatModal && <NewChatModal currentUser={user} onClose={() => setShowNewChatModal(false)} onChatCreated={(id) => { setShowNewChatModal(false); setActiveChatId(id); setCurrentTab('chat'); }} />}
      {showCreateCommunityModal && <CreateCommunityModal onClose={() => setShowCreateCommunityModal(false)} onCreated={(id) => { setShowCreateCommunityModal(false); handleSelectCommunity(id); }} />}
      {showCommunitySettingsModal && selectedCommunityId && <CommunitySettingsModal community={communities.find(c => c.id === selectedCommunityId)!} onClose={() => setShowCommunitySettingsModal(false)} />}
      {showCreateChannelModal && selectedCommunityId && <CreateChannelModal communityId={selectedCommunityId} onClose={() => setShowCreateChannelModal(false)} />}
      {showDiscoverModal && <DiscoverServersModal onClose={() => setShowDiscoverModal(false)} onJoin={(id) => { setShowDiscoverModal(false); handleSelectCommunity(id); }} />}
      {viewingProfileId && <UserProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />}
      {lightboxUrl && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxUrl(null)}><button className="absolute top-4 right-4 text-white hover:text-klaus-red p-2 bg-black/50 rounded-full"><X size={24} /></button><img src={lightboxUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} /></div>}
      <MobileNav />
    </div>
  );
}

// ... AuthScreen, ConfigScreen ...
const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { if (isLogin) await loginWithEmail(email, password); else await registerWithEmail(email, password, displayName); onLogin(); } 
    catch (err: any) { setError(err.message.includes('auth/invalid-credential') ? 'Invalid credentials.' : err.message); } 
    finally { setLoading(false); }
  };
  const handleGoogle = async () => { setError(''); setLoading(true); try { await loginWithGoogle(); onLogin(); } catch (err: any) { setError(err.message); } finally { setLoading(false); } }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
       <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #B30000 25%, #B30000 26%, transparent 27%, transparent 74%, #B30000 75%, #B30000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #B30000 25%, #B30000 26%, transparent 27%, transparent 74%, #B30000 75%, #B30000 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>
       <div className="w-full max-w-md bg-[#0F0F0F] border border-gray-800 p-8 shadow-2xl relative z-10 animate-fade-in">
           <div className="text-center mb-8"><h1 className="text-3xl font-black text-white tracking-tighter mb-2">KLAUS<span className="text-klaus-red">.</span></h1><p className="text-xs text-gray-500 font-mono tracking-widest uppercase">{isLogin ? 'Identity Verification' : 'New Personnel Registration'}</p></div>
           {error && <div className="bg-red-900/20 border border-red-900 p-3 mb-6 text-xs text-red-200 flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>{error}</div>}
           <form onSubmit={handleSubmit} className="space-y-4">
               {!isLogin && <Input placeholder="DISPLAY DESIGNATION" value={displayName} onChange={e => setDisplayName(e.target.value)} required />}
               <Input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)} required />
               <Input type={showPassword ? "text" : "password"} placeholder="ACCESS CODE" value={password} onChange={e => setPassword(e.target.value)} required rightElement={<button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
               <Button type="submit" isLoading={loading} className="w-full mt-4">{isLogin ? 'Authenticate' : 'Initialize Account'}</Button>
           </form>
           <div className="my-6 flex items-center gap-4"><div className="h-px bg-gray-800 flex-1"></div><span className="text-[10px] text-gray-600 uppercase font-bold">Or</span><div className="h-px bg-gray-800 flex-1"></div></div>
           <button onClick={handleGoogle} className="w-full py-3 bg-[#151515] hover:bg-[#202020] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2 group"><span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-110 transition-transform"></span>Sign in with Google</button>
           <div className="mt-8 text-center"><button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-xs text-gray-500 hover:text-white uppercase tracking-wide font-bold transition-colors">{isLogin ? 'Request Clearance (Register)' : 'Return to Login'}</button></div>
       </div>
    </div>
  );
};

const ConfigScreen = ({ onUpdate }: { onUpdate: () => void }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState(firebaseInitializationError);
    const handleUpdate = () => { if (updateFirebaseConfig(key)) onUpdate(); else setError(firebaseInitializationError); };
    return <div className="min-h-screen bg-black flex items-center justify-center p-4"><div className="w-full max-w-md bg-[#0F0F0F] border border-red-900 p-8 text-center"><h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-4">System Error</h2><p className="text-xs text-gray-400 mb-6">{error || "Firebase Initialization Failed"}</p><Input placeholder="ENTER API KEY" value={key} onChange={e => setKey(e.target.value)} className="mb-4" /><Button onClick={handleUpdate}>Re-Initialize System</Button></div></div>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [configError, setConfigError] = useState(!!firebaseInitializationError);

  useEffect(() => { if (configError) return; const unsubscribe = subscribeToAuth((u) => { setUser(u); setLoading(false); }); return unsubscribe; }, [configError]);

  if (configError) return <ConfigScreen onUpdate={() => { setConfigError(false); setLoading(true); }} />;
  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (loading) return <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center"><div className="w-12 h-12 border-2 border-klaus-red border-t-transparent rounded-full animate-spin mb-4"></div><div className="text-klaus-red font-mono text-xs animate-pulse tracking-widest">CONNECTING TO MAINFRAME...</div></div>;
  if (!user) return <AuthScreen onLogin={() => {}} />;
  return <Dashboard user={user} onLogout={logout} />;
}
