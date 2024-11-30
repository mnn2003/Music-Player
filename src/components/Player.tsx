'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Song } from '../types'
import { useTheme } from '../context/ThemeContext'
import { songs as tracks } from '../musicData'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Maximize2, Minimize2 } from 'lucide-react'

interface PlayerProps {
  song: Song | null
}

const Player: React.FC<PlayerProps> = ({ song }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { isDarkMode } = useTheme()
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isShuffleActive, setIsShuffleActive] = useState(false)
  const [isRepeatActive, setIsRepeatActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (song && audioRef.current) {
      audioRef.current.src = song.audioUrl
      audioRef.current.play()
      setIsPlaying(true)
      setCurrentSong(song)
      setCurrentSongIndex(tracks.findIndex((t) => t.id === song.id))

      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0)
      }
    }
  }, [song])

  useEffect(() => {
    const audio = audioRef.current
    const updateCurrentTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime)
        setDuration(audio.duration)
      }
    }
    audio?.addEventListener('timeupdate', updateCurrentTime)
    return () => {
      audio?.removeEventListener('timeupdate', updateCurrentTime)
    }
  }, [])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
    return `${minutes}:${formattedSeconds}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleShuffle = () => {
    setIsShuffleActive(!isShuffleActive)
    // Implement shuffle logic here
  }

  const handleRepeat = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop
      setIsRepeatActive(audioRef.current.loop)
    }
  }

  const handleNext = () => {
    if (audioRef.current) {
      const newIndex = (currentSongIndex + 1) % tracks.length
      setCurrentSong(tracks[newIndex])
      setCurrentSongIndex(newIndex)
      audioRef.current.src = tracks[newIndex].audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleBack = () => {
    if (audioRef.current && currentTime > 5) {
      audioRef.current.currentTime = 0
    } else if (audioRef.current) {
      const newIndex = (currentSongIndex - 1 + tracks.length) % tracks.length
      setCurrentSong(tracks[newIndex])
      setCurrentSongIndex(newIndex)
      audioRef.current.src = tracks[newIndex].audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={playerRef}
        className={`fixed bottom-0 left-0 right-0 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } shadow-lg transition-all duration-300 ease-in-out`}
        initial={{ height: '6rem' }}
        animate={{ height: isExpanded ? '100vh' : '6rem' }}
        transition={{ duration: 0.3 }}
      >
        {currentSong ? (
          <div className={`flex ${isExpanded ? 'flex-col items-center justify-center h-full' : 'items-center'} p-4 space-x-4`}>
            <motion.div
              className="flex-shrink-0"
              animate={{ width: isExpanded ? 350 : 64, height: isExpanded ? 350 : 64 }}
            >
              <Image
                src={currentSong.coverUrl}
                alt="Song Cover"
                width={isExpanded ? 350 : 64}
                height={isExpanded ? 350 : 64}
                className="rounded-lg"
              />
            </motion.div>
            <div className={`flex-1 min-w-0 ${isExpanded ? 'text-center mt-4' : ''}`}>
              <h3 className={`font-bold truncate ${isExpanded ? 'text-2xl' : 'text-lg'}`}>{currentSong.title}</h3>
              <p className={`text-sm text-gray-500 dark:text-gray-400 truncate ${isExpanded ? 'text-xl mt-2' : ''}`}>{currentSong.artist}</p>
              
              <div className={`flex items-center space-x-4 ${isExpanded ? 'mt-8 justify-center' : 'mt-2'}`}>
                <span className="text-sm">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-sm">{formatTime(duration)}</span>
              </div>
              
              <div className={`flex items-center ${isExpanded ? 'justify-center mt-8' : 'mt-2'} space-x-4`}>
                <button
                  onClick={handleShuffle}
                  className={`focus:outline-none ${isShuffleActive ? 'text-green-500' : ''}`}
                >
                  <Shuffle size={isExpanded ? 28 : 20} />
                </button>
                <button onClick={handleBack} className="focus:outline-none">
                  <SkipBack size={isExpanded ? 36 : 24} />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="focus:outline-none bg-primary text-primary-foreground rounded-full p-2"
                >
                  {isPlaying ? <Pause size={isExpanded ? 36 : 24} /> : <Play size={isExpanded ? 36 : 24} />}
                </button>
                <button onClick={handleNext} className="focus:outline-none">
                  <SkipForward size={isExpanded ? 36 : 24} />
                </button>
                <button
                  onClick={handleRepeat}
                  className={`focus:outline-none ${isRepeatActive ? 'text-green-500' : ''}`}
                >
                  <Repeat size={isExpanded ? 28 : 20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-lg p-4">Select a song to see player.</p>
        )}

        <audio ref={audioRef} onEnded={handleNext} />

        <button
          className="absolute top-2 right-2 p-2 focus:outline-none"
          onClick={handleExpand}
        >
          {isExpanded ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

export default Player

