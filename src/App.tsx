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
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'shop' | 'leaderboard' | 'missions' | 'settings' | 'admin' | '404'>('home');
  
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

  // Mobile dropdown state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Active nature sector selection state to dynamically sync dashboard theme
  const [selectedWorldId, setSelectedWorldId] = useState<string>('world_forest');


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
        backgroundColor: 'var(--bg-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)'
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

  const activeWorldId = activeWorld || selectedWorldId;
  const themeClass = activeWorldId === 'world_cyber' ? 'theme-wood-gold' :
                     activeWorldId === 'world_ice' ? 'theme-wood-frost' :
                     activeWorldId === 'world_volcano' ? 'theme-wood-redwood' :
                     activeWorldId === 'world_city' ? 'theme-wood-birch' :
                     activeWorldId === 'world_autumn' ? 'theme-wood-gold' :
                     activeWorldId === 'world_desert' ? 'theme-wood-redwood' : 'theme-wood-oak';

  const navItems = [
    { id: 'home', label: 'PLAY', icon: <HomeIcon size={16} /> },
    { id: 'dashboard', label: 'JOURNAL', icon: <User size={16} /> },
    { id: 'shop', label: 'MERCHANT', icon: <ShoppingCart size={16} /> },
    { id: 'missions', label: 'BULLETIN', icon: <CheckSquare size={16} /> },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: <Trophy size={16} /> },
    { id: 'settings', label: 'SETTINGS', icon: <SettingsIcon size={16} /> },
    { id: 'admin', label: 'ADMIN', icon: <ShieldAlert size={16} /> }
  ];

  return (
    <div className={`app-container ${themeClass} env-container ${getActiveEnvClass(currentPage)}`}>


      {/* Premium Dynamic Parallax Backdrop */}
      <div className="premium-backdrop">
        <div className="backdrop-layer sky-bg"></div>
        <div className="backdrop-layer stars-layer"></div>
        <div className="backdrop-layer mountains-layer">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <path d="M0,240 L120,170 L240,220 L360,130 L480,210 L600,120 L720,200 L840,110 L960,190 L1080,130 L1200,210 L1320,140 L1440,240 L1440,320 L0,320 Z" fill="#dbd0c0" opacity="0.45"/>
            <path d="M0,280 L180,210 L360,270 L540,190 L720,260 L900,180 L1080,250 L1260,200 L1440,280 L1440,320 L0,320 Z" fill="#cbbfae"/>
          </svg>
        </div>
        <div className="backdrop-layer fog-layer"></div>
        <div className="backdrop-layer fireflies-layer">
          <div className="firefly" style={{ left: '12%', top: '68%', animationDelay: '0s', animationDuration: '4s' }}></div>
          <div className="firefly" style={{ left: '38%', top: '58%', animationDelay: '1.2s', animationDuration: '5.5s' }}></div>
          <div className="firefly" style={{ left: '62%', top: '74%', animationDelay: '2.5s', animationDuration: '3.8s' }}></div>
          <div className="firefly" style={{ left: '88%', top: '48%', animationDelay: '0.8s', animationDuration: '4.8s' }}></div>
          <div className="firefly" style={{ left: '25%', top: '82%', animationDelay: '3.1s', animationDuration: '5.2s' }}></div>
          <div className="firefly" style={{ left: '78%', top: '64%', animationDelay: '1.9s', animationDuration: '4.2s' }}></div>
        </div>
      </div>

      {/* Unified Top Floating Navbar */}
      <header className={`floating-nav ${showNav ? '' : 'hidden'}`}>
        
        {/* Left Side: Game Logo */}
        <div 
          onClick={() => { sound.playCoin(); setCurrentPage('home'); setShowMobileMenu(false); }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            color: 'var(--neon-yellow)',
            cursor: 'pointer',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}
        >
          <span>🪓</span>
          <span style={{ letterSpacing: '1px' }}>INFINITE CHOP</span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="desktop-only-nav" style={{ display: 'flex', gap: '4px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { sound.playCoin(); setCurrentPage(item.id as any); }}
              className={`sidebar-item-btn ${currentPage === item.id ? 'active' : ''}`}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'none',
                borderRadius: '6px',
                width: 'auto'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Side: Treasury & Hamburger (Mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Treasury details (Desktop only) */}
          <div className="desktop-only-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="stat-chip" style={{ color: 'var(--neon-yellow)', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--neon-yellow)', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px' }}>
              <span>🪙 {user.coins.toLocaleString()}</span>
            </div>
            <div className="stat-chip" style={{ color: 'var(--neon-cyan)', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--neon-cyan)', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '6px' }}>
              <span>💎 {user.diamonds}</span>
            </div>
          </div>

          {/* Hamburger Menu Trigger (Mobile only) */}
          <button 
            className="mobile-only-nav-trigger"
            onClick={() => { sound.playCoin(); setShowMobileMenu(prev => !prev); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 10px'
            }}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Dropdown Menu scroll */}
        {showMobileMenu && (
          <div className="nav-dropdown">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  sound.playCoin();
                  setCurrentPage(item.id as any);
                  setShowMobileMenu(false);
                }}
                className={`nav-dropdown-item ${currentPage === item.id ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            
            {/* Mobile User Treasury Info */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px dashed var(--panel-border)', paddingTop: '12px', marginTop: '4px' }}>
              <div className="stat-chip" style={{ color: 'var(--neon-yellow)', flex: 1, justifyContent: 'center', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid var(--neon-yellow)', borderRadius: '6px', padding: '6px 12px' }}>
                <span>🪙 {user.coins.toLocaleString()}</span>
              </div>
              <div className="stat-chip" style={{ color: 'var(--neon-cyan)', flex: 1, justifyContent: 'center', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid var(--neon-cyan)', borderRadius: '6px', padding: '6px 12px' }}>
                <span>💎 {user.diamonds}</span>
              </div>
            </div>
          </div>
        )}
      </header>


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
            selectedWorldId={selectedWorldId}
            setSelectedWorldId={setSelectedWorldId}
          />
        )}
        {currentPage === 'dashboard' && (
          <Dashboard
            user={user}
            achievements={achievements}
            onEquipChange={refreshState}
            leaderboard={leaderboard}
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
            setCurrentPage={setCurrentPage}
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
        {currentPage === '404' && (
          <div className="material-wood" style={{ padding: '65px 24px', textAlign: 'center', maxWidth: '480px', margin: '40px auto', background: 'var(--panel-bg)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'breathAnim 1.5s infinite ease-in-out' }}>
              🪓💥🪵
            </div>
            
            <h2 className="retro-title" style={{ fontSize: '1.3rem', color: 'var(--neon-red)', marginBottom: '16px' }}>
              PAGE CHOPPED! (404)
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '28px' }}>
              Oh no! The Lumberjack got a bit too enthusiastic and accidentally chopped down this page. Nothing but splinters left here!
            </p>

            <button 
              className="neon-btn-yellow" 
              onClick={() => { sound.playCoin(); setCurrentPage('home'); }}
            >
              RETURN TO HUB
            </button>
          </div>
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
