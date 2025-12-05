
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { updateUserProfile, logout, deleteUserAccount, uploadProfileImage } from '../services/firebase';
import { ArrowLeft, Save, LogOut, Trash2, AlertTriangle, CheckCircle, XCircle, Clock, Music, Camera, Link as LinkIcon, AtSign, Database, Send } from 'lucide-react';

interface SettingsProps {
  user: User;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({ user, onBack }) => {
  const lastKnownUid = useRef(user.uid);
  const initializedRef = useRef(false);

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [status, setStatus] = useState(user.status || '');
  const [statusState, setStatusState] = useState<'online'|'busy'|'offline'>(user.statusState || 'online');
  const [about, setAbout] = useState(user.about || '');
  const [themeSongUrl, setThemeSongUrl] = useState(user.themeSongUrl || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [telegramHandle, setTelegramHandle] = useState(user.telegramHandle || '');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Sync state if props update in background or initial load
    if (user.uid !== lastKnownUid.current) {
        lastKnownUid.current = user.uid;
        setDisplayName(user.displayName || '');
        setStatus(user.status || '');
        setStatusState(user.statusState || 'online');
        setAbout(user.about || '');
        setThemeSongUrl(user.themeSongUrl || '');
        setPhotoURL(user.photoURL || '');
        setTelegramHandle(user.telegramHandle || '');
        initializedRef.current = true;
    } else if (!initializedRef.current && user.displayName) {
        setDisplayName(user.displayName);
        if(user.status) setStatus(user.status);
        if(user.about) setAbout(user.about);
        setPhotoURL(user.photoURL || '');
        setTelegramHandle(user.telegramHandle || '');
        initializedRef.current = true;
    }
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
        setMessage("Display name required.");
        return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      await updateUserProfile(user.uid, {
        displayName,
        photoURL,
        status: status, 
        statusState: statusState, 
        about,
        themeSongUrl,
        telegramHandle: telegramHandle.replace('@', '') // Store without @
      });
      
      setMessage('Profile synchronized.');
      setTimeout(() => onBack(), 500);
    } catch (e: any) {
      console.error(e);
      setMessage(e.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      try {
        const url = await uploadProfileImage(e.target.files[0]);
        setPhotoURL(url);
        setMessage("Image uploaded. Save to persist.");
      } catch (err) {
        console.error(err);
        setMessage("Upload failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setLoading(true);
    try {
      await deleteUserAccount();
    } catch (error) {
      console.error(error);
      setMessage("Termination failed.");
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] animate-in fade-in duration-300 pb-20 md:pb-0">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between bg-[#0F0F0F]">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
             <ArrowLeft size={20} />
           </button>
           <h2 className="text-sm font-bold text-white uppercase tracking-widest">System Configuration</h2>
         </div>
         <Button onClick={handleSave} isLoading={loading} disabled={!displayName.trim()} className="py-2 text-xs">
            <Save size={14} className="mr-2" />
            Save Protocol
         </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-12">
          
          {/* Left Column: Visual Identity */}
          <div className="md:col-span-1 flex flex-col items-center text-center space-y-6">
             <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest w-full text-left border-b border-gray-800 pb-2">Visual Identity</h3>
             
             <div className="relative group">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#1a1a1a] bg-gray-900 shadow-2xl relative">
                   <img 
                      src={photoURL || 'https://via.placeholder.com/150'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=B30000&color=fff`;
                      }}
                   />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                       <button 
                         onClick={() => fileInputRef.current?.click()} 
                         className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
                         title="Upload Image"
                       >
                           <Camera size={20} />
                       </button>
                   </div>
                </div>
                
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleFileChange} 
                />
             </div>
             
             <div className="w-full space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 justify-center">
                   <LinkIcon size={10} /> Secondary Image Source
                </label>
                <input 
                    value={photoURL}
                    onChange={e => setPhotoURL(e.target.value)}
                    placeholder="Paste Image URL"
                    className="w-full bg-[#151515] border border-gray-800 text-[10px] text-gray-300 px-3 py-2 rounded focus:border-klaus-red focus:outline-none text-center"
                />
             </div>

             <div className="flex flex-wrap justify-center gap-2 mt-4">
                 {[
                   { id: 'online', label: 'Online', color: 'bg-green-500', icon: CheckCircle },
                   { id: 'busy', label: 'Busy', color: 'bg-yellow-500', icon: Clock },
                   { id: 'offline', label: 'Offline', color: 'bg-gray-500', icon: XCircle }
                 ].map(st => (
                   <button 
                     key={st.id}
                     onClick={() => setStatusState(st.id as any)}
                     className={`
                       px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border transition-all
                       ${statusState === st.id 
                          ? `border-${st.color.split('-')[1]}-500/50 ${st.color.replace('bg-', 'text-')} bg-white/5` 
                          : 'border-transparent text-gray-500 hover:bg-white/5'}
                     `}
                   >
                     <div className={`w-2 h-2 rounded-full ${st.color}`}></div>
                     {st.label}
                   </button>
                 ))}
             </div>
             
             {/* Multi-DB Status Indicator */}
             <div className="flex items-center gap-2 bg-[#151515] px-3 py-1.5 rounded border border-gray-800 mt-4">
                 <Database size={12} className="text-green-500" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase">Multi-DB Sync: Active</span>
             </div>
          </div>

          {/* Right Column: Personal Data */}
          <div className="md:col-span-2 space-y-8">
             <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest w-full text-left border-b border-gray-800 pb-2">Personal Data</h3>
             
             <div className="space-y-6">
                <Input 
                  label="Display Designation (Public Name)" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="Enter your public designation"
                  error={!displayName.trim() ? "Name required" : undefined}
                />
                
                {user.handle && (
                    <div className="w-full opacity-75">
                         <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Network Handle (Read-only)</label>
                         <div className="w-full bg-[#151515] text-white px-4 py-3 border-l-4 border-klaus-red font-mono text-sm">
                             {user.handle}
                         </div>
                    </div>
                )}
                
                <div className="w-full">
                     <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                         <Send size={12} /> Telegram Handle (Optional)
                     </label>
                     <Input 
                        placeholder="username (without @)"
                        value={telegramHandle}
                        onChange={(e) => setTelegramHandle(e.target.value)}
                        className="font-mono text-sm"
                     />
                </div>

                <Input 
                   label="Current Status Message"
                   value={status}
                   onChange={(e) => setStatus(e.target.value)}
                   placeholder="E.g. In a meeting, designing..."
                />

                <div className="w-full">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Personnel Bio / About
                  </label>
                  <textarea
                    className="w-full bg-klaus-gray border-l-4 border-transparent text-white placeholder-gray-600 px-4 py-3 focus:outline-none focus:border-klaus-red focus:bg-black transition-all duration-300 min-h-[120px] resize-none text-sm"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Brief description of yourself. Visible to all personnel."
                  />
                </div>

                <div className="space-y-2">
                   <Input 
                    label="Theme Song URL (MP3/Audio)" 
                    value={themeSongUrl} 
                    onChange={(e) => setThemeSongUrl(e.target.value)} 
                    placeholder="https://example.com/song.mp3"
                   />
                   {themeSongUrl && (
                    <div className="flex items-center gap-3 bg-[#151515] p-3 rounded border border-gray-800">
                        <div className="w-8 h-8 bg-klaus-red rounded flex items-center justify-center text-white">
                            <Music size={16} />
                        </div>
                        <div className="flex-1">
                            <audio controls src={themeSongUrl} className="h-6 w-full" />
                        </div>
                    </div>
                   )}
                </div>
             </div>

             <div className="flex justify-between items-center pt-8 border-t border-gray-800">
                <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase">
                    <LogOut size={16} /> Logout
                </button>
                {message && <span className={`text-xs ${message.includes('fail') || message.includes('required') ? 'text-red-500' : 'text-green-500'} font-bold animate-pulse`}>{message}</span>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
