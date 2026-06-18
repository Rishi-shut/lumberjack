import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, User, ShoppingCart, Trophy, Settings as SettingsIcon, ShieldAlert, Coins, Sparkles, LogOut, CheckSquare } from 'lucide-react';
import { db, UserProfile, ShopItem, Achievement, GameMission, LeaderboardEntry } from './utils/LocalStorageDB';
import { sound } from './utils/AudioEngine';
import CanvasGame from './components/CanvasGame';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Shop from './pages/Shop';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Missions from './pages/Missions';

import './main.css';

// Animated XP Bar component for post-game details
const XpProgressBar: React.FC<{
  oldLevel: number;
  oldXp: number;
  oldXpNeeded: number;
  newLevel: number;
  newXp: number;
  newXpNeeded: number;
  xpEarned: number;
}> = ({ oldLevel, oldXp, oldXpNeeded, newLevel, newXp, newXpNeeded, xpEarned }) => {
  const [level, setLevel] = useState(oldLevel);
  const [xp, setXp] = useState(oldXp);
  const [xpNeeded, setXpNeeded] = useState(oldXpNeeded);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLevel(newLevel);
      setXp(newXp);
      setXpNeeded(newXpNeeded);
    }, 300);
    return () => clearTimeout(timer);
  }, [newLevel, newXp, newXpNeeded]);

  const pct = (xp / xpNeeded) * 100;

  return (
    <div style={{ margin: '15px 0', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
        <span style={{ fontWeight: '600' }}>Level {level} Progression</span>
        <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>+{xpEarned} XP ({xp}/{xpNeeded})</span>
      </div>
      <div className="progress-bar-container" style={{ height: '8px' }}>
        <div 
          className="progress-bar-fill" 
          style={{ 
            width: `${pct}%`, 
            backgroundColor: 'var(--neon-cyan)',
            transition: 'width 1.2s cubic-bezier(0.1, 0.8, 0.3, 1)' 
          }}
        ></div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  // Database States
  const [user, setUser] = useState<UserProfile>(db.getUser());
  const [shopItems, setShopItems] = useState<ShopItem[]>(db.getShop());
  const [achievements, setAchievements] = useState<Achievement[]>(db.getAchievements());
  const [missions, setMissions] = useState<GameMission[]>(db.getMissions());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(db.getLeaderboard());

  // Routing State
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'shop' | 'leaderboard' | 'missions' | 'settings' | 'admin'>('home');
  
  // Scroll tracker for navigation hiding
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cursor tracker
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  const getActiveEnvClass = (page: string) => {
    switch (page) {
      case 'home': return 'env-forest';
      case 'dashboard': return 'env-cabin';
      case 'shop': return 'env-workshop';
      case 'missions': return 'env-village';
      case 'leaderboard': return 'env-castle';
      case 'settings': return 'env-cabin';
      case 'admin': return 'env-stone';
      default: return 'env-forest';
    }
  };

  // Loading Screen States & Effects
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTip, setLoadingTip] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  const tips = [
    "Tip: Avoid branches. They are wood, you are flesh. Wood wins.",
    "Fact: The Infinite Tree grows 10 meters every time you look away.",
    "Tip: Vikings chop faster, but samurai look cooler doing it.",
    "Fact: Samurai have trained for generations just to chop a pine tree.",
    "Tip: Check the Shop for rare weapons! A golden axe increases style by 100%.",
    "Tip: Claim your Daily Challenge reward. Warm gold is the best gold.",
    "Tip: You can use A/D or Left/Right arrow keys to chop on either side."
  ];

  useEffect(() => {
    setLoadingTip(tips[Math.floor(Math.random() * tips.length)]);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, []);

  // Game Play States
  const [activeWorld, setActiveWorld] = useState<string | null>(null);
  const [lastActiveWorld, setLastActiveWorld] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  const [gameSummary, setGameSummary] = useState<{
    score: number;
    maxCombo: number;
    coins: number;
    diamonds: number;
    xpEarned: number;
    levelsGained: number;
    newHighScore: boolean;
    banned?: boolean;
    reason?: string;
    oldLevel: number;
    oldXp: number;
    oldXpNeeded: number;
    newLevel: number;
    newXp: number;
    newXpNeeded: number;
  } | null>(null);

  // Custom Alert/Confirm Modal State
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false
  });

  const showAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      isConfirm: false
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      isConfirm: true,
      onConfirm: () => {
        onConfirm();
        setCustomModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Sync state from LocalStorage DB helper
  const refreshState = () => {
    setUser(db.getUser());
    setShopItems(db.getShop());
    setAchievements(db.getAchievements());
    setMissions(db.getMissions());
    setLeaderboard(db.getLeaderboard());
  };

  // Switch to gameplay
  const handlePlayWorld = (worldId: string) => {
    setActiveWorld(worldId);
    setLastActiveWorld(worldId);
    setGameStartTime(Date.now());
  };

  // Capture Score and submit session
  const handleGameOver = (score: number, maxCombo: number, coinsCollected: number, diamondsCollected: number) => {
    if (!activeWorld) return;

    const timeSpent = (Date.now() - gameStartTime) / 1000;
    const worldName = shopItems.find(w => w.id === activeWorld)?.name || 'Pine Forest';

    // Apply difficulty rewards multiplier
    const mult = difficulty === 'easy' ? 0.5 :
                 difficulty === 'hard' ? 1.5 :
                 difficulty === 'extreme' ? 2.0 :
                 difficulty === 'nightmare' ? 3.0 :
                 difficulty === 'impossible' ? 5.0 : 1.0;

    const finalCoins = Math.floor(coinsCollected * mult);
    const finalDiamonds = Math.floor(diamondsCollected * mult);
    const xpEarned = Math.floor((score + Math.floor(timeSpent * 2)) * mult);

    const oldLevel = user.level;
    const oldXp = user.xp;
    const oldXpNeeded = user.xpNeeded;

    // Submit session with basic anti-cheat check
    const res = db.submitGameSession(
      score,
      maxCombo,
      finalCoins,
      finalDiamonds,
      worldName,
      timeSpent
    );

    // Save summary details
    setGameSummary({
      score,
      maxCombo,
      coins: finalCoins,
      diamonds: finalDiamonds,
      xpEarned: xpEarned,
      levelsGained: res.levelsGained || 0,
      newHighScore: res.newHighScore || false,
      banned: res.banned,
      reason: res.reason,
      oldLevel,
      oldXp,
      oldXpNeeded,
      newLevel: res.currentLevel || oldLevel,
      newXp: res.currentXp || oldXp,
      newXpNeeded: res.xpNeeded || oldXpNeeded
    });

    // Exit game loop and show summary modal
    setActiveWorld(null);
    setShowSummary(true);
    refreshState();
  };

  // Close summary modal
  const handleCloseSummary = () => {
    setShowSummary(false);
    setGameSummary(null);
  };

  const handleManualReset = () => {
    db.adminResetAllData();
    refreshState();
  };

  // Banned screen view
  if (user.isBanned) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0c0f16',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 51, 0, 0.08)',
          border: '2px solid var(--neon-red)',
          borderRadius: '16px',
          padding: '40px 24px',
          maxWidth: '500px',
          boxShadow: '0 0 30px rgba(255, 51, 0, 0.3)'
        }}>
          <ShieldAlert size={64} style={{ color: 'var(--neon-red)', marginBottom: '20px', animation: 'bounceSlow 2s infinite' }} />
          <h2 className="retro-title" style={{ color: 'var(--neon-red)', fontSize: '1.2rem', marginBottom: '16px' }}>ACCESS SUSPENDED</h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
            Our security telemetry system flagged an anomaly matching rapid speed-chopping parameters. Account <strong>{user.username}</strong> is banned.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="neon-btn-magenta" onClick={handleManualReset}>
              RESTORE ACCOUNT (RESET DATA)
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Use the simulator reset to wipe local storage cache and restart clean.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen Gameplay Overlay
  if (activeWorld) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#000' }}>
        {/* Back Button */}
        <button
          className="neon-btn-cyan"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10000,
            padding: '8px 16px',
            fontSize: '0.65rem'
          }}
          onClick={() => {
            sound.stopMusic();
            setActiveWorld(null);
            refreshState();
          }}
        >
          ← EXIT RUN
        </button>

        <CanvasGame
          worldId={activeWorld}
          characterId={user.equippedCharacter}
          weaponId={user.equippedWeapon}
          trailId={user.equippedTrail}
          difficulty={difficulty}
          onGameOver={handleGameOver}
          onScoreUpdate={() => {}}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#17110c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
        color: '#fbf5f0'
      }}>
        <div className="material-wood" style={{
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 12px 24px rgba(0,0,0,0.6)'
        }}>
          {/* Animated lumberjack chopping */}
          <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'breathAnim 1s infinite ease-in-out' }}>
            🪓🌳
          </div>
          
          <h2 className="retro-title" style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--neon-yellow)' }}>
            LOADING ECOSYSTEM
          </h2>
          
          {/* Progress bar */}
          <div className="progress-bar-container" style={{ height: '12px', margin: '20px 0', width: '100%' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${loadingProgress}%`, 
                backgroundColor: 'var(--neon-cyan)',
                transition: 'width 0.2s ease' 
              }}
            ></div>
          </div>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-retro)', marginBottom: '24px' }}>
            {Math.min(100, loadingProgress)}%
          </div>

          <div className="material-paper" style={{ padding: '16px', borderRadius: '8px', width: '100%' }}>
            <p style={{ fontStyle: 'italic', fontSize: '0.9rem', margin: 0, color: '#2b2112' }}>
              "{loadingTip}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  const themeClass = user.level >= 20 ? 'theme-wood-gold' :
                     user.level >= 15 ? 'theme-wood-frost' :
                     user.level >= 10 ? 'theme-wood-redwood' :
                     user.level >= 5 ? 'theme-wood-birch' : 'theme-wood-oak';

  return (
    <div className={`app-container ${themeClass} env-container ${getActiveEnvClass(currentPage)}`}>
      {/* Custom golden particle cursor */}
      <div 
        className="custom-particle-cursor" 
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      />
      {/* Top Header Stats */}
      <header className={`floating-nav ${showNav ? '' : 'hidden'}`}>

        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '1.4rem',
            lineHeight: 1
          }}>
            {user.equippedCharacter === 'char_lumberjack' ? '🪓' : (user.equippedCharacter === 'char_viking' ? '🛡️' : (user.equippedCharacter === 'char_knight' ? '⚔️' : (user.equippedCharacter === 'char_samurai' ? '🥷' : (user.equippedCharacter === 'char_wizard' ? '🧙' : (user.equippedCharacter === 'char_alien' ? '👽' : '🤖')))))}
          </span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.username}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>LVL {user.level}</div>
          </div>
        </div>

        <div className="stat-chip" style={{ color: 'var(--neon-yellow)' }}>
          <Coins />
          <span>{user.coins.toLocaleString()}</span>
        </div>

        <div className="stat-chip" style={{ color: 'var(--neon-cyan)' }}>
          <Sparkles />
          <span>{user.diamonds}</span>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <nav className="sidebar-desktop">
        <div className="sidebar-logo">
          INFINITE CHOP
        </div>
        <ul className="sidebar-menu">
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
              <HomeIcon size={18} /> Home Play
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
              <User size={18} /> Dashboard
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'shop' ? 'active' : ''}`} onClick={() => setCurrentPage('shop')}>
              <ShoppingCart size={18} /> Storefront
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'missions' ? 'active' : ''}`} onClick={() => setCurrentPage('missions')}>
              <CheckSquare size={18} /> Missions
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'leaderboard' ? 'active' : ''}`} onClick={() => setCurrentPage('leaderboard')}>
              <Trophy size={18} /> Rankings
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
              <SettingsIcon size={18} /> Settings
            </button>
          </li>
          <li>
            <button className={`sidebar-item-btn ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => setCurrentPage('admin')}>
              <ShieldAlert size={18} /> Admin Control
            </button>
          </li>
        </ul>

        {/* Footer info in sidebar */}
        <div style={{ marginTop: 'auto', padding: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--panel-border)' }}>
          <div style={{ fontWeight: '600' }}>Local-First Sync</div>
          <div>Database: <strong>LocalStorage</strong></div>
        </div>
      </nav>

      {/* Bottom Nav Bar (Mobile) */}
      <nav className={`navbar-mobile ${showNav ? '' : 'hidden'}`}>
        <button className={`navbar-mobile-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
          <HomeIcon /> Home
        </button>
        <button className={`navbar-mobile-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
          <User /> Profile
        </button>
        <button className={`navbar-mobile-item ${currentPage === 'shop' ? 'active' : ''}`} onClick={() => setCurrentPage('shop')}>
          <ShoppingCart /> Store
        </button>
        <button className={`navbar-mobile-item ${currentPage === 'missions' ? 'active' : ''}`} onClick={() => setCurrentPage('missions')}>
          <CheckSquare /> Missions
        </button>
        <button className={`navbar-mobile-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
          <SettingsIcon /> Settings
        </button>
      </nav>

      {/* Main Pages Content Router */}
      <main className="main-content">
        {currentPage === 'home' && (
          <Home
            onPlayWorld={handlePlayWorld}
            userCoins={user.coins}
            userDiamonds={user.diamonds}
            onPurchaseComplete={refreshState}
            equippedChar={user.equippedCharacter}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'dashboard' && (
          <Dashboard
            user={user}
            achievements={achievements}
            onEquipChange={refreshState}
          />
        )}
        {currentPage === 'shop' && (
          <Shop
            user={user}
            shopItems={shopItems}
            onPurchaseComplete={refreshState}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'missions' && (
          <Missions
            user={user}
            missions={missions}
            onMissionClaim={refreshState}
            showAlert={showAlert}
          />
        )}
        {currentPage === 'leaderboard' && (
          <Leaderboard
            user={user}
            leaderboard={leaderboard}
          />
        )}
        {currentPage === 'settings' && (
          <Settings
            user={user}
            onSettingsChange={refreshState}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
        {currentPage === 'admin' && (
          <Admin
            user={user}
            onAdminChange={refreshState}
            showAlert={showAlert}
            showConfirm={showConfirm}
          />
        )}
      </main>

      {/* Post-Game Summary Modal overlay */}
      {showSummary && gameSummary && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          padding: '16px'
        }}>
          <div className="game-card" style={{
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)',
            animation: 'bounceSlow 2s infinite'
          }}>
            <h2 className="retro-title" style={{ color: 'var(--neon-red)', fontSize: '1.25rem', marginBottom: '8px' }}>
              {gameSummary.banned ? 'CHEATING DETECTED' : 'GAME OVER'}
            </h2>
            
            {gameSummary.newHighScore && !gameSummary.banned && (
              <span className="rarity-tag rarity-legendary" style={{ display: 'inline-block', marginBottom: '16px', animation: 'pulseNeon 1s infinite' }}>
                ★ NEW HIGH SCORE ★
              </span>
            )}

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '16px', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Score Achieved</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-retro)', fontSize: '0.8rem' }}>{gameSummary.score}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Max Combo</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-retro)', fontSize: '0.8rem', color: 'var(--neon-magenta)' }}>{gameSummary.maxCombo}x</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>XP Accumulated</span>
                <span style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>+{gameSummary.xpEarned} XP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Earnings</span>
                <span style={{ fontWeight: 'bold', color: 'var(--neon-yellow)' }}>
                  🪙 +{gameSummary.coins} {gameSummary.diamonds > 0 ? `💎 +${gameSummary.diamonds}` : ''}
                </span>
              </div>
            </div>

            {/* Animated XP progression bar */}
            <XpProgressBar
              oldLevel={gameSummary.oldLevel}
              oldXp={gameSummary.oldXp}
              oldXpNeeded={gameSummary.oldXpNeeded}
              newLevel={gameSummary.newLevel}
              newXp={gameSummary.newXp}
              newXpNeeded={gameSummary.newXpNeeded}
              xpEarned={gameSummary.xpEarned}
            />

            {gameSummary.levelsGained > 0 && (
              <div style={{ padding: '8px', background: 'rgba(57,255,20,0.05)', border: '1px solid var(--neon-green)', borderRadius: '6px', color: 'var(--neon-green)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '20px' }}>
                🎉 LEVEL UP! You reached Level {user.level}!
              </div>
            )}

            {gameSummary.banned && (
              <div style={{ padding: '8px', background: 'rgba(255,51,0,0.08)', border: '1px solid var(--neon-red)', borderRadius: '6px', color: 'var(--neon-red)', fontSize: '0.75rem', marginBottom: '20px' }}>
                Telemetry flagged Speed limit. Ban will lock on return to home.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="neon-btn-magenta" style={{ flex: 1 }} onClick={handleCloseSummary}>
                RETURN TO HUB
              </button>
              {!gameSummary.banned && (
                <button 
                  className="neon-btn-cyan" 
                  style={{ flex: 1 }} 
                  onClick={() => {
                    handleCloseSummary();
                    if (lastActiveWorld) {
                      handlePlayWorld(lastActiveWorld);
                    }
                  }}
                >
                  RETRY RUN
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Alert/Confirm Popup Dialog */}
      {customModal.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-container">
            <h3 className="custom-modal-title">{customModal.title}</h3>
            <p className="custom-modal-message">{customModal.message}</p>
            <div className="custom-modal-actions">
              {customModal.isConfirm ? (
                <>
                  <button className="neon-btn-magenta" onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}>
                    CANCEL
                  </button>
                  <button className="neon-btn-cyan" onClick={() => {
                    if (customModal.onConfirm) customModal.onConfirm();
                  }}>
                    CONFIRM
                  </button>
                </>
              ) : (
                <button className="neon-btn-cyan" style={{ padding: '12px 36px' }} onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
