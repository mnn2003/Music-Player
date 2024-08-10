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
      setCurrentTime(0);
      setDuration(0);
    }
  }, [song]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateCurrentTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
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
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${isExpanded ? 'text-xl' : 'text-base'}`}>{currentSong.artist}</p>

            <div className="flex items-center space-x-4 mt-2">
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} font-mono`}>{formatTime(currentTime)}</span>
              <input
                type="range"
                value={currentTime}
                max={duration || 0}
                onChange={handleSeek}
                className="flex-grow bg-gray-300 h-1 rounded-full appearance-none cursor-pointer"
              />
              <span className={`${isDarkMode ? 'text-white' : 'text-black'} font-mono`}>{formatTime(duration)}</span>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={handleShuffle}
                className={`p-2 rounded-full focus:outline-none ${isShuffleActive ? 'bg-green-500' : 'bg-gray-400'} text-white`}
              >
                Shuffle
              </button>
              <button
                onClick={handleBack}
                className="p-2 rounded-full bg-gray-400 focus:outline-none text-white"
              >
                Previous
              </button>
              <button
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-blue-500 focus:outline-none text-white"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-gray-400 focus:outline-none text-white"
              >
                Next
              </button>
              <button
                onClick={handleRepeat}
                className={`p-2 rounded-full focus:outline-none ${isRepeatActive ? 'bg-green-500' : 'bg-gray-400'} text-white`}
              >
                Repeat
              </button>
            </div>
          </div>
          <button onClick={handleExpand} className={`p-2 mt-4 text-white bg-${isExpanded ? 'red-500' : 'green-500'} rounded-full`}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      ) : (
        <div className="text-center text-gray-500">Select a song to play</div>
      )}
      <audio ref={audioRef}></audio>
    </div>
  );
};

export default Player;
