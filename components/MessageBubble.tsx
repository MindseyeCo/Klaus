
import React from 'react';
import { Message } from '../types';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onImageClick?: (url: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, onImageClick }) => {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImageUrl = (text: string) => {
      // Regex checks for standard image extensions or common GIF domains in the entire string if it's just a URL
      // Or if the string matches a URL pattern completely and ends with image extension
      const urlPattern = /^(https?:\/\/[^\s]+)$/i;
      const imageExtPattern = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i;
      const commonHosts = /tenor\.com|giphy\.com|imgur\.com/i;
      
      if (!urlPattern.test(text)) return false;
      return imageExtPattern.test(text) || commonHosts.test(text);
  };

  const renderContent = () => {
    if (message.type === 'image' && message.mediaUrl) {
      return (
        <div className="rounded overflow-hidden mb-1 border border-black/20 group cursor-pointer" onClick={() => onImageClick?.(message.mediaUrl!)}>
          <img src={message.mediaUrl} alt="attachment" className="w-full h-auto max-h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      );
    }

    if (message.type === 'text') {
        if (isImageUrl(message.text)) {
            return (
                <div className="rounded overflow-hidden mb-1 border border-black/20 group cursor-pointer" onClick={() => onImageClick?.(message.text)}>
                    <img src={message.text} alt="content" className="w-full h-auto max-h-64 object-contain group-hover:scale-105 transition-transform duration-300" />
                </div>
            );
        }
        
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>;
    }
    
    if (message.type === 'audio' && message.mediaUrl) {
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <audio controls src={message.mediaUrl} className="h-8 w-full" />
          </div>
        );
    }
    
    return <p className="text-sm text-gray-500 italic">Unsupported media type</p>;
  };

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[85%] md:max-w-[70%] relative p-3
          ${isMe ? 'bg-klaus-red text-white' : 'bg-klaus-gray text-gray-100'}
          ${isMe ? 'rounded-l-lg rounded-tr-none rounded-br-lg' : 'rounded-r-lg rounded-tl-none rounded-bl-lg'}
        `}
      >
        {/* Sender Name in Group Chats (if not me) */}
        {!isMe && (
          <p className="text-xs text-klaus-red font-bold uppercase tracking-wider mb-1">
            {message.senderName}
          </p>
        )}

        {renderContent()}

        {/* Metadata */}
        <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
          <span className="text-[10px] uppercase font-mono">{formatTime(message.createdAt)}</span>
          {isMe && (
            <span>
              {message.readBy.length > 1 ? (
                <CheckCheck size={12} className="text-white" />
              ) : (
                <Check size={12} />
              )}
            </span>
          )}
        </div>

        {/* Decorative corner for industrial look */}
        <div 
          className={`absolute top-0 w-2 h-2 border-t border-white/20 
          ${isMe ? 'right-0 border-r' : 'left-0 border-l'}`} 
        />
      </div>
    </div>
  );
};
