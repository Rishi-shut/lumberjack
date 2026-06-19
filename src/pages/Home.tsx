import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Shield, Globe, Award, Sparkles, ChevronRight, Moon, Wind, Sun } from 'lucide-react';
import { db, ShopItem, getCharacterEmoji, getCharacterLabel } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

// Custom Interactive Cinematic HTML5 Video Player
const fallbackSlides = [
  { emoji: '🌲', title: 'CHOP THE INFINITE TREE', desc: 'Dodge falling branches, master the left-right rhythm, and test your reaction speed.' },
  { emoji: '⚡', title: 'EQUIP LEGENDARY AXES', desc: 'Unlock premium characters, broadaxes, and glowing particle action trails.' },
  { emoji: '🏆', title: 'GLOBAL LEADERBOARDS', desc: 'Submit high scores, complete bulletin daily contracts, and compete with lumberjacks worldwide.' },
  { emoji: '🎨', title: 'ELEGANT NATURE SECTORS', desc: 'Migrate across Pine Forest, Glacial Spires, Vector Core, and Sand Dune Oasis.' }
];

const CinematicVideoPlayer: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  React.useEffect(() => {
    if (videoError) {
      setDuration(12);
      let timer: number;
      if (isPlaying) {
        timer = window.setInterval(() => {
          setCurrentTime(prev => {
            const next = (prev + 0.1) % 12;
            setSlideIndex(Math.floor((next / 12) * fallbackSlides.length));
            return next;
          });
        }, 100);
      }
      return () => clearInterval(timer);
    }
  }, [videoError, isPlaying]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Auto-play video
    video.play().catch(() => setIsPlaying(false));

    const handleTimeUpdate = () => {
      if (!videoError) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleDurationChange = () => {
      if (!videoError) {
        setDuration(video.duration);
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [videoError]);

  const togglePlay = () => {
    if (videoError) {
      setIsPlaying(!isPlaying);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(e.target.value);
    setCurrentTime(seekTime);
    if (videoError) {
      setSlideIndex(Math.floor((seekTime / 12) * fallbackSlides.length));
    } else {
      const video = videoRef.current;
      if (video) video.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    const video = videoRef.current;
    if (video && !videoError) {
      video.volume = vol;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const video = videoRef.current;
    if (video && !videoError) {
      video.muted = !isMuted;
    }
  };

  const handleFullscreen = () => {
    if (videoError) return;
    const video = videoRef.current;
    if (video && video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: cinemaMode ? 'rgba(0,0,0,0.96)' : 'rgba(0,0,0,0.85)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: cinemaMode ? 'blur(16px)' : 'blur(8px)',
      transition: 'all 0.5s ease',
      padding: '16px'
    }}>
      <div className="material-wood" style={{
        maxWidth: '850px',
        width: '100%',
        position: 'relative',
        border: '1.5px solid var(--neon-yellow)',
        boxShadow: '0 10px 40px rgba(245,158,11,0.15)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#000'
      }}>
        {/* Close Button */}
        <button
          className="neon-btn-magenta"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            fontSize: '0.8rem',
            fontWeight: 'bold',
            zIndex: 1010,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onClick={onClose}
        >
          ✕
        </button>

        {/* Video Player */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', cursor: 'pointer', overflow: 'hidden' }} onClick={togglePlay}>
          {videoError ? (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1e1b18 0%, #0c0a09 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              color: '#fff',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '4.5rem',
                animation: 'bounceSlow 1.8s infinite ease-in-out',
                marginBottom: '14px'
              }}>
                {fallbackSlides[slideIndex].emoji}
              </div>
              <h3 className="retro-title" style={{
                fontSize: '0.95rem',
                color: 'var(--neon-yellow)',
                marginBottom: '8px',
                letterSpacing: '1px'
              }}>
                {fallbackSlides[slideIndex].title}
              </h3>
              <p style={{
                fontSize: '0.82rem',
                color: '#cbd5e1',
                maxWidth: '480px',
                lineHeight: '1.5',
                margin: '0 auto'
              }}>
                {fallbackSlides[slideIndex].desc}
              </p>
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-retro)',
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.06)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                PREVIEW MODE (OFFLINE REEL)
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={src}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loop
              playsInline
              onError={() => setVideoError(true)}
            />
          )}
          
          {/* Big Center Play Pause animation overlay */}
          {!isPlaying && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(245, 158, 11, 0.9)',
              color: '#000',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,158,11,0.5)',
              fontSize: '1.8rem',
              pointerEvents: 'none'
            }}>
              <Play size={28} style={{ marginLeft: '4px', fill: '#000' }} />
            </div>
          )}
        </div>

        {/* Custom Video Controls Panel */}
        <div style={{
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Progress Timeline Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                flex: 1,
                accentColor: 'var(--neon-yellow)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {/* Left side actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Play Pause */}
              <button 
                onClick={togglePlay} 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
              </button>

              {/* Time display */}
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-retro)', color: 'rgba(255,255,255,0.7)' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={toggleMute} 
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{ width: '60px', accentColor: 'var(--neon-cyan)', height: '3px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Right side actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Cinema Lights Toggle */}
              <button 
                onClick={() => setCinemaMode(!cinemaMode)} 
                title="Toggle Cinema Mode"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: cinemaMode ? 'var(--neon-yellow)' : '#fff', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-retro)'
                }}
              >
                {cinemaMode ? <Moon size={16} fill="currentColor" /> : <Sun size={16} />}
                <span>CINEMA LIGHTS</span>
              </button>

              {/* Fullscreen */}
              <button 
                onClick={handleFullscreen} 
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HomeProps {
  onPlayWorld: (worldId: string) => void;
  userCoins: number;
  userDiamonds: number;
  onPurchaseComplete: () => void;
  equippedChar: string;
  difficulty: string;
  onDifficultyChange: (diff: string) => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  selectedWorldId: string;
  setSelectedWorldId: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onPlayWorld,
  userCoins,
  userDiamonds,
  onPurchaseComplete,
  equippedChar,
  difficulty,
  onDifficultyChange,
  showAlert,
  showConfirm,
  selectedWorldId,
  setSelectedWorldId
}) => {
  const shopItems = db.getShop();
  const worlds = shopItems.filter(item => item.type === 'world');

  const [showTrailer, setShowTrailer] = useState(false);
  const [showAtlas, setShowAtlas] = useState(false);
  const [atlasFilter, setAtlasFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [atlasSearch, setAtlasSearch] = useState('');

  const getSectorForWorld = (worldId: string): 'nature' | 'urban' | 'hazard' | 'special' => {
    if (['world_forest', 'world_autumn', 'world_desert', 'world_zen', 'world_coral'].includes(worldId)) return 'nature';
    if (['world_city', 'world_volcano', 'world_steampunk', 'world_cyberpunk'].includes(worldId)) return 'urban';
    if (['world_ice', 'world_wasteland', 'world_haunted', 'world_prehistoric'].includes(worldId)) return 'hazard';
    if (['world_cyber', 'world_space', 'world_candy', 'world_sky', 'world_arcade'].includes(worldId)) return 'special';
    return 'nature';
  };

  const [selectedSector, setSelectedSector] = useState<'nature' | 'urban' | 'hazard' | 'special'>(() => getSectorForWorld(selectedWorldId));

  const activeDaily = (() => {
    try {
      const ms = db.getMissions().filter(m => m.type === 'daily');
      return ms.find(m => !m.claimed) || ms[0];
    } catch (e) {
      return null;
    }
  })();

  const getDynamicDailyDetails = () => {
    if (!activeDaily) {
      return {
        title: 'The Frozen Timber Trial',
        description: 'Achieve a score of 180 logs on the Frost Mountain world. You must navigate heavy snow piles and fast branch decay.',
        rewardText: '+400 COINS',
        worldId: 'world_ice',
        buttonText: 'ACCEPT CONTRACT'
      };
    }

    const worldNameMap: Record<string, string> = {
      'Pine Forest': 'world_forest',
      'Metro Heights': 'world_city',
      'Glacial Spires': 'world_ice',
      'Vector Core': 'world_cyber',
      'Magma Core': 'world_volcano',
      'Autumn Canopy': 'world_autumn',
      'Sand Dune Oasis': 'world_desert',
      'Haunted Graveyard': 'world_haunted',
      'Space Station': 'world_space',
      'Toxic Wasteland': 'world_wasteland',
      'Steampunk Workshop': 'world_steampunk',
      'Candy Land': 'world_candy',
      'Zen Garden': 'world_zen',
      'Coral Reef': 'world_coral',
      'Cyberpunk Grid': 'world_cyberpunk',
      'Prehistoric Jungle': 'world_prehistoric',
      'Sky Sanctuary': 'world_sky',
      'Retro Arcade': 'world_arcade'
    };

    let title = activeDaily.title;
    let description = `Fulfill this daily bulletin contract. Progress: ${activeDaily.current} / ${activeDaily.target}.`;
    let buttonText = 'ACCEPT CONTRACT';
    let targetWorldId = 'world_forest';

    if (activeDaily.id.includes('chop')) {
      const mapName = activeDaily.requiredMap || 'Pine Forest';
      targetWorldId = worldNameMap[mapName] || 'world_forest';
      title = `Chop Challenge: ${mapName}`;
      description = `Fulfill this contract by chopping at least ${activeDaily.target} blocks on the ${mapName} world. Current progress: ${activeDaily.current}/${activeDaily.target}.`;
    } else if (activeDaily.id.includes('combo')) {
      title = `Streak Challenge: ${activeDaily.target}x Combo`;
      description = `Chop rapidly to build up a massive streak and hit a combo multiplier of ${activeDaily.target}x. Current streak: ${activeDaily.current}x.`;
      targetWorldId = selectedWorldId;
    } else if (activeDaily.id.includes('coins')) {
      title = `Collect ${activeDaily.target} Coins`;
      description = `Collect at least ${activeDaily.target} coins during game sessions. Current progress: ${activeDaily.current}/${activeDaily.target}.`;
      targetWorldId = selectedWorldId;
    } else if (activeDaily.id.includes('play')) {
      title = `Deploy ${activeDaily.target} Matches`;
      description = `Play ${activeDaily.target} game matches on any sector. Current progress: ${activeDaily.current}/${activeDaily.target}.`;
      targetWorldId = selectedWorldId;
    }

    if (activeDaily.current >= activeDaily.target) {
      buttonText = 'COMPLETE (CLAIM IN BULLETIN)';
    }

    const rewardParts = [];
    if (activeDaily.rewardCoins > 0) rewardParts.push(`${activeDaily.rewardCoins} COINS`);
    if (activeDaily.rewardDiamonds > 0) rewardParts.push(`${activeDaily.rewardDiamonds} GEMS`);
    const rewardText = `+${rewardParts.join(' & ')}`;

    return {
      title,
      description,
      rewardText,
      worldId: targetWorldId,
      buttonText
    };
  };

  const dailyDetails = getDynamicDailyDetails();

  const selectedWorld = worlds.find(w => w.id === selectedWorldId) || worlds[0];

  const handleWorldSelect = (world: ShopItem) => {
    if (world.unlocked) {
      setSelectedWorldId(world.id);
      setTimeout(() => {
        const deck = document.getElementById('departure-deck');
        if (deck) {
          deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } else {
      showConfirm(
        'Unlock World',
        `Unlock ${world.name} for ${world.cost} ${world.currency}?`,
        () => {
          const res = db.purchaseShopItem(world.id);
          if (res.success) {
            showAlert('World Unlocked', `${world.name} unlocked!`);
            onPurchaseComplete();
            setSelectedWorldId(world.id);
            setTimeout(() => {
              const deck = document.getElementById('departure-deck');
              if (deck) {
                deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 150);
          } else {
            showAlert('Unlock Failed', `Unlock failed: ${res.reason}`);
          }
        }
      );
    }
  };

  const difficulties = [
    { id: 'easy', name: 'Easy', multiplier: '0.5x', timer: '45s', desc: 'Slower decay & sparse branches.' },
    { id: 'medium', name: 'Medium', multiplier: '1.0x', timer: '30s', desc: 'Standard Timberman difficulty.' },
    { id: 'hard', name: 'Hard', multiplier: '1.5x', timer: '20s', desc: 'Fast decay & dense branches.' },
    { id: 'extreme', name: 'Extreme', multiplier: '2.0x', timer: '15s', desc: 'Rapid decay & narrow safety buffers.' },
    { id: 'nightmare', name: 'Nightmare', multiplier: '3.0x', timer: '10s', desc: 'Zero clean segment buffering!' },
    { id: 'impossible', name: 'Impossible', multiplier: '5.0x', timer: '5s', desc: 'Lightspeed decay & max density!' },
  ];



  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      {/* Redesigned Parallax Hero Section */}
      <div 
        className="material-wood"
        style={{
          padding: '80px 24px 100px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '460px',
          background: 'linear-gradient(180deg, var(--panel-bg) 0%, var(--bg-color) 100%)',
        }}
      >
        {/* Parallax Clouds */}
        <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, height: '100px', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute',
            fontSize: '4rem',
            opacity: 0.04,
            whiteSpace: 'nowrap',
            animation: 'cloudDrift 40s linear infinite'
          }}>
            ☁️   ☁️       ☁️
          </div>
          <div style={{
            position: 'absolute',
            fontSize: '5rem',
            opacity: 0.03,
            whiteSpace: 'nowrap',
            animation: 'cloudDrift 65s linear infinite',
            animationDelay: '-20s'
          }}>
            ☁️       ☁️   ☁️
          </div>
        </div>

        {/* Falling Leaves Animation (Pure CSS simulation) */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '20%',
          fontSize: '1.2rem',
          opacity: 0.4,
          animation: 'leafFall 8s linear infinite',
          pointerEvents: 'none'
        }}>🍁</div>
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '70%',
          fontSize: '1.4rem',
          opacity: 0.3,
          animation: 'leafFall 12s linear infinite',
          animationDelay: '3s',
          pointerEvents: 'none'
        }}>🍂</div>

        {/* Flying Birds */}
        <div className="bird-anim" style={{ position: 'absolute', top: '30px', left: 0, fontSize: '1.2rem', zIndex: 1, pointerEvents: 'none', opacity: 0.4 }}>
          🦅
        </div>

        {/* Character beside Infinite Tree Illustration */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '30px',
          marginBottom: '24px',
          height: '110px',
          position: 'relative'
        }}>
          {/* Infinite Tree Trunk */}
          <div style={{
            width: '28px',
            height: '110px',
            backgroundColor: '#e2e8f0',
            border: '2px solid var(--panel-border)',
            borderTop: 'none',
            borderBottom: 'none',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#cbd5e1' }} />
            <div style={{ width: '100%', height: '4px', backgroundColor: '#cbd5e1' }} />
            <div style={{ width: '100%', height: '4px', backgroundColor: '#cbd5e1' }} />
            {/* Tree Branch */}
            <div style={{
              position: 'absolute',
              right: '-36px',
              top: '30px',
              width: '36px',
              height: '14px',
              backgroundColor: '#e2e8f0',
              border: '2px solid var(--panel-border)',
              borderLeft: 'none',
              borderRadius: '0 4px 4px 0'
            }}>
              <span style={{ position: 'absolute', top: '-10px', right: '-6px', fontSize: '0.8rem' }}>🍃</span>
            </div>
          </div>

          {/* Active Character Breathing */}
          <div 
            className="character-breath"
            style={{
              fontSize: '3.5rem',
              lineHeight: 1,
              filter: 'drop-shadow(0 6px 4px rgba(0,0,0,0.5))',
              position: 'relative',
              bottom: '0px'
            }}
          >
            {getCharacterEmoji(equippedChar)}
          </div>
        </div>

        {/* Small Event Header */}
        <div style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-retro)',
          color: 'var(--neon-yellow)',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '10px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}>
          🌲 THE INFINITE OAK AWAITS 🌲
        </div>

        <h1 className="retro-title" style={{ fontSize: '3rem', margin: '0 0 16px', letterSpacing: '1px' }}>
          INFINITE CHOP
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px', maxWidth: '560px', lineHeight: '1.6' }}>
          Dodge falling branches, race against the sands of time, and claim your spot on the eternal global high scores.
        </p>

        {/*Tactile CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
          <button 
            className="neon-btn-yellow" 
            style={{ fontSize: '0.95rem', padding: '14px 30px' }}
            onClick={() => onPlayWorld(selectedWorldId)}
          >
            <Play size={16} style={{ display: 'inline', marginRight: '6px', fill: 'currentColor' }} />
            PLAY NOW
          </button>

          <button 
            className="neon-btn-cyan" 
            style={{ fontSize: '0.95rem', padding: '14px 24px' }}
            onClick={() => setShowTrailer(true)}
          >
            WATCH TRAILER
          </button>

          <button 
            className="neon-btn" 
            style={{ fontSize: '0.95rem', padding: '14px 24px' }}
            onClick={() => {
              const element = document.getElementById('world-selection');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            CHOOSE ENVIRONMENT
          </button>
        </div>


        {/* Dangling Scroll Arrow */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounceSlow 2s infinite',
          opacity: 0.6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-retro)', letterSpacing: '2px', color: 'var(--text-secondary)' }}>SCROLL</span>
          <span style={{ fontSize: '1rem', color: 'var(--neon-cyan)' }}>↓</span>
        </div>
      </div>

      {/* Collectible Daily Challenge parchment card */}
      <div 
        className="material-paper" 
        style={{ 
          padding: '28px', 
          marginBottom: '40px', 
          position: 'relative', 
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
        }}
      >
        {/* Vintage Wax Seal */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#9a2415',
          border: '3px double #e5a93b',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e5a93b',
          fontWeight: '900',
          fontSize: '0.7rem',
          transform: 'rotate(-12deg)',
          fontFamily: 'var(--font-display)',
          userSelect: 'none'
        }}>
          CHOP
        </div>

        <div style={{ maxWidth: '85%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Award size={18} style={{ color: 'var(--neon-cyan)' }} />
            <h3 className="retro-title" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', textShadow: 'none', margin: 0 }}>
              DAILY CHALLENGE NOTES
            </h3>
          </div>
          
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '800', marginBottom: '10px' }}>
            {dailyDetails.title}
          </h2>
          
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
            {dailyDetails.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>🎁</span>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-retro)' }}>
                {dailyDetails.rewardText}
              </span>
            </div>
            
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
              RESET: DAILY
            </div>

            <button 
              className="neon-btn-yellow" 
              style={{ padding: '8px 20px', fontSize: '0.75rem', borderWidth: '2px' }}
              onClick={() => {
                setSelectedWorldId(dailyDetails.worldId);
                const targetSector = getSectorForWorld(dailyDetails.worldId);
                setSelectedSector(targetSector);
                setTimeout(() => {
                  const deck = document.getElementById('departure-deck');
                  if (deck) deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
            >
              {dailyDetails.buttonText}
            </button>
          </div>
        </div>
      </div>

      <div 
        className="material-wood" 
        style={{ 
          padding: '24px', 
          marginBottom: '40px',
          background: 'linear-gradient(135deg, var(--panel-bg), var(--bg-color))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '2px dashed var(--panel-border)', paddingBottom: '12px' }}>
          <Wind size={18} style={{ color: 'var(--neon-cyan)' }} />
          <h3 className="retro-title" style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', margin: 0 }}>
            SPEED & MULTIPLIER MULTI-DESK
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          {difficulties.map(diff => {
            const isActive = difficulty === diff.id;
            let themeColor = 'var(--neon-green)';
            if (diff.id === 'hard') themeColor = 'var(--neon-cyan)';
            if (diff.id === 'extreme') themeColor = 'var(--neon-yellow)';
            if (diff.id === 'nightmare' || diff.id === 'impossible') themeColor = 'var(--neon-red)';

            return (
              <button
                key={diff.id}
                style={{
                  background: isActive ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.01)',
                  border: '1px solid',
                  borderColor: isActive ? themeColor : 'var(--panel-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all 0.15s ease',
                  transform: isActive ? 'scale(1.02) translateY(-1px)' : 'none',
                  boxShadow: isActive ? '0 4px 8px rgba(0,0,0,0.04)' : 'none'
                }}
                onClick={() => {
                  onDifficultyChange(diff.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                    {diff.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: themeColor, fontWeight: '900', fontFamily: 'var(--font-retro)' }}>
                    {diff.multiplier}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
                  DECAY: {diff.timer}
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="material-leather" style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>⚙️</span>
          <span>
            <strong>Current modifier:</strong> {difficulties.find(d => d.id === difficulty)?.desc} Rewards and level XP are scaled.
          </span>
        </div>
      </div>

      {/* World Selection Grid */}
      <div id="world-selection" style={{ scrollMarginTop: '100px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="retro-title" style={{ fontSize: '1rem', margin: 0, color: 'var(--neon-yellow)' }}>
            SELECT MISSION SECTOR
          </h2>
          
          {/* Sector Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'nature', name: 'NATURE', icon: '🌲' },
              { id: 'urban', name: 'URBAN', icon: '🏙️' },
              { id: 'hazard', name: 'HAZARD', icon: '☣️' },
              { id: 'special', name: 'SPECIAL', icon: '✨' }
            ].map(sec => {
              const isSecSelected = selectedSector === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSector(sec.id as any)}
                  className="retro-btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.62rem',
                    borderRadius: '4px',
                    background: isSecSelected ? 'var(--neon-yellow)' : 'var(--panel-bg)',
                    color: isSecSelected ? '#000000' : 'var(--text-primary)',
                    borderColor: isSecSelected ? 'var(--neon-yellow)' : 'var(--panel-border)',
                    boxShadow: isSecSelected ? '0 0 10px rgba(229,169,59,0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>{sec.icon}</span> {sec.name}
                </button>
              );
            })}
            
            <button
              onClick={() => { sound.playCoin(); setShowAtlas(true); }}
              className="retro-btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.62rem',
                borderRadius: '4px',
                background: 'var(--panel-bg)',
                color: 'var(--neon-cyan)',
                borderColor: 'var(--neon-cyan)',
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🗺️ WORLD ATLAS
            </button>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', 
            gap: '20px', 
            marginBottom: '35px' 
          }}
        >
          {worlds
            .filter(world => {
              const sectorWorldIds = {
                nature: ['world_forest', 'world_autumn', 'world_desert', 'world_zen', 'world_coral'],
                urban: ['world_city', 'world_volcano', 'world_steampunk', 'world_cyberpunk'],
                hazard: ['world_ice', 'world_wasteland', 'world_haunted', 'world_prehistoric'],
                special: ['world_cyber', 'world_space', 'world_candy', 'world_sky', 'world_arcade']
              };
              return sectorWorldIds[selectedSector]?.includes(world.id);
            })
            .map(world => {
              let bgGradient = 'linear-gradient(135deg, var(--panel-bg), var(--bg-color))';
              let accent = 'var(--panel-border)';
              let weatherIcon = '☀️';
              let weatherText = 'Sunny Breeze';
              let modifierText = '🪵 Standard Logs';

              if (world.id === 'world_forest') {
                bgGradient = 'linear-gradient(135deg, #1f3020, #131e13)';
                accent = 'var(--neon-green)';
                weatherIcon = '🍃';
                weatherText = 'Falling Leaves';
                modifierText = '🪵 Standard Logs';
              }
              if (world.id === 'world_city') {
                bgGradient = 'linear-gradient(135deg, #1b2230, #101520)';
                accent = 'var(--neon-cyan)';
                weatherIcon = '☁️';
                weatherText = 'Heavy Fog';
                modifierText = '🏢 High-rise Balkons';
              }
              if (world.id === 'world_ice') {
                bgGradient = 'linear-gradient(135deg, #112835, #08151f)';
                accent = 'var(--neon-cyan)';
                weatherIcon = '❄️';
                weatherText = 'Heavy Blizzard';
                modifierText = '❄️ Freezing Frost';
              }
              if (world.id === 'world_cyber') {
                bgGradient = 'linear-gradient(135deg, #2b172d, #18091a)';
                accent = 'var(--neon-magenta)';
                weatherIcon = '🔋';
                weatherText = 'Neon Surge';
                modifierText = '🔌 Cyber Grid';
              }
              if (world.id === 'world_volcano') {
                bgGradient = 'linear-gradient(135deg, #301711, #1b0905)';
                accent = 'var(--neon-red)';
                weatherIcon = '🌋';
                weatherText = 'Magma Rain';
                modifierText = '🌋 Magma Splashes';
              }
              if (world.id === 'world_autumn') {
                bgGradient = 'linear-gradient(135deg, #2c2013, #191007)';
                accent = 'var(--neon-yellow)';
                weatherIcon = '🍂';
                weatherText = 'Maple Swirl';
                modifierText = '🍁 Floating Leaves';
              }
              if (world.id === 'world_desert') {
                bgGradient = 'linear-gradient(135deg, #2d2a13, #1a1807)';
                accent = 'var(--neon-yellow)';
                weatherIcon = '🏜️';
                weatherText = 'Sandstorm Wind';
                modifierText = '🏜️ Sandstorm Wind';
              }
              if (world.id === 'world_haunted') {
                bgGradient = 'linear-gradient(135deg, #181024, #0c0617)';
                accent = '#4de680';
                weatherIcon = '👻';
                weatherText = 'Eerie Fog';
                modifierText = '🕯️ Vignette Dark';
              }
              if (world.id === 'world_space') {
                bgGradient = 'linear-gradient(135deg, #0f172a, #020617)';
                accent = '#00ffff';
                weatherIcon = '☄️';
                weatherText = 'Asteroid Storm';
                modifierText = '🛸 Asteroid Alert';
              }
              if (world.id === 'world_wasteland') {
                bgGradient = 'linear-gradient(135deg, #142116, #09100a)';
                accent = '#aee50d';
                weatherIcon = '🤢';
                weatherText = 'Acid Rain';
                modifierText = '☣️ Acid Sludge';
              }
              if (world.id === 'world_steampunk') {
                bgGradient = 'linear-gradient(135deg, #2b1810, #140804)';
                accent = '#ffaa66';
                weatherIcon = '💨';
                weatherText = 'Venting Smog';
                modifierText = '⚙️ Steampunk Steam';
              }
              if (world.id === 'world_candy') {
                bgGradient = 'linear-gradient(135deg, #351c22, #200d11)';
                accent = '#e11d48';
                weatherIcon = '🍬';
                weatherText = 'Candy Confetti';
                modifierText = '🍭 Sweet & Sour';
              }
              if (world.id === 'world_zen') {
                bgGradient = 'linear-gradient(135deg, #1c1218, #0f090d)';
                accent = '#ffb7c5';
                weatherIcon = '🌸';
                weatherText = 'Cherry Blossoms';
                modifierText = '🌸 Serene Peace';
              }
              if (world.id === 'world_coral') {
                bgGradient = 'linear-gradient(135deg, #09212d, #041017)';
                accent = '#00ffff';
                weatherIcon = '🫧';
                weatherText = 'Deep Sea Bubbles';
                modifierText = '🌊 Sea Resistance';
              }
              if (world.id === 'world_cyberpunk') {
                bgGradient = 'linear-gradient(135deg, #140d21, #0a0612)';
                accent = '#39ff14';
                weatherIcon = '⚡';
                weatherText = 'Neon Rain';
                modifierText = '🏙️ Glitch Speed';
              }
              if (world.id === 'world_prehistoric') {
                bgGradient = 'linear-gradient(135deg, #2b1c10, #140b05)';
                accent = '#ff4500';
                weatherIcon = '🦖';
                weatherText = 'Volcano Ash';
                modifierText = '🌋 Dino Tremors';
              }
              if (world.id === 'world_sky') {
                bgGradient = 'linear-gradient(135deg, #18283a, #0a131c)';
                accent = '#ffd700';
                weatherIcon = '☁️';
                weatherText = 'Drifting Clouds';
                modifierText = '💨 Windy Gusts';
              }
              if (world.id === 'world_arcade') {
                bgGradient = 'linear-gradient(135deg, #09090b, #000000)';
                accent = '#ff007f';
                weatherIcon = '👾';
                weatherText = 'Glitch Pixels';
                modifierText = '🕹️ High Tempo';
              }

              const isSelected = selectedWorldId === world.id;

              return (
                <div 
                  key={world.id}
                  className="material-wood"
                  style={{
                    background: bgGradient,
                    borderWidth: '3px',
                    borderColor: isSelected ? 'var(--neon-yellow)' : (world.unlocked ? accent : 'var(--panel-border)'),
                    opacity: world.unlocked ? 1 : 0.82,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '220px',
                    padding: '20px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 20px rgba(229,169,59,0.25), 0 6px 12px rgba(0,0,0,0.1)' : '0 6px 12px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => handleWorldSelect(world)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    if (world.unlocked) {
                      e.currentTarget.style.boxShadow = isSelected 
                        ? '0 0 25px rgba(229,169,59,0.35), 0 10px 20px rgba(0,0,0,0.1)' 
                        : `0 10px 20px rgba(0,0,0,0.08), 0 0 10px ${accent}22`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isSelected 
                      ? '0 0 20px rgba(229,169,59,0.25), 0 6px 12px rgba(0,0,0,0.1)' 
                      : '0 6px 12px rgba(0,0,0,0.05)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <h3 className="retro-title" style={{ fontSize: '0.85rem', margin: 0, textShadow: 'none', color: '#ffffff' }}>
                        {world.name}
                      </h3>
                      {isSelected ? (
                        <span className="rarity-tag rarity-legendary" style={{ fontSize: '8px', padding: '2px 6px', animation: 'pulseNeon 1.5s infinite' }}>
                          SELECTED
                        </span>
                      ) : world.unlocked ? (
                        <span style={{ color: 'var(--neon-green)', fontSize: '0.65rem', fontFamily: 'var(--font-retro)', fontWeight: 'bold' }}>READY</span>
                      ) : (
                        <span style={{ color: 'var(--neon-yellow)', fontSize: '0.68rem', fontFamily: 'var(--font-retro)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          🪙 {world.cost}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', lineHeight: '1.5', margin: '8px 0 16px' }}>
                      {world.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                      <span>{weatherIcon}</span>
                      <span>{weatherText}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--panel-border)', paddingTop: '10px' }}>
                      <span className={`rarity-tag rarity-${world.rarity}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
                        {world.rarity}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: accent }}>
                        {modifierText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* MISSION DEPARTURE DECK (Control Console) */}
        <div 
          id="departure-deck"
          className="material-wood"
          style={{
            padding: '24px',
            marginBottom: '50px',
            background: 'linear-gradient(135deg, var(--panel-bg), var(--bg-color))',
            border: '2px solid var(--neon-yellow)',
            boxShadow: '0 8px 24px rgba(245,158,11,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            scrollMarginTop: '120px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)', letterSpacing: '2px' }}>
              READY TO DEPART
            </span>
            <h3 className="retro-title" style={{ fontSize: '1.25rem', margin: '4px 0 0', textShadow: 'none' }}>
              MISSION DEPARTURE DECK
            </h3>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-color)',
            padding: '16px',
            borderRadius: '8px',
            border: '1.5px dashed var(--panel-border)'
          }}>
            {/* Selected World Info */}
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>SECTOR:</span>
              <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {selectedWorldId === 'world_forest' ? '🌲' : (selectedWorldId === 'world_city' ? '🏙️' : (selectedWorldId === 'world_ice' ? '🏔️' : (selectedWorldId === 'world_cyber' ? '🔌' : (selectedWorldId === 'world_haunted' ? '👻' : (selectedWorldId === 'world_space' ? '☄️' : (selectedWorldId === 'world_wasteland' ? '🤢' : (selectedWorldId === 'world_steampunk' ? '💨' : (selectedWorldId === 'world_candy' ? '🍬' : '🌋'))))))))} {selectedWorld?.name || 'Forest'}
              </span>
            </div>

            {/* Difficulty Info */}
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>DIFFICULTY:</span>
              <span style={{ 
                fontSize: '1.05rem', 
                fontWeight: '800', 
                color: difficulty === 'easy' ? 'var(--neon-green)' : (difficulty === 'medium' ? 'var(--neon-cyan)' : (difficulty === 'hard' ? 'var(--neon-yellow)' : 'var(--neon-red)')),
              }}>
                {difficulty.toUpperCase()} ({difficulties.find(d => d.id === difficulty)?.multiplier})
              </span>
            </div>

            {/* Character Info */}
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>CHALLENGER:</span>
              <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '800' }}>
                {getCharacterLabel(equippedChar)}
              </span>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            className="neon-btn-yellow"
            style={{
              fontSize: '1.2rem',
              padding: '14px 36px',
              animation: 'bounceSlow 2s infinite',
            }}
            onClick={() => {
              if (selectedWorld) {
                onPlayWorld(selectedWorld.id);
              }
            }}
          >
            <Play size={18} style={{ display: 'inline', marginRight: '8px', fill: 'currentColor' }} />
            START CHOPPING
          </button>
        </div>
      </div>



      {/* Info Sections: Updates & Highlights */}
      <div className="grid-2" style={{ marginBottom: '60px' }}>
        {/* Updates styled in Parchment Paper */}
        <div className="material-paper" style={{ padding: '24px', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
          <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '10px', color: 'var(--neon-yellow)', textShadow: 'none' }}>
            SCROLL OF CHRONICLES (UPDATES)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px dashed var(--panel-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-primary)' }}>The Timber Trials Event</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>Today</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Chop frosted pines, claim multiplier awards, and unlock rare viking and samurai cosmetics from the merchant!
              </p>
            </div>
            
            <div style={{ borderBottom: '1px dashed var(--panel-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-primary)' }}>Update 1.4: Slate Physics</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>Yesterday</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                We've added smooth linear branch slide interpolations to make high-rate chopping feel fluid even at 60fps.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-primary)' }}>PWA Synchronization</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>3 days ago</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Your statistics, shop achievements, and inventory items are cached locally and synchronized instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights styled in textured Canvas */}
        <div className="material-canvas" style={{ padding: '24px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '10px', color: 'var(--text-secondary)', textShadow: 'none' }}>
              REWARDS & INTEGRITY DESK
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Sun size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>Seasonal Tournaments</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Compete with lumberjacks globally on the Rankings tab to secure trophies and copper medals.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>Daily Contracts</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Complete challenges to earn coins to buy legendary woodcutters and axes.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px' }}>
              <div style={{ color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Shield size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)' }}>Protected Telemetry</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Security systems verify client-side chop times to maintain fair competition.
                </p>
              </div>
            </div>
          </div>

          <div className="material-leather" style={{ marginTop: '24px', padding: '10px', textAlign: 'center', color: 'var(--neon-yellow)' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-retro)' }}>
              EQUIPPED HERO: {equippedChar.replace('char_', '').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Illustrated Forest Night Footer with Fireflies */}
      <footer style={{
        margin: '80px -12px 0',
        padding: '60px 24px 80px',
        background: 'linear-gradient(180deg, transparent 0%, var(--bg-color) 100%)',
        borderTop: '3px solid var(--panel-border)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Silhouetted Trees illustration */}
        <div style={{
          fontSize: '2.5rem',
          opacity: 0.1,
          letterSpacing: '12px',
          marginBottom: '20px',
          userSelect: 'none',
          color: '#5c8c5c'
        }}>
          🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲🌲
        </div>
        
        <h3 className="retro-title" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          INFINITE CHOP
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          A premium retro woodcutting ecosystem. Handcrafted by design enthusiasts.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Studio Hub</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Press Deck</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Privacy Policy</a>
        </div>
        
        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
          BUILD v1.4.2-STABLE | DB MODE: LOCAL-FIRST
        </div>
      </footer>

      {/* Cinematic Trailer Modal */}
      {showTrailer && (
        <CinematicVideoPlayer 
          src="https://ik.imagekit.io/xqdg6zpy8/Cinematic_Game_Trailer_Prompt%20(online-video-cutter.com).mp4" 
          onClose={() => setShowTrailer(false)} 
        />
      )}

      {/* World Atlas Pop-up Modal */}
      {showAtlas && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(8, 10, 20, 0.98)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'none',
          padding: '24px'
        }}>
          <div className="material-wood animate-glow" style={{
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 25px rgba(6,182,212,0.2)',
            padding: '28px',
            background: 'var(--panel-bg)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <div style={{ textAlign: 'left' }}>
                  <h3 className="retro-title" style={{ fontSize: '1.15rem', color: 'var(--neon-cyan)', margin: 0, textShadow: 'none' }}>
                    WORLD ATLAS DIRECTORY
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    A global directory of all 18 infinite worlds, weather patterns, and environmental modifiers.
                  </p>
                </div>
              </div>
              <button
                className="neon-btn-magenta"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                }}
                onClick={() => setShowAtlas(false)}
              >
                ✕
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(0,0,0,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              {/* Search */}
              <input
                type="text"
                placeholder="Search worlds by name..."
                className="form-input"
                style={{ maxWidth: '280px', height: '36px', fontSize: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
                value={atlasSearch}
                onChange={(e) => setAtlasSearch(e.target.value)}
              />

              {/* Toggle status */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAtlasFilter(f)}
                    className="retro-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.65rem',
                      borderRadius: '4px',
                      background: atlasFilter === f ? 'var(--neon-yellow)' : 'transparent',
                      color: atlasFilter === f ? '#000' : 'var(--text-secondary)',
                      borderColor: atlasFilter === f ? 'var(--neon-yellow)' : 'var(--panel-border)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Grid Container */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '16px',
                padding: '2px'
              }}>
                {worlds
                  .filter(world => {
                    const matchesSearch = world.name.toLowerCase().includes(atlasSearch.toLowerCase());
                    const matchesFilter = atlasFilter === 'all'
                      ? true
                      : (atlasFilter === 'unlocked' ? world.unlocked : !world.unlocked);
                    return matchesSearch && matchesFilter;
                  })
                  .map(world => {
                    const isSelected = selectedWorldId === world.id;
                    let bgGrad = 'linear-gradient(135deg, var(--panel-bg), var(--bg-color))';
                    let wAccent = 'var(--panel-border)';
                    let wIcon = '🌲';
                    let wText = 'Sunny Breeze';
                    let mText = '🪵 Standard Logs';
                    let sectorName = 'NATURE';

                    const sec = getSectorForWorld(world.id);
                    if (sec === 'nature') sectorName = '🌲 NATURE';
                    else if (sec === 'urban') sectorName = '🏙️ URBAN';
                    else if (sec === 'hazard') sectorName = '☣️ HAZARD';
                    else if (sec === 'special') sectorName = '✨ SPECIAL';

                    if (world.id === 'world_forest') { bgGrad = 'linear-gradient(135deg, #1f3020, #131e13)'; wAccent = 'var(--neon-green)'; wIcon = '🍃'; wText = 'Falling Leaves'; mText = '🪵 Standard Logs'; }
                    else if (world.id === 'world_city') { bgGrad = 'linear-gradient(135deg, #1b2230, #101520)'; wAccent = 'var(--neon-cyan)'; wIcon = '☁️'; wText = 'Heavy Fog'; mText = '🏢 High-rise Balkons'; }
                    else if (world.id === 'world_ice') { bgGrad = 'linear-gradient(135deg, #112835, #08151f)'; wAccent = 'var(--neon-cyan)'; wIcon = '❄️'; wText = 'Heavy Blizzard'; mText = '❄️ Freezing Frost'; }
                    else if (world.id === 'world_cyber') { bgGrad = 'linear-gradient(135deg, #2b172d, #18091a)'; wAccent = 'var(--neon-magenta)'; wIcon = '🔋'; wText = 'Neon Surge'; mText = '🔌 Cyber Grid'; }
                    else if (world.id === 'world_volcano') { bgGrad = 'linear-gradient(135deg, #301711, #1b0905)'; wAccent = 'var(--neon-red)'; wIcon = '🌋'; wText = 'Magma Rain'; mText = '🌋 Magma Splashes'; }
                    else if (world.id === 'world_autumn') { bgGrad = 'linear-gradient(135deg, #2c2013, #191007)'; wAccent = 'var(--neon-yellow)'; wIcon = '🍂'; wText = 'Maple Swirl'; mText = '🍁 Floating Leaves'; }
                    else if (world.id === 'world_desert') { bgGrad = 'linear-gradient(135deg, #2d2a13, #1a1807)'; wAccent = 'var(--neon-yellow)'; wIcon = '🏜️'; wText = 'Sandstorm Wind'; mText = '🏜️ Sandstorm Wind'; }
                    else if (world.id === 'world_haunted') { bgGrad = 'linear-gradient(135deg, #181024, #0c0617)'; wAccent = '#4de680'; wIcon = '👻'; wText = 'Eerie Fog'; mText = '🕯️ Vignette Dark'; }
                    else if (world.id === 'world_space') { bgGrad = 'linear-gradient(135deg, #0f172a, #020617)'; wAccent = '#00ffff'; wIcon = '☄️'; wText = 'Asteroid Storm'; mText = '🛸 Asteroid Alert'; }
                    else if (world.id === 'world_wasteland') { bgGrad = 'linear-gradient(135deg, #142116, #09100a)'; wAccent = '#aee50d'; wIcon = '🤢'; wText = 'Acid Rain'; mText = '☣️ Acid Sludge'; }
                    else if (world.id === 'world_steampunk') { bgGrad = 'linear-gradient(135deg, #2b1810, #140804)'; wAccent = '#ffaa66'; wIcon = '💨'; wText = 'Venting Smog'; mText = '⚙️ Steampunk Steam'; }
                    else if (world.id === 'world_candy') { bgGrad = 'linear-gradient(135deg, #351c22, #200d11)'; wAccent = '#e11d48'; wIcon = '🍬'; wText = 'Candy Confetti'; mText = '🍭 Sweet & Sour'; }
                    else if (world.id === 'world_zen') { bgGrad = 'linear-gradient(135deg, #1c1218, #0f090d)'; wAccent = '#ffb7c5'; wIcon = '🌸'; wText = 'Cherry Blossoms'; mText = '🌸 Serene Peace'; }
                    else if (world.id === 'world_coral') { bgGrad = 'linear-gradient(135deg, #09212d, #041017)'; wAccent = '#00ffff'; wIcon = '🫧'; wText = 'Deep Sea Bubbles'; mText = '🌊 Sea Resistance'; }
                    else if (world.id === 'world_cyberpunk') { bgGrad = 'linear-gradient(135deg, #140d21, #0a0612)'; wAccent = '#39ff14'; wIcon = '⚡'; wText = 'Neon Rain'; mText = '🏙️ Glitch Speed'; }
                    else if (world.id === 'world_prehistoric') { bgGrad = 'linear-gradient(135deg, #2b1c10, #140b05)'; wAccent = '#ff4500'; wIcon = '🦖'; wText = 'Volcano Ash'; mText = '🌋 Dino Tremors'; }
                    else if (world.id === 'world_sky') { bgGrad = 'linear-gradient(135deg, #18283a, #0a131c)'; wAccent = '#ffd700'; wIcon = '☁️'; wText = 'Drifting Clouds'; mText = '💨 Windy Gusts'; }
                    else if (world.id === 'world_arcade') { bgGrad = 'linear-gradient(135deg, #09090b, #000000)'; wAccent = '#ff007f'; wIcon = '👾'; wText = 'Glitch Pixels'; mText = '🕹️ High Tempo'; }

                    return (
                      <div
                        key={world.id}
                        className="material-leather"
                        style={{
                          background: bgGrad,
                          border: `2px solid ${isSelected ? 'var(--neon-yellow)' : (world.unlocked ? wAccent : 'var(--panel-border)')}`,
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '180px',
                          cursor: 'pointer',
                          opacity: world.unlocked ? 1 : 0.85,
                          boxShadow: isSelected ? '0 0 15px rgba(229,169,59,0.3)' : 'none',
                          transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                          willChange: 'transform',
                          transform: 'translateZ(0)',
                          textAlign: 'left'
                        }}
                        onClick={() => {
                          if (world.unlocked) {
                            handleWorldSelect(world);
                            setShowAtlas(false);
                          }
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
                              {sectorName}
                            </span>
                            <span style={{ fontSize: '1.25rem' }}>{wIcon}</span>
                          </div>
                          
                          <h4 className="retro-title" style={{ fontSize: '0.75rem', margin: '4px 0 2px', textShadow: 'none', color: isSelected ? 'var(--neon-yellow)' : 'var(--text-primary)' }}>
                            {world.name}
                          </h4>
                          
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '4px 0 8px', lineHeight: '1.4' }}>
                            {world.description}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            <span className="rarity-tag" style={{ fontSize: '0.58rem', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)' }}>
                              {wText}
                            </span>
                            <span className="rarity-tag" style={{ fontSize: '0.58rem', padding: '1px 4px', background: 'rgba(0,0,0,0.2)', color: wAccent, border: `1px solid ${wAccent}33` }}>
                              {mText}
                            </span>
                          </div>

                          {!world.unlocked ? (
                            <button
                              className="neon-btn-yellow"
                              style={{ width: '100%', padding: '6px 0', fontSize: '0.65rem', fontWeight: 'bold' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWorldSelect(world);
                              }}
                            >
                              🔓 UNLOCK FOR {world.cost} {world.currency === 'coins' ? '🪙' : '💎'}
                            </button>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>
                              <span>✓ UNLOCKED</span>
                              {isSelected && <span style={{ color: 'var(--neon-yellow)' }}>● ACTIVE</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
