import React from 'react';
import { Play, Shield, Globe, Award, Sparkles } from 'lucide-react';
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
      // Prompt buy
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

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.08) 0%, transparent 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.03)',
        marginBottom: '30px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontFamily: 'var(--font-retro)',
          color: 'var(--neon-green)',
          textTransform: 'uppercase',
          letterSpacing: '3px'
        }}>
          ★ Limited Time Event: Cyber Week Live ★
        </div>

        <h1 className="retro-title" style={{ fontSize: '3rem', margin: '20px 0', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>
          INFINITE CHOP
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          Chop structures. Dodge branches. Survive the timer. Master the infinite rhythmic arcade sensation!
        </p>

        {/* Big CTA */}
        <button 
          className="neon-btn" 
          style={{ fontSize: '1rem', padding: '16px 40px', animation: 'pulseNeon 2s infinite' }}
          onClick={() => onPlayWorld('world_forest')}
        >
          <Play size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          INSTANT PLAY
        </button>
      </div>

      {/* Difficulty Selector Panel */}
      <div className="game-card" style={{ marginBottom: '40px', borderLeft: '4px solid var(--neon-cyan)' }}>
        <h3 className="retro-title" style={{ fontSize: '0.85rem', textAlign: 'left', marginBottom: '14px', color: 'var(--neon-cyan)' }}>
          SELECT DIFFICULTY (CURRENT: {difficulty.toUpperCase()})
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {difficulties.map(diff => {
            const isActive = difficulty === diff.id;
            let themeColor = 'var(--neon-green)';
            if (diff.id === 'hard') themeColor = 'var(--neon-cyan)';
            if (diff.id === 'extreme') themeColor = 'var(--neon-yellow)';
            if (diff.id === 'nightmare' || diff.id === 'impossible') themeColor = 'var(--neon-magenta)';

            return (
              <button
                key={diff.id}
                style={{
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: isActive ? `2px solid ${themeColor}` : '2px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 10px ${themeColor}33` : 'none'
                }}
                onClick={() => onDifficultyChange(diff.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: isActive ? 'white' : 'var(--text-secondary)' }}>{diff.name}</span>
                  <span style={{ fontSize: '0.7rem', color: themeColor, fontWeight: 'bold' }}>{diff.multiplier}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Timer: {diff.timer}</div>
              </button>
            );
          })}
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          💡 <em>{difficulties.find(d => d.id === difficulty)?.desc}</em> Gaining XP and coins scales with the multiplier.
        </p>
      </div>

      {/* World Selection Grid */}
      <h2 className="retro-title" style={{ fontSize: '1rem', textAlign: 'left', marginBottom: '20px', color: 'var(--neon-cyan)' }}>
        SELECT ENVIRONMENT
      </h2>
      
      <div className="grid-3" style={{ marginBottom: '40px' }}>
        {worlds.map(world => {
          let bgGradient = 'linear-gradient(135deg, #1e2530, #141923)';
          let accent = 'var(--panel-border)';
          if (world.id === 'world_forest') { bgGradient = 'linear-gradient(135deg, #1b351b, #0c180c)'; accent = 'var(--neon-green)'; }
          if (world.id === 'world_city') { bgGradient = 'linear-gradient(135deg, #1a1b35, #0a0a18)'; accent = 'var(--neon-cyan)'; }
          if (world.id === 'world_ice') { bgGradient = 'linear-gradient(135deg, #1b3135, #081214)'; accent = 'var(--neon-cyan)'; }
          if (world.id === 'world_cyber') { bgGradient = 'linear-gradient(135deg, #2b0c35, #0a0210)'; accent = 'var(--neon-magenta)'; }
          if (world.id === 'world_volcano') { bgGradient = 'linear-gradient(135deg, #351b0c, #140802)'; accent = 'var(--neon-red)'; }

          return (
            <div 
              key={world.id}
              className="game-card"
              style={{
                background: bgGradient,
                border: world.unlocked ? `1px solid ${accent}` : '1px solid var(--panel-border)',
                cursor: 'pointer',
                opacity: world.unlocked ? 1 : 0.75,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '180px',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleWorldSelect(world)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                if (world.unlocked) e.currentTarget.style.boxShadow = `0 0 15px ${accent}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{world.name}</h3>
                  {world.unlocked ? (
                    <span style={{ color: 'var(--neon-green)', fontSize: '0.75rem', fontFamily: 'var(--font-retro)' }}>READY</span>
                  ) : (
                    <span style={{ color: 'var(--neon-yellow)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      🔑 {world.cost} {world.currency}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{world.description}</p>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="rarity-tag" style={{
                  background: world.rarity === 'common' ? '#4b5563' : (world.rarity === 'rare' ? '#2563eb' : (world.rarity === 'epic' ? '#7c3aed' : '#d97706'))
                }}>{world.rarity}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {world.id === 'world_cyber' ? '⚡ Cyber Grid / Lasers' : (world.id === 'world_ice' ? '❄️ Ice Blocks / Snow' : '🌲 Standard obstacles')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Sections */}
      <div className="grid-2" style={{ marginBottom: '40px' }}>
        {/* News Feed */}
        <div className="game-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', color: 'var(--neon-cyan)' }}>
            LATEST UPDATES
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Cyber Week Event Live!</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>2 hours ago</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Chop Cyber Tower cores, unlock the Neon Grid world, and equip the limited edition Plasma Cutter weapon now available in the store!
              </p>
            </div>
            
            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Update 1.3: Volcanic Ash & Easing</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1 day ago</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                We've added linear log easing slide calculations to make high-rate chopping feel significantly smoother. Magma cores are now live.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Offline Synchronization Added</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>3 days ago</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your scores and purchases are now fully cached locally and synchronized with the platform databases automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="game-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', color: 'var(--neon-green)' }}>
              CHALLENGES & PERKS
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--neon-green)', background: 'rgba(57,255,20,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <Award size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Global Competitions</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Compete with thousands of woodcutters on the Global Leaderboards for high scores and coins.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--neon-cyan)', background: 'rgba(0,240,255,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Daily & Weekly Missions</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Complete simple daily challenges to earn coins and gems to unlock legendary cosmetic skins.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px' }}>
              <div style={{ color: 'var(--neon-magenta)', background: 'rgba(255,0,255,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <Shield size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Anti-Cheat Telemetry</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Secure client-side algorithms monitor speed and combo rates to keep the ecosystem fair.</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Active character equipped: <strong>{equippedChar.replace('char_', '').toUpperCase()}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
