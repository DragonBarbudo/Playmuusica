import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { jellyfinService } from '../services/jellyfin';
import type { JellyfinItem } from '../types/jellyfin';

interface PlayerContextType {
  currentTrack: JellyfinItem | null;
  queue: JellyfinItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  play: (track?: JellyfinItem) => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
  addToQueue: (track: JellyfinItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueue: (tracks: JellyfinItem[], startIndex?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<JellyfinItem | null>(null);
  const [queue, setQueue] = useState<JellyfinItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('durationchange', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', handleTrackEnd);

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.remove();
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const streamUrl = jellyfinService.getStreamUrl(currentTrack.Id);
      audioRef.current.src = streamUrl;

      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }

      // Report playback start to Jellyfin
      jellyfinService.reportPlaybackStart(currentTrack.Id, 0).catch(console.error);
    }
  }, [currentTrack]);

  // Report playback progress periodically
  useEffect(() => {
    if (!currentTrack || !isPlaying) return;

    const interval = setInterval(() => {
      const positionTicks = Math.floor(currentTime * 10000000);
      jellyfinService
        .reportPlaybackProgress(currentTrack.Id, positionTicks, !isPlaying)
        .catch(console.error);
    }, 10000); // Report every 10 seconds

    return () => clearInterval(interval);
  }, [currentTrack, currentTime, isPlaying]);

  const handleTrackEnd = () => {
    if (!currentTrack) return;

    // Report playback stopped
    const positionTicks = Math.floor(duration * 10000000);
    jellyfinService.reportPlaybackStopped(currentTrack.Id, positionTicks).catch(console.error);

    // Handle repeat modes
    if (repeatMode === 'one') {
      play(currentTrack);
      return;
    }

    if (repeatMode === 'all' && currentQueueIndex === queue.length - 1) {
      setCurrentQueueIndex(0);
      setCurrentTrack(queue[0]);
      return;
    }

    // Play next track if available
    if (currentQueueIndex < queue.length - 1) {
      next();
    } else {
      setIsPlaying(false);
    }
  };

  const play = (track?: JellyfinItem) => {
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
    } else if (audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const next = () => {
    if (queue.length === 0) return;

    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
    } else if (repeatMode === 'all') {
      setCurrentQueueIndex(0);
      setCurrentTrack(queue[0]);
    }
  };

  const previous = () => {
    if (currentTime > 3) {
      // If more than 3 seconds have passed, restart current track
      seek(0);
    } else if (queue.length > 0 && currentQueueIndex > 0) {
      const prevIndex = currentQueueIndex - 1;
      setCurrentQueueIndex(prevIndex);
      setCurrentTrack(queue[prevIndex]);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    // TODO: Implement queue shuffling logic
  };

  const addToQueue = (track: JellyfinItem) => {
    setQueue([...queue, track]);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);

    if (index < currentQueueIndex) {
      setCurrentQueueIndex(currentQueueIndex - 1);
    } else if (index === currentQueueIndex) {
      // If removing current track, play next one
      if (newQueue.length > 0) {
        setCurrentTrack(newQueue[Math.min(currentQueueIndex, newQueue.length - 1)]);
      } else {
        setCurrentTrack(null);
        pause();
      }
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentQueueIndex(0);
    setCurrentTrack(null);
    pause();
  };

  const playQueue = (tracks: JellyfinItem[], startIndex = 0) => {
    setQueue(tracks);
    setCurrentQueueIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
  };

  const value: PlayerContextType = {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playQueue,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
