import React from 'react';
import { Play, Shield, Globe, Award, Sparkles, ChevronRight, Moon, Wind, Sun } from 'lucide-react';
import { db, ShopItem } from '../utils/LocalStorageDB';

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

  const handleWorldSelect = (world: ShopItem) => {
    if (world.unlocked) {
      onPlayWorld(world.id);
    } else {
      showConfirm(
        'Unlock World',
        `Unlock ${world.name} for ${world.cost} ${world.currency}?`,
        () => {
          const res = db.purchaseShopItem(world.id);
          if (res.success) {
            showAlert('World Unlocked', `${world.name} unlocked!`);
            onPurchaseComplete();
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
          background: 'linear-gradient(180deg, #3d281a 0%, #1e130d 100%)',
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
            backgroundColor: '#1b120c',
            border: '3px solid #422a1b',
            borderTop: 'none',
            borderBottom: 'none',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#2e1c12' }} />
            <div style={{ width: '100%', height: '4px', backgroundColor: '#2e1c12' }} />
            <div style={{ width: '100%', height: '4px', backgroundColor: '#2e1c12' }} />
            {/* Tree Branch */}
            <div style={{
              position: 'absolute',
              right: '-36px',
              top: '30px',
              width: '36px',
              height: '14px',
              backgroundColor: '#1b120c',
              border: '3px solid #422a1b',
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
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
          <button 
            className="neon-btn-yellow" 
            style={{ fontSize: '0.95rem', padding: '14px 36px' }}
            onClick={() => onPlayWorld('world_forest')}
          >
            <Play size={16} style={{ display: 'inline', marginRight: '6px', fill: 'currentColor' }} />
            PLAY NOW
          </button>
          
          <button 
            className="neon-btn" 
            style={{ fontSize: '0.95rem', padding: '14px 30px' }}
            onClick={() => {
              const element = document.getElementById('world-selection');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            CHOOSE WORLD
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
          boxShadow: 'inset 0 0 20px rgba(184,142,83,0.2), 0 8px 16px rgba(0,0,0,0.3)'
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
            <Award size={18} style={{ color: '#8c5922' }} />
            <h3 className="retro-title" style={{ color: '#5c3b1e', fontSize: '0.9rem', textShadow: 'none', margin: 0 }}>
              DAILY CHALLENGE NOTES
            </h3>
          </div>
          
          <h2 style={{ fontSize: '1.25rem', color: '#3b2410', fontWeight: '800', marginBottom: '10px' }}>
            The Frozen Timber Trial
          </h2>
          
          <p style={{ fontSize: '0.92rem', color: '#4d3a24', lineHeight: '1.5', marginBottom: '16px' }}>
            Achieve a score of **180 logs** on the Frost Mountain world. You must navigate heavy snow piles and fast branch decay.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem' }}>🪙</span>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#5c3b1e', fontFamily: 'var(--font-retro)' }}>+400 COINS</span>
            </div>
            
            <div style={{ fontSize: '0.78rem', color: '#7c654e', fontFamily: 'var(--font-retro)' }}>
              ENDS IN: 12h 44m
            </div>

            <button 
              className="neon-btn-yellow" 
              style={{ padding: '8px 20px', fontSize: '0.75rem', borderWidth: '2px' }}
              onClick={() => onPlayWorld('world_ice')}
            >
              ACCEPT CONTRACT
            </button>
          </div>
        </div>
      </div>

      {/* Difficulty Selector Panel */}
      <div 
        className="material-wood" 
        style={{ 
          padding: '24px', 
          marginBottom: '40px',
          background: 'linear-gradient(135deg, #2b1d14, #22160f)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '2px dashed #422a1b', paddingBottom: '12px' }}>
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
        
        <div className="grid-3" style={{ marginBottom: '50px' }}>
          {worlds.map(world => {
            let bgGradient = 'linear-gradient(135deg, #251e18, #18130f)';
            let accent = '#422a1b';
            let weatherIcon = '☀️';
            let weatherText = 'Sunny Breeze';

            if (world.id === 'world_forest') {
              bgGradient = 'linear-gradient(135deg, #1b291d, #101912)';
              accent = 'var(--neon-green)';
              weatherIcon = '🍃';
              weatherText = 'Falling Leaves';
            }
            if (world.id === 'world_city') {
              bgGradient = 'linear-gradient(135deg, #2b2520, #1c1815)';
              accent = 'var(--neon-cyan)';
              weatherIcon = '☁️';
              weatherText = 'Foggy Forest';
            }
            if (world.id === 'world_ice') {
              bgGradient = 'linear-gradient(135deg, #1b262e, #10181e)';
              accent = 'var(--neon-cyan)';
              weatherIcon = '❄️';
              weatherText = 'Heavy Blizzard';
            }
            if (world.id === 'world_cyber') {
              bgGradient = 'linear-gradient(135deg, #2d1b22, #1d1015)';
              accent = 'var(--neon-magenta)';
              weatherIcon = '🔥';
              weatherText = 'Ember Storm';
            }
            if (world.id === 'world_volcano') {
              bgGradient = 'linear-gradient(135deg, #301a14, #1f100c)';
              accent = 'var(--neon-red)';
              weatherIcon = '🌋';
              weatherText = 'Magma Rain';
            }

            return (
              <div 
                key={world.id}
                className="material-wood"
                style={{
                  background: bgGradient,
                  borderWidth: '3px',
                  borderColor: world.unlocked ? accent : '#3d2c20',
                  opacity: world.unlocked ? 1 : 0.82,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '220px',
                  padding: '20px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.45)'
                }}
                onClick={() => handleWorldSelect(world)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  if (world.unlocked) e.currentTarget.style.boxShadow = `0 10px 20px rgba(0,0,0,0.6), 0 0 10px ${accent}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.45)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 className="retro-title" style={{ fontSize: '0.95rem', margin: 0, textShadow: 'none', color: '#fff' }}>
                      {world.name}
                    </h3>
                    {world.unlocked ? (
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
                  background: 'linear-gradient(180deg, #322116, #23160e)',
                  textAlign: 'center',
                  borderWidth: '3px',
                  borderColor: isEquipped ? 'var(--neon-yellow)' : '#3d2c20',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
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
        <div className="material-paper" style={{ padding: '24px', color: '#2b2112', boxShadow: '0 6px 12px rgba(0,0,0,0.15)' }}>
          <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '2px solid #e9dcb9', paddingBottom: '10px', color: '#8c5922', textShadow: 'none' }}>
            SCROLL OF CHRONICLES (UPDATES)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px dashed #e9dcb9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#3b2410' }}>The Timber Trials Event</h4>
                <span style={{ fontSize: '0.72rem', color: '#7c654e', fontFamily: 'var(--font-retro)' }}>Today</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#5c4b3c', lineHeight: '1.4' }}>
                Chop frosted pines, claim multiplier awards, and unlock rare viking and samurai cosmetics from the merchant!
              </p>
            </div>
            
            <div style={{ borderBottom: '1px dashed #e9dcb9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#3b2410' }}>Update 1.4: Slate Physics</h4>
                <span style={{ fontSize: '0.72rem', color: '#7c654e', fontFamily: 'var(--font-retro)' }}>Yesterday</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#5c4b3c', lineHeight: '1.4' }}>
                We've added smooth linear branch slide interpolations to make high-rate chopping feel fluid even at 60fps.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#3b2410' }}>PWA Synchronization</h4>
                <span style={{ fontSize: '0.72rem', color: '#7c654e', fontFamily: 'var(--font-retro)' }}>3 days ago</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#5c4b3c', lineHeight: '1.4' }}>
                Your statistics, shop achievements, and inventory items are cached locally and synchronized instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights styled in textured Canvas */}
        <div className="material-canvas" style={{ padding: '24px', color: '#423525', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '2px solid #ccc1ab', paddingBottom: '10px', color: '#68543f', textShadow: 'none' }}>
              REWARDS & INTEGRITY DESK
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ color: '#68543f', background: 'rgba(0,0,0,0.04)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Sun size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#423525' }}>Seasonal Tournaments</h4>
                <p style={{ fontSize: '0.8rem', color: '#685a4a', lineHeight: '1.4' }}>
                  Compete with lumberjacks globally on the Rankings tab to secure trophies and copper medals.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px', marginBottom: '18px' }}>
              <div style={{ color: '#68543f', background: 'rgba(0,0,0,0.04)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#423525' }}>Daily Contracts</h4>
                <p style={{ fontSize: '0.8rem', color: '#685a4a', lineHeight: '1.4' }}>
                  Complete challenges to earn coins to buy legendary woodcutters and axes.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '14px' }}>
              <div style={{ color: '#68543f', background: 'rgba(0,0,0,0.04)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <Shield size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#423525' }}>Protected Telemetry</h4>
                <p style={{ fontSize: '0.8rem', color: '#685a4a', lineHeight: '1.4' }}>
                  Security systems verify client-side chop times to maintain fair competition.
                </p>
              </div>
            </div>
          </div>

          <div className="material-leather" style={{ marginTop: '24px', padding: '10px', textAlign: 'center', color: '#e5a93b' }}>
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
        background: 'linear-gradient(180deg, transparent 0%, #0c0806 100%)',
        borderTop: '3px solid #2b1d14',
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
    </div>
  );
};

export default Home;
