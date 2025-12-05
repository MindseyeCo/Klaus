
import React, { useState, useEffect } from 'react';
import { User, ChatRoom, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { Send, Image as ImageIcon, Smile, Sticker, Camera } from 'lucide-react';
import { searchGifs, getTrendingGifs, GifResult } from '../services/giphy';

interface ChatAreaProps {
  activeChatId: string | null;
  activeChat: ChatRoom | undefined;
  user: User;
  messages: Message[];
  text: string;
  setText: (text: string) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowMobileList: (show: boolean) => void; 
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onViewProfile: (uid: string) => void;
  onImageClick: (url: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeChatId,
  activeChat,
  user,
  messages,
  text,
  setText,
  onSend,
  onFileUpload,
  setShowMobileList,
  fileInputRef,
  messagesEndRef,
  onViewProfile,
  onImageClick
}) => {
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [gifSearch, setGifSearch] = useState('');
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Load trending GIFs initially
  useEffect(() => {
      if (showGifPicker && gifs.length === 0) {
          loadGifs();
      }
  }, [showGifPicker]);

  // Debounce search
  useEffect(() => {
      if (!showGifPicker) return;
      const t = setTimeout(() => {
          if(gifSearch.trim()) loadGifs(gifSearch);
          else loadGifs();
      }, 500);
      return () => clearTimeout(t);
  }, [gifSearch]);

  const loadGifs = async (query?: string) => {
      setLoadingGifs(true);
      if(query) {
          const res = await searchGifs(query);
          setGifs(res);
      } else {
          const res = await getTrendingGifs();
          setGifs(res);
      }
      setLoadingGifs(false);
  }

  const handleGifSelect = (gif: GifResult) => {
      setText(gif.url);
      setShowGifPicker(false);
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 h-full w-full bg-[#050505] flex items-center justify-center flex-col text-gray-600 animate-fade-in hidden md:flex">
         <div className="w-24 h-24 border border-gray-800 rounded-full flex items-center justify-center mb-4 relative">
           <div className="absolute inset-0 border border-gray-800 rounded-full animate-ping opacity-20"></div>
           <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-klaus-red font-bold text-2xl">K</span>
           </div>
         </div>
         <p className="uppercase tracking-widest text-xs font-mono">Select a secure channel</p>
      </div>
    );
  }

  let headerName = activeChat?.channelName ? `# ${activeChat.channelName}` : (activeChat?.groupName || 'Unknown');
  let headerStatus = '';
  let isKlaus = false;
  let partnerId = '';
  let photo = '';

  if (activeChat?.communityId) {
      headerStatus = 'Community Channel';
  } else if (activeChat?.isGroup) {
      headerName = activeChat.groupName || 'Group Chat';
      headerStatus = `${activeChat.participants.length} Members`;
  } else {
      const partner = activeChat?.participantDetails.find((u: User) => u.uid !== user.uid) || activeChat?.participantDetails[0];
      headerName = partner?.displayName || 'Unknown';
      headerStatus = partner?.status || (partner?.isOnline ? 'Active Now' : '');
      isKlaus = partner?.uid === 'klaus-ai';
      partnerId = partner?.uid || '';
      photo = partner?.photoURL || '';
  }

  return (
    <div className={`flex-1 flex flex-col h-full bg-[#050505] relative w-full`}>
      {/* Header */}
      <div className="h-16 px-4 md:px-6 border-b border-gray-800 flex items-center justify-between bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowMobileList(true)} className="md:hidden text-gray-400 hover:text-white">
             <div className="flex items-center gap-1 text-xs uppercase font-bold">
               <span className="text-lg">←</span> Back
             </div>
          </button>
          <div 
            className={`flex items-center gap-3 ${(!activeChat?.isGroup && !activeChat?.communityId) ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => (!activeChat?.isGroup && !activeChat?.communityId && partnerId) && onViewProfile(partnerId)}
          >
            {photo && (
                <img 
                    src={photo} 
                    className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-700" 
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(headerName)}&background=B30000&color=fff`;
                    }}
                />
            )}
            <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wide">{headerName}</h2>
                  {isKlaus && <span className="text-[8px] bg-klaus-red text-white px-1 rounded font-bold shadow-[0_0_8px_rgba(179,0,0,0.6)]">AI</span>}
                </div>
                <p className="text-[10px] text-klaus-red font-mono truncate max-w-[150px] md:max-w-xs">{headerStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMe={msg.senderId === user.uid} onImageClick={onImageClick} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0F0F0F] border-t border-gray-800 pb-24 md:pb-4 relative z-20">
         {/* Gif Picker Popover */}
         {showGifPicker && (
             <div className="absolute bottom-full left-4 mb-2 w-72 h-80 bg-[#151515] border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-up z-50">
                 <div className="p-2 border-b border-gray-700">
                     <input 
                       className="w-full bg-[#0A0A0A] text-white text-xs px-2 py-1.5 rounded border border-gray-800 focus:border-klaus-red focus:outline-none"
                       placeholder="Search Tenor..."
                       value={gifSearch}
                       onChange={e => setGifSearch(e.target.value)}
                       autoFocus
                     />
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                     {loadingGifs ? (
                         <div className="col-span-2 flex justify-center py-8"><div className="w-4 h-4 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div></div>
                     ) : (
                         gifs.map(gif => (
                             <img 
                               key={gif.id} 
                               src={gif.preview} 
                               className="w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                               onClick={() => handleGifSelect(gif)}
                             />
                         ))
                     )}
                 </div>
             </div>
         )}

         <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#0A0A0A] p-2 rounded-xl border border-gray-800 focus-within:border-gray-600 transition-colors shadow-lg backdrop-blur-sm">
           <button 
             className="p-2 text-gray-500 hover:text-klaus-red transition-colors rounded-full hover:bg-white/5" 
             onClick={() => fileInputRef.current?.click()}
             title="Upload Image"
           >
             <ImageIcon size={20} />
           </button>
           <input type="file" className="hidden" ref={fileInputRef} onChange={onFileUpload} accept="image/*" />

           {/* Camera Button */}
           <label className="p-2 text-gray-500 hover:text-klaus-red transition-colors rounded-full hover:bg-white/5 cursor-pointer" title="Take Photo">
               <input 
                 type="file" 
                 accept="image/*" 
                 capture="environment" 
                 className="hidden" 
                 onChange={onFileUpload} 
               />
               <Camera size={20} />
           </label>

           <button 
             className={`p-2 transition-colors rounded-full hover:bg-white/5 ${showGifPicker ? 'text-klaus-red' : 'text-gray-500 hover:text-white'}`}
             onClick={() => setShowGifPicker(!showGifPicker)}
             title="GIFs"
           >
             <Sticker size={20} />
           </button>
           
           <div className="flex-1">
             <textarea
               value={text}
               onChange={(e) => setText(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   onSend();
                 }
               }}
               placeholder={`Message...`}
               className="w-full bg-transparent text-white px-2 py-2.5 max-h-32 min-h-[44px] focus:outline-none resize-none text-sm scrollbar-hide"
               rows={1}
             />
           </div>

           <button 
             onClick={onSend}
             disabled={!text.trim()}
             className="p-2 bg-klaus-red text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/30"
           >
             <Send size={18} />
           </button>
         </div>
      </div>
    </div>
  );
};
