import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Shield, Globe, Award, Sparkles, ChevronRight, Moon, Wind, Sun } from 'lucide-react';
import { db, ShopItem } from '../utils/LocalStorageDB';

// Custom Interactive Cinematic HTML5 Video Player
const CinematicVideoPlayer: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(true);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Auto-play video
    video.play().catch(() => setIsPlaying(false));

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  const togglePlay = () => {
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
    const video = videoRef.current;
    if (!video) return;
    const seekTime = Number(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = Number(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
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
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', cursor: 'pointer' }} onClick={togglePlay}>
          <video
            ref={videoRef}
            src={src}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loop
            playsInline
          />
          
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
  showConfirm
}) => {
  const shopItems = db.getShop();
  const worlds = shopItems.filter(item => item.type === 'world');

  const [selectedWorldId, setSelectedWorldId] = useState<string>('world_forest');
  const [showTrailer, setShowTrailer] = useState(false);

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

  const featuredCharacters = [
    { id: 'char_lumberjack', name: 'Lumberjack', icon: '🪓', rarity: 'common', description: 'The original oak feller. Simple, reliable.' },
    { id: 'char_viking', name: 'Viking', icon: '🛡️', rarity: 'rare', description: 'Chops for Valhalla! Extra raw strength.' },
    { id: 'char_knight', name: 'Knight', icon: '⚔️', rarity: 'rare', description: 'Chopping in heavy armor. Sturdy and chivalrous.' },
    { id: 'char_samurai', name: 'Samurai', icon: '🥷', rarity: 'epic', description: 'Chops with lightning speed and focus.' },
    { id: 'char_wizard', name: 'Wizard', icon: '🧙', rarity: 'epic', description: 'Uses fireballs to disintegrate logs.' },
    { id: 'char_alien', name: 'Alien', icon: '👽', rarity: 'legendary', description: 'Equipped with laser beams and space wisdom.' },
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
            {equippedChar === 'char_lumberjack' ? '🪓' : (equippedChar === 'char_viking' ? '🛡️' : (equippedChar === 'char_knight' ? '⚔️' : (equippedChar === 'char_samurai' ? '🥷' : (equippedChar === 'char_wizard' ? '🧙' : (equippedChar === 'char_alien' ? '👽' : '🤖')))))}
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
            The Frozen Timber Trial
          </h2>
          
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
            Achieve a score of **180 logs** on the Frost Mountain world. You must navigate heavy snow piles and fast branch decay.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>🪙</span>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-retro)' }}>+400 COINS</span>
            </div>
            
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
              ENDS IN: 12h 44m
            </div>

            <button 
              className="neon-btn-yellow" 
              style={{ padding: '8px 20px', fontSize: '0.75rem', borderWidth: '2px' }}
              onClick={() => {
                setSelectedWorldId('world_ice');
                setTimeout(() => {
                  const deck = document.getElementById('departure-deck');
                  if (deck) deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
            >
              ACCEPT CONTRACT
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
                  background: isActive ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.15)',
                  border: '3px solid',
                  borderColor: isActive ? themeColor : '#3d2c20',
                  borderTopColor: isActive ? themeColor : '#4a3628',
                  borderBottomColor: isActive ? themeColor : '#2b1e15',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  transform: isActive ? 'scale(1.02) translateY(-1px)' : 'none',
                  boxShadow: isActive ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
                }}
                onClick={() => {
                  onDifficultyChange(diff.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: isActive ? 'white' : 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
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
      <div id="world-selection" style={{ scrollMarginTop: '100px' }}>
        <h2 className="retro-title" style={{ fontSize: '1rem', textAlign: 'left', marginBottom: '20px', color: 'var(--neon-yellow)' }}>
          SELECT NATURE SECTOR
        </h2>
        
        <div className="grid-3" style={{ marginBottom: '30px' }}>
          {worlds.map(world => {
            let bgGradient = 'linear-gradient(135deg, var(--panel-bg), var(--bg-color))';
            let accent = 'var(--panel-border)';
            let weatherIcon = '☀️';
            let weatherText = 'Sunny Breeze';

            if (world.id === 'world_forest') {
              bgGradient = 'linear-gradient(135deg, #f1faf2, #e2f0e4)';
              accent = 'var(--neon-green)';
              weatherIcon = '🍃';
              weatherText = 'Falling Leaves';
            }
            if (world.id === 'world_city') {
              bgGradient = 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
              accent = 'var(--neon-cyan)';
              weatherIcon = '☁️';
              weatherText = 'Foggy Forest';
            }
            if (world.id === 'world_ice') {
              bgGradient = 'linear-gradient(135deg, #ecfeff, #cfe2fe)';
              accent = 'var(--neon-cyan)';
              weatherIcon = '❄️';
              weatherText = 'Heavy Blizzard';
            }
            if (world.id === 'world_cyber') {
              bgGradient = 'linear-gradient(135deg, #fdf4ff, #fae8ff)';
              accent = 'var(--neon-magenta)';
              weatherIcon = '🔥';
              weatherText = 'Ember Storm';
            }
            if (world.id === 'world_volcano') {
              bgGradient = 'linear-gradient(135deg, #fff7ed, #ffedd5)';
              accent = 'var(--neon-red)';
              weatherIcon = '🌋';
              weatherText = 'Magma Rain';
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
                  boxShadow: isSelected ? '0 0 20px rgba(229,169,59,0.5), 0 6px 12px rgba(0,0,0,0.6)' : '0 6px 12px rgba(0,0,0,0.45)'
                }}
                onClick={() => handleWorldSelect(world)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  if (world.unlocked) {
                    e.currentTarget.style.boxShadow = isSelected 
                      ? '0 0 25px rgba(229,169,59,0.8), 0 10px 20px rgba(0,0,0,0.6)' 
                      : `0 10px 20px rgba(0,0,0,0.6), 0 0 10px ${accent}33`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSelected 
                    ? '0 0 20px rgba(229,169,59,0.5), 0 6px 12px rgba(0,0,0,0.45)' 
                    : '0 6px 12px rgba(0,0,0,0.45)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 className="retro-title" style={{ fontSize: '0.95rem', margin: 0, textShadow: 'none', color: '#fff' }}>
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.5', margin: '8px 0 16px' }}>
                    {world.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>{weatherIcon}</span>
                    <span>{weatherText}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #422a1b', paddingTop: '10px' }}>
                    <span className={`rarity-tag rarity-${world.rarity}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
                      {world.rarity}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {world.id === 'world_cyber' ? '🔌 Laser Beams' : (world.id === 'world_ice' ? '🏔️ Slippery Slopes' : '🪵 Standard Logs')}
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
                {selectedWorldId === 'world_forest' ? '🌲' : (selectedWorldId === 'world_city' ? '🏙️' : (selectedWorldId === 'world_ice' ? '🏔️' : (selectedWorldId === 'world_cyber' ? '🔌' : '🌋')))} {selectedWorld?.name || 'Forest'}
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
                {equippedChar === 'char_lumberjack' ? '🪓 Lumberjack' : (equippedChar === 'char_viking' ? '🛡️ Viking' : (equippedChar === 'char_knight' ? '⚔️ Knight' : (equippedChar === 'char_samurai' ? '🥷 Samurai' : (equippedChar === 'char_wizard' ? '🧙 Wizard' : (equippedChar === 'char_alien' ? '👽 Alien' : '🤖 Android')))))}
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

      {/* Featured Characters Carousel Section */}
      <div style={{ marginBottom: '50px' }}>
        <h2 className="retro-title" style={{ fontSize: '1rem', textAlign: 'left', marginBottom: '20px', color: 'var(--neon-cyan)' }}>
          FEATURED CHALLENGERS
        </h2>

        <div 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            padding: '4px 4px 16px',
            scrollbarWidth: 'thin',
          }}
        >
          {featuredCharacters.map(char => {
            const isEquipped = equippedChar === char.id;
            return (
              <div
                key={char.id}
                className="material-wood"
                style={{
                  minWidth: '220px',
                  flex: '0 0 auto',
                  padding: '20px',
                  background: 'linear-gradient(180deg, var(--panel-bg), var(--bg-color))',
                  textAlign: 'center',
                  borderWidth: '3px',
                  borderColor: isEquipped ? 'var(--neon-yellow)' : 'var(--panel-border)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.06)'
                }}
              >
                <div 
                  className="character-breath"
                  style={{ 
                    fontSize: '3rem', 
                    marginBottom: '12px', 
                    display: 'inline-block',
                    animationDelay: char.id === 'char_lumberjack' ? '0s' : '0.3s'
                  }}
                >
                  {char.icon}
                </div>
                
                <h4 className="retro-title" style={{ fontSize: '0.8rem', margin: '0 0 6px', textShadow: 'none', color: '#fff' }}>
                  {char.name}
                </h4>
                
                <span className={`rarity-tag rarity-${char.rarity}`} style={{ fontSize: '8px', padding: '2px 6px', display: 'inline-block', marginBottom: '10px' }}>
                  {char.rarity}
                </span>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.4', margin: 0 }}>
                  {char.description}
                </p>
                
                {isEquipped && (
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)', marginTop: '12px' }}>
                    ★ ACTIVE
                  </div>
                )}
              </div>
            );
          })}
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
        
        <h3 className="retro-title" style={{ fontSize: '0.9rem', color: '#8c7662', marginBottom: '8px' }}>
          INFINITE CHOP
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          A premium retro woodcutting ecosystem. Handcrafted by design enthusiasts.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.78rem', color: '#8c7662', marginBottom: '28px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Studio Hub</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Press Deck</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>Privacy Policy</a>
        </div>
        
        <div style={{ fontSize: '0.62rem', color: '#5a493a', fontFamily: 'var(--font-retro)' }}>
          BUILD v1.4.2-STABLE | DB MODE: LOCAL-FIRST
        </div>
      </footer>

      {/* Cinematic Trailer Modal */}
      {showTrailer && (
        <CinematicVideoPlayer 
          src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" 
          onClose={() => setShowTrailer(false)} 
        />
      )}
    </div>
  );
};

export default Home;
