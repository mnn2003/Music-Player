import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Song } from '../types';
import { useTheme } from '../context/ThemeContext';
import { songs as tracks } from '../musicData';

interface PlayerProps {
  song: Song | null;
}

const Player: React.FC<PlayerProps> = ({ song }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isDarkMode } = useTheme();
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [isRepeatActive, setIsRepeatActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (song && audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentSong(song);
      setCurrentSongIndex(tracks.findIndex((t) => t.id === song.id));

      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
    }
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateCurrentTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
    };
    audio?.addEventListener('timeupdate', updateCurrentTime);
    return () => {
      audio?.removeEventListener('timeupdate', updateCurrentTime);
    };
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${formattedSeconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleShuffle = () => {
    if (audioRef.current && currentSong) {
      if (isShuffleActive) {
        const originalIndex = tracks.findIndex(t => t.id === currentSong.id);
        setCurrentSongIndex(originalIndex);
        setCurrentSong(tracks[originalIndex]);
        audioRef.current.src = tracks[originalIndex].audioUrl;
        audioRef.current.currentTime = currentTime;
        if (isPlaying) {
          audioRef.current.play();
        }
        setIsShuffleActive(false);
      } else {
        audioRef.current.pause();
        const shuffledTracks = [...tracks.filter(t => t.id !== currentSong.id)].sort(() => Math.random() - 0.5);
        const randomIndex = Math.floor(Math.random() * (shuffledTracks.length + 1));
        shuffledTracks.splice(randomIndex, 0, currentSong);
        const shuffledIndex = shuffledTracks.findIndex(t => t.id === currentSong.id);
        setCurrentSongIndex(shuffledIndex);
        setCurrentSong(shuffledTracks[shuffledIndex]);
        audioRef.current.src = shuffledTracks[shuffledIndex].audioUrl;
        audioRef.current.currentTime = currentTime;
        if (isPlaying) {
          audioRef.current.play();
        }
        setIsShuffleActive(true);
      }
    }
  };

  const handleRepeat = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop;
      setIsRepeatActive(audioRef.current.loop);
    }
  };

  const handleNext = () => {
    if (audioRef.current) {
      const newIndex = (currentSongIndex + 1) % tracks.length;
      setCurrentSong(tracks[newIndex]);
      setCurrentSongIndex(newIndex);
      audioRef.current.src = tracks[newIndex].audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    if (audioRef.current && currentTime > 5) {
      audioRef.current.currentTime = 0;
    } else if (audioRef.current) {
      const newIndex = (currentSongIndex - 1 + tracks.length) % tracks.length;
      setCurrentSong(tracks[newIndex]);
      setCurrentSongIndex(newIndex);
      audioRef.current.src = tracks[newIndex].audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
      playerRef.current!.style.height = '';
    } else {
      setIsExpanded(true);
      playerRef.current!.style.height = '100vh';
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const startY = ('touches' in e ? e.touches[0].clientY : e.clientY);
    const startHeight = playerRef.current?.offsetHeight ?? 0;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const newHeight = startHeight + (startY - ('touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY));
      if (newHeight > 100 && newHeight < window.innerHeight) {
        playerRef.current!.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);

      if ((playerRef.current?.offsetHeight ?? 0) > window.innerHeight / 2) {
        setIsExpanded(true);
        playerRef.current!.style.height = '100vh';
      } else {
        setIsExpanded(false);
        playerRef.current!.style.height = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  return (
    <div
      ref={playerRef}
      className={`fixed bottom-0 left-0 right-0 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} shadow-md flex items-center justify-center transition-all duration-300 ${isExpanded ? 'h-full' : 'h-30'}`}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      {currentSong ? (
        <div className={`flex items-center space-x-4 w-full ${isExpanded ? 'flex-col' : 'flex-row'} max-w-screen-lg mx-auto ${isExpanded ? 'snow-background' : ''}`}>
          {isExpanded && (
            <div className="ripple-background">
              <div className={`circle xxlarge ${isDarkMode ? 'dark-mode-shade1' : 'shade1'}`}></div>
              <div className={`circle xlarge ${isDarkMode ? 'dark-mode-shade2' : 'shade2'}`}></div>
              <div className={`circle large ${isDarkMode ? 'dark-mode-shade3' : 'shade3'}`}></div>
              <div className={`circle medium ${isDarkMode ? 'dark-mode-shade4' : 'shade4'}`}></div>
              <div className={`circle small ${isDarkMode ? 'dark-mode-shade5' : 'shade5'}`}></div>
            </div>
          )}
          <div className={`flex-shrink-0 ${isExpanded ? 'mb-4' : ''}`}>
            <Image src={currentSong.coverUrl} alt="Song Cover" width={isExpanded ? 350 : 100} height={isExpanded ? 350 : 100} className="rounded-lg border" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`${isDarkMode ? 'text-white' : 'text-black'} ${isExpanded ? 'text-3xl' : 'text-lg'} font-bold`}>{currentSong.title}</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${isExpanded ? 'text-xl' : 'text-sm'} truncate`}>{currentSong.artist}</p>
            <div className="mt-2 flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="bg-gray-400 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                  <path d="M19.41 16.59 14.83 12l4.58-4.59L18 6l-6 6 6 6zM6 18h2V6H6v12z"></path>
                </svg>
              </button>
              <button
                onClick={handlePlayPause}
                className="bg-gray-400 p-2 rounded-full"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={handleNext}
                className="bg-gray-400 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                  <path d="M6 18l6-6-6-6v12zm7-12v12h2V6h-2z"></path>
                </svg>
              </button>
              <button
                onClick={handleShuffle}
                className={`p-2 rounded-full ${isShuffleActive ? 'bg-blue-500' : 'bg-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                  <path d="M10 4H6v2h4v5h2V6h4V4h-4V3h-2v1zm10 9h-2.15c-1.22 0-1.61 1.01-.72 1.72l1.72 1.29v.08h-4.55c-.89 0-1.27-.93-.56-1.55L15.45 12 14 10.74l-.99 1.45L16 13H14.82l-1.78 1.34L12.59 16h4.79l1.62-1.22c.88-.66.64-1.78-.62-1.78zM6.03 4h2V3h-2v1zm-1.47 2v4.79L8 13.78c.72.52 1.27-.28.72-1.03L4 9.54V6.41h1.97l1.6 1.28c.8.64 2.06-.1 1.72-1.13l-3-5c-.34-1.03-1.64-1.19-2.26-.16L2.36 5.6c-.5.87-.1 2.4.99 2.4h3.88c.45 0 .87-.36.87-.87 0-.23-.09-.46-.26-.63L5.02 4zM14 10l-2.31 1.75c-.86.65-2.1.18-2.35-.79L8 7.95 6.15 5.6H4v7.5L4 18c0 1.11.9 2 2 2h4v-1.5H6c-.28 0-.5-.22-.5-.5V12.41l4 2.67V15h4v-4.44L14 10zm4-5h2V5h-2v1zm-1.36 0v1h2.72v1h-2.72v1h2.72v1h-4v1h4v4H19v-4h1v-4h-1V7h1V6h-1V5h-1v1h-1V5h-1V4zm1 5h1v1h-1V9z"></path>
                </svg>
              </button>
              <button
                onClick={handleRepeat}
                className={`p-2 rounded-full ${isRepeatActive ? 'bg-blue-500' : 'bg-gray-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isDarkMode ? 'white' : 'black'}>
                  <path d="M13 4.06c3.9.47 7 3.84 7 7.94h1c0-5-4.05-9.05-9-9.94v1.01zM3.55 5.64l1.06 1.06c-1.52 1.53-2.38 3.64-2.34 5.89L2 12c-.05-2.75.89-5.3 2.55-7.22zM21 12c0-1.93-.78-3.68-2.05-4.95l1.06-1.06C21.15 7.03 22 9.37 22 12h-1zM12 2v1c-.35 0-.7.02-1.05.05l.22 1.99c.27-.02.55-.04.83-.04 4.09 0 7.55 3.07 7.94 7h1c-.4-4.59-4.35-8-9.21-8.06L12 2zM3.22 4.34l1.06 1.06C2.78 7.32 2 9.53 2 12H1c0-3.13.85-6.03 2.34-8.42l.22-.24-.22-.23.22.24-.34.35zm-.21 7.35c.04 2.25.82 4.36 2.34 5.89l-1.06 1.06C1.85 17.03 1 14.75 1 12h1zm1.47 7.01l-.22-.24C3.15 20.97 6.05 22 9 22v-1c-2.46 0-4.71-1.07-6.22-2.79l-.21-.24.21.23zm1.06-1.06l1.06 1.06c1.53-1.52 3.64-2.38 5.89-2.34l-.09-.97c-.33 0-.67-.02-1.02-.05v-1.99c.24.03.49.05.75.05 4.33 0 7.85-3.52 7.85-7.85 0-.26-.02-.51-.05-.75H22c.03.31.05.63.05.96 0 5.35-4.45 9.75-9.96 9.99L12 22c-2.47 0-4.73-1.06-6.36-2.79l1.06-1.06c1.53 1.52 3.68 2.38 5.89 2.34l.09.97c-2.59.07-5.15-1-6.86-2.71l-.22-.22-.24-.22zm16.43 2.72l-1.06-1.06c1.52-1.53 2.38-3.64 2.34-5.89l-.97-.09c.03 2.25-.78 4.35-2.34 5.89l-1.06 1.06c1.55 1.55 3.67 2.39 5.92 2.35l.09-.97c-.27.02-.55.04-.83.04-1.7-.02-3.28-.7-4.54-1.97l1.07-1.07zM9 12v1.99c-.65-.01-1.27.16-1.83.5l1.08 1.08C8.91 15.34 9 15.67 9 16v4.85c-3.88-1.12-6.74-4.81-6.74-9H1c0 5.04 3.69 8.74 8.5 9.74V16c0-.36-.13-.71-.35-.97L6.84 13c-.32-.32-.48-.75-.48-1.19v-1.78c.41-.09.83-.22 1.24-.4V12z"></path>
                </svg>
              </button>
              <div className="flex-grow">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white' : 'text-black'}>
                    {formatTime(currentTime)}
                  </span>
                  <span className={isDarkMode ? 'text-white' : 'text-black'}>
                    / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            className={`p-2 rounded-full self-start ml-auto ${isExpanded ? 'bg-red-500' : 'bg-gray-400'}`}
            onClick={handleExpand}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isDarkMode ? 'white' : 'black'}
            >
              {isExpanded ? (
                <path d="M18 6h-2v2H8V6H6v6h2v-2h8v2h2V6z"></path>
              ) : (
                <path d="M18 6h-2v6H8V6H6v6h2v2h8v-2h2V6z"></path>
              )}
            </svg>
          </button>
        </div>
      ) : (
        <p className={isDarkMode ? 'text-white' : 'text-black'}>
          No song is currently playing
        </p>
      )}
      <audio ref={audioRef}></audio>
    </div>
  );
};

export default Player;
