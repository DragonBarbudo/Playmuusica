import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { jellyfinService } from '../../services/jellyfin';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react';

export const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
  } = usePlayer();

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleRepeatToggle = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  if (!currentTrack) {
    return null;
  }

  const imageUrl = currentTrack.AlbumPrimaryImageTag
    ? jellyfinService.getImageUrl(currentTrack.AlbumId || currentTrack.Id, 'Primary', currentTrack.AlbumPrimaryImageTag)
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
      <div className="max-w-screen-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Track info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={currentTrack.Album || 'Album cover'}
                className="w-14 h-14 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-white font-medium truncate">
                {currentTrack.Name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {currentTrack.Artists?.join(', ') || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mx-8">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-purple-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={previous}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>

            <button
              onClick={next}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={handleRepeatToggle}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-purple-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(isMuted ? 0 : volume) * 100}%, #374151 ${(isMuted ? 0 : volume) * 100}%, #374151 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
