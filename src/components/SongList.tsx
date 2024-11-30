'use client'

import React from 'react'
import { Song } from '../types'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { Play, Pause } from 'lucide-react'

interface SongListProps {
  tracks: Song[]
  onSongClick: (song: Song) => void
  currentSong: Song | null
  isPlaying: boolean
}

const SongList: React.FC<SongListProps> = ({ tracks, onSongClick, currentSong, isPlaying }) => {
  const { isDarkMode } = useTheme()

  const handleClick = (song: Song) => {
    onSongClick(song)
  }

  return (
    <motion.div
      className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            delay: 0.2,
            when: "beforeChildren",
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {tracks.map((track) => (
        <motion.div
          key={track.id}
          className={`group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
          } ${currentSong && currentSong.id === track.id ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleClick(track)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-square">
            <Image 
              src={track.coverUrl} 
              alt={track.title} 
              layout="fill" 
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
              currentSong && currentSong.id === track.id ? 'opacity-100' : ''
            }`}>
              {currentSong && currentSong.id === track.id && isPlaying ? (
                <Pause className="h-12 w-12 text-white" />
              ) : (
                <Play className="h-12 w-12 text-white" />
              )}
            </div>
          </div>
          <div className="p-4">
            <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {track.title}
            </h3>
            <p className={`mt-1 text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {track.artist}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SongList

