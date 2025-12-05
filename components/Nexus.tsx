
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNexusPosts, fetchNexusCollections, getRandomNexusContent } from '../services/nexus';
import { NexusPost, NexusCollection, NexusSearchFilters, ChatRoom } from '../types';
import { NexusSplash } from './NexusSplash';
import { getLocalKeepsakes, exportCollections, importCollections, checkKeepsakeExists, saveLocalKeepsake, removeLocalKeepsake } from '../services/keepsakes';
import { VideoPlayer } from './VideoPlayer';
import { Search, RefreshCcw, Bookmark, Share2, Heart, Film, List, BookOpen, Download, Upload, Dice5, ArrowLeft, Send } from 'lucide-react';

// --- TYPES ---
interface NexusProps {
  onBack?: () => void;
  chats?: ChatRoom[];
  onShareToChat?: (chatId: string, text: string) => void;
  sidebarFilters?: NexusSearchFilters;
}

// --- SUB-COMPONENTS ---

const NexusFeedItem = React.memo(({ post, onClick }: { post: NexusPost, onClick: (p: NexusPost) => void }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = post.description.length > 180;
    
    return (
        <div onClick={() => onClick(post)} className="w-full bg-[#151515] border border-gray-800 rounded-lg p-3 sm:p-4 mb-3 cursor-pointer hover:border-gray-600 transition-colors flex flex-col sm:flex-row gap-3 min-w-0">
            <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=333&color=fff`} 
                className="w-10 h-10 rounded-full bg-gray-700 shrink-0 self-start" 
                loading="lazy"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">{post.author}</span>
                    <span className="text-gray-500 text-xs truncate">@{post.source.replace(/\s/g, '').toLowerCase()}</span>
                    <span className="text-gray-600 text-[10px] ml-auto shrink-0">{post.year}</span>
                </div>
                
                <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap break-words leading-relaxed min-w-0">
                    {expanded ? post.description : post.description.substring(0, 180)}
                    {isLong && !expanded && '...'}
                </p>
                
                {isLong && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="text-[10px] text-klaus-red font-bold uppercase mb-2 hover:underline"
                    >
                        {expanded ? 'Show Less' : 'Show More'}
                    </button>
                )}

                {post.thumbnailUrl && post.mediaType === 'image' && (
                    <div className="rounded-lg overflow-hidden border border-gray-800 bg-black mt-2 w-full max-w-md">
                        <img src={post.thumbnailUrl} className="w-full h-auto object-contain max-h-[400px]" loading="lazy" />
                    </div>
                )}

                <div className="flex items-center gap-6 mt-3 text-gray-500 text-xs">
                     <button className="flex items-center gap-1 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                         <Heart size={14} /> {post.likes}
                     </button>
                     <button className="flex items-center gap-1 hover:text-blue-500 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                         <Share2 size={14} /> Share
                     </button>
                     <SaveButton post={post} />
                </div>
            </div>
        </div>
    );
});

const SaveButton = ({ post }: { post: NexusPost }) => {
    const [saved, setSaved] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        checkKeepsakeExists(post.id).then(setSaved);
    }, [post]);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setAnimating(true);
        if (saved) {
            await removeLocalKeepsake(post.id);
            setSaved(false);
        } else {
            await saveLocalKeepsake(post);
            setSaved(true);
        }
        setTimeout(() => setAnimating(false), 300);
    };

    return (
        <button 
            onClick={handleSave} 
            className={`flex items-center gap-1 transition-all ${saved ? 'text-klaus-red' : 'hover:text-white'} ${animating ? 'animate-pop-scale' : ''}`}
        >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            {saved ? 'Saved' : 'Save'}
        </button>
    );
};

const NexusReelItem = React.memo(({ post, isActive, onClick }: { post: NexusPost, isActive: boolean, onClick: (p: NexusPost) => void }) => {
    const [lastTap, setLastTap] = useState(0);
    const [heartVisible, setHeartVisible] = useState(false);

    const handleTap = () => {
        const now = Date.now();
        if (now - lastTap < 300) {
            // Double Tap
            setHeartVisible(true);
            setTimeout(() => setHeartVisible(false), 800);
        }
        setLastTap(now);
    };

    return (
        <div className="w-full h-full snap-center relative bg-black flex items-center justify-center overflow-hidden" onClick={handleTap}>
            <div className="w-full h-full relative">
                 {/* Adaptive video container: Cover on mobile, Contain/Centered on desktop */}
                 {isActive ? (
                     <VideoPlayer 
                        src={post.videoUrl} 
                        poster={post.thumbnailUrl} 
                        autoplay={true}
                        isActive={isActive}
                     />
                 ) : (
                     <img src={post.thumbnailUrl} className="w-full h-full object-cover opacity-50" />
                 )}
                 
                 {/* Double Tap Heart */}
                 {heartVisible && (
                     <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none animate-pop-scale">
                         <Heart size={80} className="text-white fill-white drop-shadow-lg" />
                     </div>
                 )}

                 {/* Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />
                 
                 <div className="absolute bottom-24 left-4 right-16 z-20 text-left pointer-events-auto">
                     <h3 className="text-white font-bold text-lg drop-shadow-md leading-tight mb-1 line-clamp-2">{post.title}</h3>
                     <p className="text-gray-300 text-xs line-clamp-2 drop-shadow-md mb-2">{post.description}</p>
                     <div className="flex items-center gap-2 text-[10px] text-klaus-red font-mono uppercase bg-black/50 px-2 py-1 rounded w-fit">
                         <Film size={10} /> {post.source}
                     </div>
                 </div>

                 <div className="absolute bottom-24 right-2 z-30 flex flex-col gap-4 items-center pointer-events-auto">
                     <button onClick={() => onClick(post)} className="w-10 h-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center backdrop-blur shadow-lg border border-white/10">
                         <Share2 size={18} />
                     </button>
                     <SaveButtonMobile post={post} />
                     <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                         <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}`} />
                     </div>
                 </div>
            </div>
        </div>
    );
});

