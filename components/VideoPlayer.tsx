
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, Settings, Repeat, Download, AlertTriangle, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  isActive?: boolean; // New prop to control playback externally
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, autoplay = false, isActive = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState(false);
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle Autoplay and Active State
  useEffect(() => {
    if (videoRef.current) {
        if (isActive) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => setPlaying(true)).catch(e => {
                    console.warn("Autoplay blocked", e);
                    setPlaying(false);
                });
            }
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    }
  }, [isActive]);

  // Initial Autoplay check if standalone
  useEffect(() => {
    if (autoplay && !isActive && videoRef.current) {
        // If autoplay is true but isActive prop isn't used (legacy usage), try to play
        // But if isActive is passed (even as false), the previous effect handles it.
        // This effect acts as a fallback for components not using isActive
    }
  }, [autoplay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setMuted(vol === 0);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };
  
  const handleDownload = () => {
      const link = document.createElement('a');
      link.href = src;
      link.target = '_blank';
      link.download = 'nexus_video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const openSource = () => {
      window.open(src, '_blank');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
        if (playing) setShowControls(false);
    }, 3000);
  };

  if (error) {
      return (
          <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center border border-gray-800">
               <AlertTriangle size={32} className="text-gray-500 mb-2" />
               <p className="text-gray-500 text-xs font-mono">Format Incompatible or Blocked</p>
               <div className="flex gap-2 mt-4">
                 <button onClick={handleDownload} className="px-4 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700">
                     Force Download
                 </button>
                 <button onClick={openSource} className="px-4 py-2 bg-klaus-red text-white text-xs rounded hover:bg-red-800 flex items-center gap-2">
                     <ExternalLink size={12} /> Open Source
                 </button>
               </div>
          </div>
      );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-black overflow-hidden select-none ${cinemaMode && !fullscreen ? 'fixed inset-0 z-50' : 'relative w-full aspect-video'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
        loop={loop}
        playsInline
      />

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Progress Bar */}
        <div className="group/progress relative h-1 bg-gray-700 cursor-pointer mb-4 hover:h-2 transition-all">
           <div 
              className="absolute top-0 left-0 h-full bg-klaus-red transition-all" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
           />
           <input 
              type="range" 
              min={0} 
              max={duration} 
              value={currentTime} 
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
           />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-klaus-red transition-colors">
                    {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>
                
                <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="text-gray-300 hover:text-white">
                        {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input 
                        type="range" 
                        min={0} max={1} step={0.1} 
                        value={muted ? 0 : volume} 
                        onChange={handleVolumeChange}
                        className="w-0 overflow-hidden group-hover/vol:w-20 transition-all h-1 bg-gray-600 accent-klaus-red"
                    />
                </div>

                <div className="text-xs font-mono text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Loop */}
                <button onClick={() => setLoop(!loop)} className={`${loop ? 'text-klaus-red' : 'text-gray-400'} hover:text-white transition-colors`}>
                    <Repeat size={18} />
                </button>
                
                {/* Download */}
                <button onClick={handleDownload} className="text-gray-400 hover:text-white transition-colors" title="Download Source">
                    <Download size={18} />
                </button>

                {/* Settings Dropdown */}
                <div className="relative">
                    <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-white transition-colors">
                        <Settings size={18} className={showSettings ? 'rotate-90 transition-transform' : ''} />
                    </button>
                    {showSettings && (
                        <div className="absolute bottom-8 right-0 bg-[#151515] border border-gray-800 rounded shadow-xl p-2 min-w-[120px] animate-slide-up">
                            <div className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-2">Playback Speed</div>
                            {[0.5, 1, 1.5, 2].map(rate => (
                                <button 
                                    key={rate}
                                    onClick={() => changeSpeed(rate)}
                                    className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-800 rounded ${playbackRate === rate ? 'text-klaus-red font-bold' : 'text-gray-300'}`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cinema Mode */}
                <button onClick={() => setCinemaMode(!cinemaMode)} className="text-gray-400 hover:text-white hidden md:block" title="Cinema Mode">
                   <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                       <div className="w-2 h-1 bg-current"></div>
                   </div>
                </button>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white hover:text-klaus-red">
                    {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
