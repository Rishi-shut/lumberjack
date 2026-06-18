import React, { useState } from 'react';
import { Award, Zap, Trophy, Clock, CheckCircle2, User, Sparkles } from 'lucide-react';
import { db, UserProfile, Achievement } from '../utils/LocalStorageDB';

interface DashboardProps {
  user: UserProfile;
  achievements: Achievement[];
  onEquipChange: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  achievements,
  onEquipChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'achievements'>('stats');

  // Format seconds to hh:mm:ss
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    
    const h = hrs > 0 ? `${hrs}h ` : '';
    const m = mins > 0 ? `${mins}m ` : '';
    const s = `${remainingSecs}s`;
    
    return `${h}${m}${s}`;
  };

  const BADGES = ['Chop Icon', 'Star Badge', 'Gold Trophy', 'Cyber Core'];
  const FRAMES = ['Standard', 'Foliage Glow', 'Frozen Crystal', 'Volcanic Ash'];

  const handleEquipProfile = (badge: string, frame: string) => {
    db.equipProfileDetails(badge, frame);
    onEquipChange();
  };

  // Circular XP progress ring calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const xpPct = Math.min(100, Math.max(0, (user.xp / user.xpNeeded) * 100));
  const strokeDashoffset = circumference - (xpPct / 100) * circumference;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      {/* Adventurer's Logbook Book Layout */}
      <div className="book-layout" style={{ marginTop: '20px' }}>
        
        {/* LEFT PAGE: Profile & Level Ring (Wooden Panel) */}
        <div 
          className="material-wood" 
          style={{ 
            padding: '32px 24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--panel-bg)',
            alignSelf: 'start',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <User size={18} style={{ color: 'var(--neon-yellow)' }} />
            <h3 className="retro-title" style={{ fontSize: '0.85rem', margin: 0, color: 'var(--neon-yellow)' }}>
              CHARACTER DIARY
            </h3>
          </div>

          {/* Title Rank Badge */}
          <div style={{ marginBottom: '16px' }}>
            <span className="rarity-tag rarity-legendary" style={{ fontSize: '9px', letterSpacing: '1px' }}>
              🎖️ {user.equippedTitle}
            </span>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
            {user.username}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-retro)', marginBottom: '28px' }}>
            {user.email || 'guest_lumberjack_mode'}
          </p>

          {/* Premium Circular XP Progression Ring */}
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '28px' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Circle Slot */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="rgba(0,0,0,0.06)" 
                strokeWidth="8" 
              />
              {/* Progress Circle Fill */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="var(--neon-yellow)" 
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)' }}
              />
            </svg>
            
            {/* Level inside circle */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-retro)', color: 'var(--text-secondary)', display: 'block' }}>LVL</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)' }}>{user.level}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            <strong>{user.xp} / {user.xpNeeded} XP</strong> to next level.
          </p>

          {/* Profile Cosmetics Customizer */}
          <div style={{ width: '100%', borderTop: '1px dashed var(--panel-border)', paddingTop: '24px' }}>
            <h4 className="retro-title" style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', marginBottom: '16px', textAlign: 'left' }}>
              ENGRAVE PROFILE DETAILS
            </h4>
            
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Equipped Badge
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BADGES.map(badge => {
                  const isCurrent = user.equippedBadge === badge;
                  return (
                    <button
                      key={badge}
                      className="neon-btn-cyan"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.65rem',
                        background: isCurrent ? 'var(--neon-cyan)' : 'transparent',
                        color: isCurrent ? '#000' : 'var(--neon-cyan)',
                        borderWidth: '2px',
                        boxShadow: 'none'
                      }}
                      onClick={() => handleEquipProfile(badge, user.equippedFrame)}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Equipped Border Frame
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FRAMES.map(frame => {
                  const isCurrent = user.equippedFrame === frame;
                  return (
                    <button
                      key={frame}
                      className="neon-btn-magenta"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.65rem',
                        background: isCurrent ? 'var(--neon-magenta)' : 'transparent',
                        color: isCurrent ? '#000' : 'var(--neon-magenta)',
                        borderWidth: '2px',
                        boxShadow: 'none'
                      }}
                      onClick={() => handleEquipProfile(user.equippedBadge, frame)}
                    >
                      {frame}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PAGE: Stats & Achievements (Aged Parchment Scroll) */}
        <div 
          className="material-paper" 
          style={{ 
            padding: '32px 28px',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
          }}
        >
          {/* Scroll Tabs */}
          <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid var(--panel-border)', marginBottom: '24px', paddingBottom: '4px' }}>
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: activeSubTab === 'stats' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: '900',
                cursor: 'pointer',
                borderBottom: '3px solid',
                borderColor: activeSubTab === 'stats' ? 'var(--neon-cyan)' : 'transparent',
                paddingBottom: '8px',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setActiveSubTab('stats')}
            >
              Overview & Stats
            </button>
            
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: activeSubTab === 'achievements' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                fontWeight: '900',
                cursor: 'pointer',
                borderBottom: '3px solid',
                borderColor: activeSubTab === 'achievements' ? 'var(--neon-cyan)' : 'transparent',
                paddingBottom: '8px',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setActiveSubTab('achievements')}
            >
              Achievements ({achievements.filter(a => a.unlocked).length} / {achievements.length})
            </button>
          </div>

          {/* Sub Tab: STATS */}
          {activeSubTab === 'stats' && (
            <div>
              {/* Highlight Stats Panels */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px', 
                  marginBottom: '24px' 
                }}
              >
                <div style={{ background: '#f5ecd6', border: '2px solid #e9dcb9', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <Trophy size={22} style={{ color: '#8c5922', marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.65rem', color: '#7c654e', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>High Score</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b2410', fontFamily: 'var(--font-retro)', marginTop: '4px' }}>
                    {user.highScore}
                  </div>
                </div>

                <div style={{ background: '#f5ecd6', border: '2px solid #e9dcb9', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <Zap size={22} style={{ color: '#9a2415', marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.65rem', color: '#7c654e', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Max Combo</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b2410', fontFamily: 'var(--font-retro)', marginTop: '4px' }}>
                    {user.maxCombo}x
                  </div>
                </div>

                <div style={{ background: '#f5ecd6', border: '2px solid #e9dcb9', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <Award size={22} style={{ color: '#5c8c5c', marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.65rem', color: '#7c654e', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Total Chops</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#3b2410', marginTop: '4px' }}>
                    {user.stats.totalChops.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#f5ecd6', border: '2px solid #e9dcb9', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                  <Clock size={22} style={{ color: '#2563eb', marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.65rem', color: '#7c654e', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Time Logged</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#3b2410', marginTop: '6px' }}>
                    {formatTime(user.stats.timePlayed)}
                  </div>
                </div>
              </div>

              {/* Statistics Table */}
              <div style={{ background: '#f5ecd6', border: '2px solid #e9dcb9', borderRadius: '8px', padding: '20px' }}>
                <h3 className="retro-title" style={{ fontSize: '0.78rem', marginBottom: '16px', color: '#8c5922', textShadow: 'none' }}>
                  DETAILED LEDGER
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e9dcb9', paddingBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#7c654e' }}>Contracts/Games Run</span>
                    <span style={{ fontWeight: '800', color: '#3b2410' }}>{user.stats.gamesPlayed}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e9dcb9', paddingBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#7c654e' }}>Treasury Chests Opened</span>
                    <span style={{ fontWeight: '800', color: '#3b2410' }}>{user.stats.totalChestsOpened}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e9dcb9', paddingBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#7c654e' }}>Total Gold Minted</span>
                    <span style={{ fontWeight: '800', color: '#8c5922' }}>🪙 {user.stats.totalCoinsEarned.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#7c654e' }}>Total Gems Gathered</span>
                    <span style={{ fontWeight: '800', color: '#2563eb' }}>💎 {user.stats.totalDiamondsEarned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: ACHIEVEMENTS */}
          {activeSubTab === 'achievements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {achievements.map(ach => (
                <div 
                  key={ach.id} 
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: ach.unlocked ? '#ebf5eb' : '#f5ecd6',
                    border: '2px solid',
                    borderColor: ach.unlocked ? '#c2e0c2' : '#e9dcb9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      color: ach.unlocked ? '#388e3c' : '#7c654e',
                      background: ach.unlocked ? '#c2e0c2' : '#e9dcb9',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {ach.unlocked ? <CheckCircle2 size={18} /> : <Award size={18} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3b2410', margin: 0 }}>
                          {ach.title}
                        </h4>
                        {ach.unlocked && (
                          <span style={{ fontSize: '0.62rem', color: '#388e3c', fontFamily: 'var(--font-retro)', fontWeight: 'bold' }}>
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#4d3a24', fontSize: '0.78rem', margin: '2px 0 0' }}>
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress & Reward bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#7c654e' }}>
                      <span>Progress: {ach.current} / {ach.target}</span>
                      <span style={{ fontWeight: 'bold' }}>
                        Reward: {ach.rewardCoins > 0 ? `🪙 ${ach.rewardCoins}` : ''} {ach.rewardDiamonds > 0 ? `💎 ${ach.rewardDiamonds}` : ''}
                      </span>
                    </div>
                    
                    <div className="progress-bar-container" style={{ height: '6px', background: '#e9dcb9', border: '1px solid #ccc1ab' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${Math.min(100, (ach.current / ach.target) * 100)}%`,
                          backgroundColor: ach.unlocked ? '#388e3c' : '#8c7662' 
                        }}
                      ></div>
                    </div>
                    
                    {ach.unlockedAt && (
                      <span style={{ fontSize: '0.65rem', color: '#7c654e', textAlign: 'right', fontStyle: 'italic' }}>
                        Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