const SaveButtonMobile = ({ post }: { post: NexusPost }) => {
    const [saved, setSaved] = useState(false);
    useEffect(() => { checkKeepsakeExists(post.id).then(setSaved); }, [post]);
    const toggle = async () => {
        if(saved) await removeLocalKeepsake(post.id); else await saveLocalKeepsake(post);
        setSaved(!saved);
    }
    return (
        <button onClick={toggle} className="w-10 h-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center backdrop-blur shadow-lg border border-white/10">
            <Bookmark size={18} fill={saved ? "white" : "none"} className={saved ? "text-klaus-red" : "text-white"} />
        </button>
    )
}

const NexusLibraryItem = React.memo(({ post, onClick }: { post: NexusPost, onClick: (p: NexusPost) => void }) => {
    return (
        <div onClick={() => onClick(post)} className="group relative bg-[#151515] border border-gray-800 rounded overflow-hidden aspect-[3/4] cursor-pointer hover:border-klaus-red transition-all">
            <img src={post.thumbnailUrl} className="w-full h-full object-cover" loading="lazy" onError={(e) => (e.target as HTMLImageElement).src='https://via.placeholder.com/300x400?text=Doc'} />
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                <BookOpen className="text-klaus-red mb-2" size={24} />
                <h4 className="text-white text-xs font-bold line-clamp-3">{post.title}</h4>
                <span className="text-[10px] text-gray-500 mt-1">{post.year}</span>
            </div>
        </div>
    );
});

// --- MAIN COMPONENT ---

