import React, { useState } from 'react';
import { Award, Zap, Heart, Trophy, Clock, CheckCircle2 } from 'lucide-react';
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

  // Badges & Frames options
  const BADGES = ['Chop Icon', 'Star Badge', 'Gold Trophy', 'Cyber Core'];
  const FRAMES = ['Standard', 'Foliage Glow', 'Frozen Crystal', 'Volcanic Ash'];

  const handleEquipProfile = (badge: string, frame: string) => {
    db.equipProfileDetails(badge, frame);
    onEquipChange();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Info */}
      <div className="game-card" style={{ marginBottom: '30px', borderLeft: '4px solid var(--neon-cyan)', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.04) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="rarity-tag rarity-legendary" style={{ fontSize: '10px' }}>Rank: {user.equippedTitle}</span>
              {user.isGuest && <span className="rarity-tag rarity-common" style={{ fontSize: '8px' }}>GUEST</span>}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{user.username}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ID: {user.email || 'offline_guest_mode'}</p>
          </div>

          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: '600' }}>Level {user.level}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{user.xp} / {user.xpNeeded} XP</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(user.xp / user.xpNeeded) * 100}%`, backgroundColor: 'var(--neon-cyan)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="tab-headers">
        <button 
          className={`tab-btn ${activeSubTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stats')}
        >
          Overview & Stats
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('achievements')}
        >
          Achievements ({achievements.filter(a => a.unlocked).length} / {achievements.length})
        </button>
      </div>

      {/* Sub Tab: STATS */}
      {activeSubTab === 'stats' && (
        <div>
          {/* Main Stat Cards */}
          <div className="grid-4" style={{ marginBottom: '30px' }}>
            <div className="game-card" style={{ textAlign: 'center', padding: '16px' }}>
              <Trophy size={28} style={{ color: 'var(--neon-yellow)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>High Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-retro)', marginTop: '4px' }}>{user.highScore}</div>
            </div>

            <div className="game-card" style={{ textAlign: 'center', padding: '16px' }}>
              <Zap size={28} style={{ color: 'var(--neon-magenta)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Max Combo</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-retro)', marginTop: '4px' }}>{user.maxCombo}x</div>
            </div>

            <div className="game-card" style={{ textAlign: 'center', padding: '16px' }}>
              <Award size={28} style={{ color: 'var(--neon-green)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Chops</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '4px' }}>{user.stats.totalChops.toLocaleString()}</div>
            </div>

            <div className="game-card" style={{ textAlign: 'center', padding: '16px' }}>
              <Clock size={28} style={{ color: 'var(--neon-cyan)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time Played</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '12px' }}>{formatTime(user.stats.timePlayed)}</div>
            </div>
          </div>

          <div className="grid-2">
            {/* General Stats Table */}
            <div className="game-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
                GENERAL STATISTICS
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Matches Played</span>
                  <span style={{ fontWeight: '600' }}>{user.stats.gamesPlayed}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Chests Opened</span>
                  <span style={{ fontWeight: '600' }}>{user.stats.totalChestsOpened}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Coins Earned</span>
                  <span style={{ fontWeight: '600', color: 'var(--neon-yellow)' }}>🪙 {user.stats.totalCoinsEarned.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Gems Earned</span>
                  <span style={{ fontWeight: '600', color: 'var(--neon-cyan)' }}>💎 {user.stats.totalDiamondsEarned}</span>
                </div>
              </div>
            </div>

            {/* Profile Customizer Custom Details */}
            <div className="game-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
                PROFILE BADGE & FRAME
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Equipped Badge</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {BADGES.map(badge => (
                    <button
                      key={badge}
                      className="neon-btn-cyan"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.65rem',
                        background: user.equippedBadge === badge ? 'var(--neon-cyan)' : 'transparent',
                        color: user.equippedBadge === badge ? '#000' : 'var(--neon-cyan)',
                      }}
                      onClick={() => handleEquipProfile(badge, user.equippedFrame)}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Equipped Profile Frame</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {FRAMES.map(frame => (
                    <button
                      key={frame}
                      className="neon-btn-magenta"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.65rem',
                        background: user.equippedFrame === frame ? 'var(--neon-magenta)' : 'transparent',
                        color: user.equippedFrame === frame ? '#000' : 'var(--neon-magenta)',
                      }}
                      onClick={() => handleEquipProfile(user.equippedBadge, frame)}
                    >
                      {frame}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: ACHIEVEMENTS */}
      {activeSubTab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {achievements.map(ach => (
            <div 
              key={ach.id} 
              className="game-card" 
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                borderLeft: ach.unlocked ? '4px solid var(--neon-green)' : '4px solid var(--panel-border)',
                background: ach.unlocked ? 'linear-gradient(90deg, rgba(57,255,20,0.02) 0%, transparent 100%)' : 'rgba(255,255,255,0.01)'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  color: ach.unlocked ? 'var(--neon-green)' : 'var(--text-secondary)',
                  background: ach.unlocked ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.03)',
                  padding: '12px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {ach.unlocked ? <CheckCircle2 size={24} /> : <Award size={24} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: ach.unlocked ? '#fff' : 'var(--text-secondary)' }}>{ach.title}</h4>
                    {ach.unlocked && <span style={{ fontSize: '0.7rem', color: 'var(--neon-green)', fontFamily: 'var(--font-retro)' }}>UNLOCKED</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ach.description}</p>
                </div>
              </div>

              {/* Progress and rewards */}
              <div style={{ minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Progress: {ach.current} / {ach.target}</span>
                  <span>
                    Reward: {ach.rewardCoins > 0 ? `🪙 ${ach.rewardCoins}` : ''} {ach.rewardDiamonds > 0 ? `💎 ${ach.rewardDiamonds}` : ''}
                  </span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, (ach.current / ach.target) * 100)}%`,
                      backgroundColor: ach.unlocked ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)' 
                    }}
                  ></div>
                </div>
                {ach.unlockedAt && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                    Unlocked at: {new Date(ach.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Dashboard;
