
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { getUserProfile, sendFriendRequest, acceptFriendRequest, removeFriend } from '../services/firebase';
import { X, Music, User as UserIcon, Mail, UserPlus, UserCheck, UserMinus, MessageSquare, QrCode, Send } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { KlausTag } from './KlausTag';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Determine relationship status
  const auth = getAuth();
  const myUid = auth.currentUser?.uid;
  const isMe = myUid === userId;

  // Calculate relationship state based on currentUser data
  const isFriend = currentUser?.friends?.includes(userId);
  const hasIncoming = currentUser?.friendRequests?.incoming?.includes(userId);
  const hasOutgoing = currentUser?.friendRequests?.outgoing?.includes(userId);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await getUserProfile(userId);
        setUser(u);
        if(myUid) {
            const me = await getUserProfile(myUid);
            setCurrentUser(me);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, myUid, actionLoading]);

  const getStatusColor = (state: string | undefined) => {
    switch(state) {
      case 'online': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'busy': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSendRequest = async () => {
      setActionLoading(true);
      await sendFriendRequest(userId);
      setActionLoading(false);
  };
  
  const handleAcceptRequest = async () => {
      setActionLoading(true);
      await acceptFriendRequest(userId);
      setActionLoading(false);
  };

  const handleRemoveFriend = async () => {
      setActionLoading(true);
      await removeFriend(userId);
      setActionLoading(false);
  };

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="w-10 h-10 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#0F0F0F] border border-gray-800 relative overflow-hidden shadow-2xl animate-slide-up rounded-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Header Line */}
        <div className="h-1 w-full bg-gradient-to-r from-klaus-red to-red-900"></div>

        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-black/50 p-1 rounded-full transition-colors z-10"
        >
            <X size={20} />
        </button>

        <div className="flex flex-col items-center pt-10 pb-6 relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-[#0F0F0F] to-[#0F0F0F]"></div>

            {/* Avatar */}
            <div className="relative mb-4 z-10 group cursor-pointer" onClick={() => setShowQr(true)}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1a1a1a] shadow-2xl bg-gray-900">
                    <img 
                        src={user.photoURL || 'https://via.placeholder.com/150'} 
                        alt={user.displayName || ''} 
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=B30000&color=fff`;
                        }}
                    />
                </div>
                <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-[#0F0F0F] rounded-full ${getStatusColor(user.statusState)}`}></div>
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <QrCode className="text-white" size={24} />
                </div>
            </div>

            {/* Name & ID */}
            <h2 className="text-2xl font-bold text-white z-10 text-center px-4">{user.displayName}</h2>
            {user.handle && (
                <div className="text-klaus-red text-sm font-bold font-mono mt-1 z-10 px-2 py-0.5 bg-red-900/20 rounded border border-red-900/30">
                    {user.handle}
                </div>
            )}
            <p className="text-gray-600 text-[10px] font-mono mt-1 z-10">{user.email}</p>

            {/* Status Text */}
            {user.status && (
                <div className="mt-4 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-xs text-gray-300 z-10 max-w-[80%] text-center">
                   "{user.status}"
                </div>
            )}
            
            {/* Telegram Link */}
            {user.telegramHandle && (
                <a 
                   href={`https://t.me/${user.telegramHandle}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0088cc] hover:text-white bg-[#0088cc]/10 hover:bg-[#0088cc]/20 px-3 py-1.5 rounded-full transition-colors z-10"
                >
                    <Send size={12} /> @{user.telegramHandle}
                </a>
            )}

            <button 
                onClick={() => setShowQr(true)}
                className="mt-4 flex items-center gap-2 text-[10px] uppercase font-bold text-klaus-red hover:text-white transition-colors z-10"
            >
                <QrCode size={14} /> Reveal Identity Tag
            </button>

            {/* Friend Actions */}
            {!isMe && currentUser && (
                <div className="flex gap-2 mt-4 z-10">
                    {isFriend ? (
                        <button onClick={handleRemoveFriend} disabled={actionLoading} className="px-4 py-2 bg-gray-800 text-red-400 hover:bg-gray-700 rounded text-xs font-bold uppercase flex items-center gap-2">
                            <UserMinus size={16} /> Unfriend
                        </button>
                    ) : hasIncoming ? (
                        <button onClick={handleAcceptRequest} disabled={actionLoading} className="px-4 py-2 bg-klaus-red text-white hover:bg-red-800 rounded text-xs font-bold uppercase flex items-center gap-2">
                            <UserCheck size={16} /> Accept
                        </button>
                    ) : hasOutgoing ? (
                        <button disabled className="px-4 py-2 bg-gray-800 text-gray-400 rounded text-xs font-bold uppercase flex items-center gap-2">
                            <UserPlus size={16} /> Pending
                        </button>
                    ) : (
                        <button onClick={handleSendRequest} disabled={actionLoading} className="px-4 py-2 bg-[#151515] hover:bg-[#202020] border border-gray-700 text-white rounded text-xs font-bold uppercase flex items-center gap-2">
                            <UserPlus size={16} /> Add Friend
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Details Section */}
        <div className="px-8 pb-8 space-y-6">
            
            {/* About */}
            {user.about && (
                <div className="space-y-2">
                    <h3 className="text-klaus-red text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <UserIcon size={12} /> Personnel Bio
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-[#151515] p-4 rounded border-l-2 border-gray-700 max-h-40 overflow-y-auto">
                        {user.about}
                    </p>
                </div>
            )}

            {/* Theme Song */}
            {user.themeSongUrl && (
                <div className="space-y-2">
                    <h3 className="text-klaus-red text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Music size={12} /> Audio Signature
                    </h3>
                    <div className="bg-[#151515] p-3 rounded border border-gray-800 flex items-center justify-center">
                        <audio controls src={user.themeSongUrl} className="w-full h-8" />
                    </div>
                </div>
            )}
            
            {!user.about && !user.themeSongUrl && (
                <div className="text-center py-4 text-gray-600 text-xs italic">
                    No additional data available for this personnel.
                </div>
            )}
        </div>

        {/* Footer ID */}
        <div className="px-6 py-3 bg-[#050505] border-t border-gray-800 text-center">
            <span className="text-[9px] text-gray-600 font-mono uppercase">UID: {user.uid}</span>
        </div>
      </div>
    </div>
    {showQr && user && <KlausTag user={user} onClose={() => setShowQr(false)} />}
    </>
  );
};