export const Nexus: React.FC<NexusProps> = ({ onBack, chats, onShareToChat, sidebarFilters }) => {
    const [mode, setMode] = useState<'feed' | 'klips' | 'library' | 'collections'>('feed');
    const [posts, setPosts] = useState<NexusPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleReelId, setVisibleReelId] = useState<string | null>(null);
    const [detailPost, setDetailPost] = useState<NexusPost | null>(null);
    const [klausiconActive, setKlausiconActive] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const reelsContainerRef = useRef<HTMLDivElement>(null);
    const loadingMoreRef = useRef(false);

    // Check Splash
    useEffect(() => {
        const seen = localStorage.getItem('nexus_intro_seen');
        if (!seen) setShowSplash(true);
    }, []);

    // Reset on mode change
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        loadContent(1, true);
    }, [mode, sidebarFilters]);

    // Reels Intersection Observer for Active Video
    useEffect(() => {
        if (mode !== 'klips') return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-id');
                    if(id) setVisibleReelId(id);
                }
            });
        }, { threshold: 0.6 });

        const els = reelsContainerRef.current?.querySelectorAll('.snap-center');
        els?.forEach(el => observer.observe(el));
        
        return () => observer.disconnect();
    }, [posts, mode]);

    // Infinite Scroll Listener for Klips
    const handleScroll = useCallback(() => {
        if (mode !== 'klips' || !reelsContainerRef.current || loadingMoreRef.current || !hasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = reelsContainerRef.current;
        // If we are close to bottom (within 2 viewports)
        if (scrollTop + clientHeight >= scrollHeight - (clientHeight * 2)) {
            loadMore();
        }
    }, [mode, hasMore]);

    const loadMore = async () => {
        if (loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        await loadContent(page + 1);
        setPage(prev => prev + 1);
        loadingMoreRef.current = false;
    };

    const loadContent = async (pageNum: number, reset = false) => {
        if (reset) setLoading(true);
        try {
            if (mode === 'collections') {
                const items = await getLocalKeepsakes();
                setPosts(items);
                setHasMore(false);
            } else {
                const limit = mode === 'feed' ? 30 : 10;
                const data = await fetchNexusPosts(searchQuery, sidebarFilters, limit, mode as any, pageNum);
                
                if (data.length === 0) setHasMore(false);
                
                setPosts(prev => {
                    if (reset) return data;
                    // Filter duplicates
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPosts = data.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newPosts];
                });
            }
        } catch (e) {
            console.error("Nexus Load Error", e);
        } finally {
            if (reset) setLoading(false);
        }
    };

    const handleKlausicon = async () => {
        setKlausiconActive(true);
        setTimeout(async () => {
            const randomPost = await getRandomNexusContent();
            setKlausiconActive(false);
            if (randomPost) setDetailPost(randomPost);
            else alert("Klausicon failed to retrieve signal.");
        }, 1500); 
    };

    if (showSplash) {
        return <NexusSplash onComplete={() => setShowSplash(false)} />;
    }

    if (klausiconActive) {
        return (
            <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
                <div className="w-24 h-24 border-4 border-klaus-red rounded-full animate-spin flex items-center justify-center mb-6">
                    <Dice5 size={48} className="text-white animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest animate-pulse">Klausicon</h2>
                <p className="text-xs text-gray-500 font-mono mt-2">REROUTING RANDOM SIGNAL...</p>
                <div className="mt-8 text-[10px] text-klaus-red font-bold">K.C. ♡</div>
            </div>
        );
    }

    if (detailPost) {
        return <NexusDetail post={detailPost} onBack={() => setDetailPost(null)} />;
    }

    return (
        <div className="flex flex-col h-full bg-[#050505] relative w-full overflow-hidden">
            
            {/* Header */}
            <div className="h-14 bg-[#0F0F0F] border-b border-gray-800 flex items-center px-4 justify-between shrink-0 z-50 relative shadow-md">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-klaus-red rounded-full animate-pulse" />
                    <span className="font-bold text-white tracking-widest uppercase text-sm">Nexus</span>
                </div>
                
                <div className="flex-1 max-w-md mx-4">
                    <div className="relative">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') { setPage(1); loadContent(1, true); } }}
                            placeholder="SEARCH DATABASE..."
                            className="w-full bg-[#151515] border border-gray-700 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:border-klaus-red focus:outline-none uppercase transition-all"
                        />
                        <Search className="absolute left-3 top-1.5 text-gray-500" size={14} />
                    </div>
                </div>

                <button 
                    onClick={handleKlausicon}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-black border border-red-500 flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_10px_#B30000]"
                    title="Roll Klausicon"
                >
                    <Dice5 size={16} className="text-white" />
                </button>
            </div>

            {/* Tabs - Sticky for both Mobile and Desktop */}
            <div className="sticky top-0 z-[40] flex justify-center py-2 bg-[#050505]/95 backdrop-blur-sm border-b border-gray-800/50 shrink-0">
                <div className="flex bg-black/80 md:bg-[#1a1a1a] p-1 rounded-full border border-gray-700/50 shadow-2xl">
                    {['feed', 'klips', 'library', 'collections'].map((m) => (
                        <button 
                            key={m}
                            onClick={() => setMode(m as any)}
                            className={`relative px-4 py-2 text-[10px] font-bold uppercase rounded-full transition-all flex items-center gap-1.5 overflow-hidden ${mode === m ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {mode === m && (
                                <div className="absolute inset-0 bg-klaus-red rounded-full -z-10 animate-fade-scale"></div>
                            )}
                            {m === 'feed' && <List size={12} />}
                            {m === 'klips' && <Film size={12} />}
                            {m === 'library' && <BookOpen size={12} />}
                            {m === 'collections' && <Bookmark size={12} />}
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-[#050505] relative scrollbar-hide">
                {loading && <div className="p-8 text-center text-xs text-gray-500 animate-pulse font-mono mt-10">RETRIEVING DATA PACKETS...</div>}
                
                {/* FEED VIEW */}
                {!loading && mode === 'feed' && (
                    <div className="max-w-xl mx-auto py-4 px-2 pb-24">
                        {posts.map(p => <NexusFeedItem key={p.id} post={p} onClick={setDetailPost} />)}
                        {posts.length === 0 && <EmptyState />}
                        <div className="h-10 text-center text-[10px] text-gray-600 py-4 uppercase font-bold">
                            {hasMore ? (
                                <button onClick={() => { setPage(p => p+1); loadContent(page+1); }} className="px-4 py-2 bg-[#151515] border border-gray-800 rounded hover:bg-[#202020] transition-colors">Load More Intel</button>
                            ) : "End of Stream"}
                        </div>
                    </div>
                )}

                {/* KLIPS VIEW (Reels) */}
                {!loading && mode === 'klips' && (
                    <div 
                        ref={reelsContainerRef} 
                        onScroll={handleScroll}
                        className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black"
                    >
                         {posts.map((p, idx) => (
                             <div key={p.id} data-id={p.id} className="snap-center w-full h-full">
                                 <NexusReelItem post={p} isActive={p.id === visibleReelId} onClick={setDetailPost} />
                             </div>
                         ))}
                         {posts.length === 0 && <EmptyState />}
                         {hasMore && <div className="h-20 flex items-center justify-center snap-center"><div className="w-6 h-6 border-2 border-klaus-red border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                )}

                {/* LIBRARY VIEW */}
                {!loading && mode === 'library' && (
                    <div className="max-w-5xl mx-auto p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-24">
                        {posts.map(p => <NexusLibraryItem key={p.id} post={p} onClick={setDetailPost} />)}
                        {posts.length === 0 && <EmptyState />}
                        <div className="col-span-full text-center py-4">
                             {hasMore && (
                                <button onClick={() => { setPage(p => p+1); loadContent(page+1); }} className="px-4 py-2 bg-[#151515] border border-gray-800 rounded hover:bg-[#202020] text-[10px] font-bold uppercase transition-colors">Expand Archive</button>
                            )}
                        </div>
                    </div>
                )}

                {/* COLLECTIONS VIEW */}
                {!loading && mode === 'collections' && (
                    <div className="pt-4">
                        <NexusCollectionsView posts={posts} refresh={() => loadContent(1, true)} onPostClick={setDetailPost} />
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <RefreshCcw size={32} className="mb-4 text-gray-600" />
        <p className="text-xs text-gray-500 uppercase tracking-widest">Signal Lost / Empty</p>
    </div>
);

const NexusCollectionsView = ({ posts, refresh, onPostClick }: { posts: NexusPost[], refresh: () => void, onPostClick: (p: NexusPost) => void }) => {
    const handleExport = async () => {
        const json = await exportCollections();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `klaus_collection_${Date.now()}.json`;
        a.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
            const count = await importCollections(text);
            alert(`Imported ${count} items successfully.`);
            refresh();
        } catch (err) {
            alert("Import failed. Corrupt file.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="flex justify-between items-center mb-6 bg-[#151515] p-4 rounded border border-gray-800">
                <div>
                    <h2 className="text-white font-bold text-sm uppercase">My Collections</h2>
                    <p className="text-gray-500 text-[10px]">IndexedDB Storage • {posts.length} Items</p>
                </div>
                <div className="flex gap-2">
                    <label className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-bold uppercase cursor-pointer flex items-center gap-2">
                        <Upload size={14} /> Import
                        <input type="file" className="hidden" onChange={handleImport} accept=".json" />
                    </label>
                    <button onClick={handleExport} className="bg-klaus-red hover:bg-red-800 text-white px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2">
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {posts.map(p => (
                    <div key={p.id} onClick={() => onPostClick(p)} className="bg-[#151515] border border-gray-800 p-3 rounded flex gap-3 cursor-pointer hover:bg-[#1a1a1a]">
                        <img src={p.thumbnailUrl} className="w-16 h-16 object-cover bg-black rounded" />
                        <div className="flex-1 min-w-0">
                             <h4 className="text-white font-bold text-xs truncate">{p.title}</h4>
                             <p className="text-gray-500 text-[10px] truncate">{p.author}</p>
                             <span className="text-[9px] text-klaus-red uppercase font-mono mt-1 inline-block border border-red-900/50 px-1 rounded">{p.mediaType}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NexusDetail = ({ post, onBack }: { post: NexusPost, onBack: () => void }) => {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        checkKeepsakeExists(post.id).then(setSaved);
    }, [post]);

    const toggleSave = async () => {
        if (saved) {
            await removeLocalKeepsake(post.id);
            setSaved(false);
        } else {
            await saveLocalKeepsake(post);
            setSaved(true);
        }
    };
    
    const handleTelegramShare = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(post.externalLink || '')}&text=${encodeURIComponent(post.title)}`, '_blank');
    }

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col animate-slide-in-right">
            <div className="h-14 bg-[#0F0F0F] border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
                <button onClick={onBack} className="text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
                <h2 className="font-bold text-white text-sm uppercase truncate flex-1">{post.title}</h2>
                <button onClick={handleTelegramShare} className="text-[#0088cc] hover:text-white transition-colors mr-2">
                    <Send size={20} />
                </button>
                <button onClick={toggleSave} className={`${saved ? 'text-klaus-red' : 'text-gray-500'} hover:scale-110 transition-transform`}>
                    <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                 <div className="w-full bg-black aspect-video flex items-center justify-center relative">
                     {post.mediaType === 'video' ? (
                         <VideoPlayer src={post.videoUrl} poster={post.thumbnailUrl} autoplay />
                     ) : (
                         <img src={post.thumbnailUrl} className={`max-h-full max-w-full object-contain ${post.mediaType === 'book' ? 'w-1/2 shadow-2xl' : ''}`} />
                     )}
                 </div>
                 <div className="p-6">
                     <div className="flex gap-4 text-xs font-mono text-gray-500 border-b border-gray-800 pb-4 mb-4">
                         <span>{post.year}</span>
                         <span>{post.source}</span>
                         <span>{post.mediaType.toUpperCase()}</span>
                     </div>
                     <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.fullText || post.description}</p>
                 </div>
                 
                 <div className="p-8 text-center opacity-30">
                     <div className="text-[10px] text-klaus-red font-bold uppercase tracking-[0.5em]">K.C. ♡</div>
                 </div>
            </div>
        </div>
    );
};
