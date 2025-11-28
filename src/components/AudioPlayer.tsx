
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';

const AudioPlayer: React.FC<{ language: Language }> = ({ language }) => {
  const t = useTranslation(language);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [playlist, setPlaylist] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [mode, setMode] = useState<AudioMode>(AudioMode.SEQUENTIAL);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // Generate random heights once for visualizer
  const [visualizerHeights] = useState(() => 
    Array.from({ length: 12 }, () => Math.random() * 100)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPlaylist((prev) => [...prev, ...newFiles]);
      
      // If playlist was empty, auto-select the first new track but don't auto-play immediately
      if (currentIndex === -1) {
          setCurrentIndex(0);
      }
    }
  };

  const playTrack = (index: number) => {
      if (index >= 0 && index < playlist.length) {
          setCurrentIndex(index);
          setIsPlaying(true);
      }
  };

  const playNext = () => {
      if (playlist.length === 0) return;

      let nextIndex = 0;
      if (mode === AudioMode.SHUFFLE) {
          // Pick a random index distinct from current if possible
          if (playlist.length > 1) {
              do {
                  nextIndex = Math.floor(Math.random() * playlist.length);
              } while (nextIndex === currentIndex);
          } else {
              nextIndex = 0;
          }
      } else {
          // Sequential
          nextIndex = (currentIndex + 1) % playlist.length;
      }
      playTrack(nextIndex);
  };

  const togglePlay = () => {
    if (playlist.length === 0) return;
    
    // If no track selected but playlist exists, start first
    if (currentIndex === -1) {
        playTrack(0);
        return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMode = () => {
      setMode(mode === AudioMode.SEQUENTIAL ? AudioMode.SHUFFLE : AudioMode.SEQUENTIAL);
  };

  // Sync Audio Element with State
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentIndex >= 0 && playlist[currentIndex] && audioRef.current) {
        const file = playlist[currentIndex];
        const url = URL.createObjectURL(file);
        audioRef.current.src = url;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
        }
        
        return () => {
           // Cleanup URL logic if needed
        };
    }
  }, [currentIndex, playlist, isPlaying]);

  useEffect(() => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.play().catch(() => setIsPlaying(false));
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying]);

  const currentTrackName = currentIndex >= 0 && playlist[currentIndex] ? playlist[currentIndex].name : null;

  return (
    <Panel className="p-4 h-full min-h-[160px]" title={t('AUDIO_MODULE')}>
      <div className="flex flex-col h-full w-full relative">
          <audio 
            ref={audioRef} 
            onEnded={playNext} 
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*" 
            multiple
            className="hidden" 
          />
          
          {/* Main Display Area */}
          <div className="flex-1 min-h-0 flex flex-col justify-center mb-2">
               <div className="flex justify-between items-end border-b border-theme-highlight/30 pb-2 mb-2">
                    <div className="flex flex-col overflow-hidden mr-4">
                        <span className="text-[10px] text-theme-dim uppercase tracking-widest">{t('STATUS')}</span>
                        {currentTrackName ? (
                            <div className="text-sm font-mono text-theme-primary truncate animate-pulse-fast leading-tight mt-1">
                                {isPlaying ? '► ' : '❚❚ '} {currentTrackName}
                            </div>
                        ) : (
                            <div className="text-sm font-mono text-theme-dim uppercase leading-tight mt-1">{t('NO_TRACK')}</div>
                        )}
                    </div>
                    <div className="text-[10px] font-mono text-theme-dim text-right shrink-0">
                        {currentIndex + 1} / {playlist.length}
                    </div>
               </div>

               {/* Visualizer & Controls Row */}
               <div className="flex items-center gap-3">
                    {/* Visualizer Placeholder */}
                    <div className="flex-1 flex items-end justify-between h-8 gap-[2px] opacity-50">
                        {visualizerHeights.map((height, i) => (
                            <div 
                                key={i} 
                                className="w-full bg-theme-primary/50 transition-all duration-100"
                                style={{ height: isPlaying ? `${height}%` : '10%' }}
                            ></div>
                        ))}
                    </div>

                    {/* Show Playlist Button */}
                    <button 
                        onClick={() => setShowPlaylist(true)}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm"
                        title={t('PLAYLIST_BUTTON')}
                    >
                         {/* Material Symbols Light: queue_music */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M15 6H3v2h12zm0 4H3v2h12zM3 16h8v-2H3zM17 6v8.18q-.63-.38-1.33-.58t-1.42-.2q-2.18 0-3.71 1.53T9 18.65q0 2.18 1.53 3.71T14.25 23.9q2.05 0 3.53-1.41t1.47-3.44V8h3V6z"/></svg>
                    </button>

                    {/* Mode Switch */}
                    <button 
                        onClick={toggleMode}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-secondary hover:border-theme-secondary transition-colors rounded-sm flex items-center gap-1"
                        title={mode === AudioMode.SEQUENTIAL ? t('MODE_SEQ') : t('MODE_SHUFFLE')}
                    >
                        {mode === AudioMode.SEQUENTIAL ? (
                             /* Material Symbols Light: repeat */
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M7 22v-3h10v-5.65h2V19H9v3zM17 2v3H7v5.65H5V5h10V2z"/></svg>
                        ) : (
                             /* Material Symbols Light: shuffle */
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M17 22v-3h-3.2l-3.6-4.2l3.6-4.2H17V8l5 3.8zM7 22l-5-4l5-4v3h4.6l1.65 1.95L11.6 22H7M7 2l5 4l-5 4V7H2V5h5z"/></svg>
                        )}
                        <span className="text-[10px] font-mono">{mode === AudioMode.SEQUENTIAL ? t('MODE_SEQ') : t('MODE_SHUFFLE')}</span>
                    </button>
               </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            {/* Add Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0"
                title={t('SELECT_TRACK')}
            >
                {/* Material Symbols Light: add */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
            </button>

            {/* Play/Pause - Shortened fixed width */}
            <button 
                onClick={togglePlay}
                disabled={playlist.length === 0}
                className={`w-14 h-9 flex items-center justify-center border transition-colors rounded-sm ${isPlaying ? 'bg-theme-primary text-black border-theme-primary' : 'border-theme-highlight text-theme-text hover:border-theme-primary'}`}
                title={t('PLAY_PAUSE')}
            >
                {isPlaying ? (
                    /* Material Symbols Light: pause */
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19V5h4v14zm-8 0V5h4v14z"/></svg>
                ) : (
                    /* Material Symbols Light: play_arrow */
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 19V5l11 7z"/></svg>
                )}
            </button>

            {/* Next Track */}
            <button 
                onClick={playNext}
                disabled={playlist.length === 0}
                className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0"
                title={t('NEXT_TRACK')}
            >
                {/* Material Symbols Light: skip_next */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M16 18h2V6h-2zM6 18l8.5-6L6 6z"/></svg>
            </button>

             {/* Volume Bar - Expanded to take remaining space */}
             <div className="flex-1 h-9 flex items-center px-2 border border-theme-highlight/30 rounded-sm bg-black/10">
                  <div className="w-full h-1 bg-theme-highlight/30 relative cursor-pointer group rounded-full overflow-hidden">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className="h-full bg-theme-dim group-hover:bg-theme-primary transition-all relative" 
                        style={{ width: `${volume * 100}%` }}
                      ></div>
                  </div>
            </div>
          </div>

          {/* PLAYLIST POPUP MODAL (Portal to Body) */}
          {showPlaylist && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                  {/* Backdrop Click to Close */}
                  <div className="absolute inset-0" onClick={() => setShowPlaylist(false)}></div>
                  
                  <div className="w-full max-w-md bg-theme-base/95 border border-theme-primary/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[80vh] backdrop-blur-xl z-10" onClick={e => e.stopPropagation()}>
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-4 border-b border-theme-highlight bg-theme-surface/50">
                          <h3 className="font-mono text-sm uppercase text-theme-primary tracking-widest">{t('PLAYLIST_COUNT')}</h3>
                          <button 
                            onClick={() => setShowPlaylist(false)}
                            className="text-theme-dim hover:text-theme-primary p-1"
                          >
                              {/* Material Symbols Light: close */}
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg>
                          </button>
                      </div>
                      
                      {/* List */}
                      <div className="overflow-y-auto p-2 custom-scrollbar flex-1 bg-black/20">
                          {playlist.length === 0 ? (
                              <div className="text-center p-8 text-theme-dim font-mono text-xs">{t('NO_TRACK')}</div>
                          ) : (
                              <ul className="space-y-1">
                                  {playlist.map((file, idx) => (
                                      <li 
                                        key={idx} 
                                        className={`flex items-center p-3 cursor-pointer border border-transparent hover:bg-theme-highlight/20 hover:border-theme-highlight/50 transition-all duration-200 group ${idx === currentIndex ? 'bg-theme-primary/10 border-theme-primary/30' : ''}`}
                                        onClick={() => playTrack(idx)}
                                      >
                                          <div className={`w-8 font-mono text-xs ${idx === currentIndex ? 'text-theme-primary font-bold' : 'text-theme-dim'}`}>
                                              {(idx + 1).toString().padStart(2, '0')}
                                          </div>
                                          <div className={`flex-1 font-mono text-sm truncate ${idx === currentIndex ? 'text-theme-primary' : 'text-theme-text group-hover:text-theme-primary'}`}>
                                              {file.name}
                                          </div>
                                          {idx === currentIndex && isPlaying && (
                                              /* Material Symbols Light: graphic_eq */
                                              <span className="text-xs text-theme-primary animate-pulse ml-2 flex items-center">
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M7 18h2V6H7zm4 4h2V2h-2zm4-4h2V6h-2z"/></svg>
                                              </span>
                                          )}
                                      </li>
                                  ))}
                              </ul>
                          )}
                      </div>
                      
                      {/* Footer Actions */}
                      <div className="p-4 border-t border-theme-highlight bg-theme-surface/50 flex justify-end gap-3">
                           <div className="text-[10px] text-theme-dim self-center mr-auto">
                              {playlist.length} {t('FILES_LOADED')}
                           </div>
                           <button 
                                onClick={() => setPlaylist([])}
                                className="text-xs font-mono px-3 py-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                disabled={playlist.length === 0}
                           >
                               {t('CLEAR')}
                           </button>
                          <button 
                             onClick={() => {
                                 fileInputRef.current?.click();
                             }}
                             className="text-xs font-mono border border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-black px-4 py-1 transition-all uppercase flex items-center gap-1"
                          >
                              {/* Material Symbols Light: add */}
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z"/></svg>
                              {t('ADD_TASK')}
                          </button>
                      </div>
                  </div>
              </div>,
              document.body
          )}
      </div>
    </Panel>
  );
};

export default AudioPlayer;
