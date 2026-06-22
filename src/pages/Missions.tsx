import React from 'react';
import { Award, CheckCircle, Gift } from 'lucide-react';
import { db, GameMission, UserProfile } from '../utils/LocalStorageDB';

interface MissionsProps {
  user: UserProfile;
  missions: GameMission[];
  onMissionClaim: () => void;
  showAlert: (title: string, message: string) => void;
}

export const Missions: React.FC<MissionsProps> = ({
  user,
  missions,
  onMissionClaim,
  showAlert
}) => {
  const dailyMissions = missions.filter(m => m.type === 'daily');
  const weeklyMissions = missions.filter(m => m.type === 'weekly');
  const legendaryMissions = missions.filter(m => m.type === 'legendary');

  const handleClaim = (missionId: string) => {
    const res = db.claimMissionReward(missionId);
    if (res.success) {
      showAlert('Reward Claimed', `Claimed reward! +🪙 ${res.coins} Coins, +💎 ${res.diamonds} Gems.`);
      onMissionClaim();
    } else {
      showAlert('Claim Failed', `Claim failed: ${res.reason}`);
    }
  };

  const renderMissionCard = (mission: GameMission) => {
    const isCompleted = mission.current >= mission.target;
    const progressPct = Math.min(100, (mission.current / mission.target) * 100);
    const isLegendary = mission.type === 'legendary';
    
    // Handcrafted alternating micro-rotation for the pinned look
    const charCodeSum = mission.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rotation = (charCodeSum % 2 === 0) ? 'rotate(-1deg)' : 'rotate(1.2deg)';

    const cardShadow = isLegendary ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '0 6px 12px rgba(0,0,0,0.02)';
    const pinColor = isLegendary ? '#d97706' : '#3a3a3a';
    const pinGradient = isLegendary ? 'radial-gradient(circle at 4px 4px, #fbbf24 0%, #b45309 80%)' : 'radial-gradient(circle at 4px 4px, #5c5c5c 0%, #1a1a1a 80%)';
    const pinBorder = isLegendary ? '2px solid #b45309' : '2px solid #1c1c1c';

    return (
      <div 
        key={mission.id}
        className="material-paper"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '24px 20px 20px',
          position: 'relative',
          transform: rotation,
          opacity: mission.claimed ? 0.72 : 1,
          color: 'var(--text-primary)',
          borderWidth: isLegendary ? '2px' : '1px',
          borderColor: isLegendary ? 'var(--neon-yellow)' : 'var(--panel-border)',
          boxShadow: cardShadow,
          transition: 'transform 0.2s ease',
          marginBottom: '8px'
        }}
      >
        {/* pushpin at the top center */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: pinColor,
          backgroundImage: pinGradient,
          border: pinBorder,
          boxShadow: '0 3px 4px rgba(0,0,0,0.1)',
          zIndex: 10
        }} />

        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {isLegendary && <span style={{ fontSize: '0.88rem' }}>🏆</span>}
            <h4 className="retro-title" style={{ fontSize: '0.8rem', color: isLegendary ? 'var(--neon-yellow)' : 'var(--text-primary)', textShadow: 'none', margin: 0 }}>
              {mission.title}
            </h4>
            {mission.claimed ? (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>[CLAIMED]</span>
            ) : isCompleted ? (
              <span style={{ fontSize: '0.62rem', color: 'var(--neon-green)', fontFamily: 'var(--font-retro)', fontWeight: 'bold' }}>[COMPLETE]</span>
            ) : null}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
            {mission.claimed ? (
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Claimed ✓</span>
            ) : isCompleted ? (
              <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>Completed ✓</span>
            ) : (
              <span>Progress: {mission.current} / {mission.target}</span>
            )}
            <span style={{ fontWeight: 'bold', color: 'var(--neon-yellow)' }}>
              Reward: {mission.rewardCoins > 0 ? `🪙 ${mission.rewardCoins}` : ''} {mission.rewardDiamonds > 0 ? `💎 ${mission.rewardDiamonds}` : ''}
              {mission.claimed && <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>(Received)</span>}
            </span>
          </div>

          {/* Elegant progress slot */}
          {!mission.claimed && (
            <div className="progress-bar-container" style={{ height: '8px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progressPct}%`,
                  backgroundColor: isCompleted ? 'var(--neon-green)' : 'var(--neon-cyan)'
                }}
              ></div>
            </div>
          )}
        </div>

        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          {mission.claimed ? (
            <button 
              className="neon-btn" 
              style={{ pointerEvents: 'none', borderColor: 'var(--panel-border)', color: 'var(--text-secondary)', textShadow: 'none', opacity: 0.5, fontSize: '0.7rem' }} 
              disabled
            >
              CLAIMED
            </button>
          ) : isCompleted ? (
            <button 
              className="neon-btn-yellow" 
              style={{ padding: '8px 18px', fontSize: '0.7rem' }} 
              onClick={() => handleClaim(mission.id)}
            >
              CLAIM CONTRACT
            </button>
          ) : (
            <button 
              className="neon-btn" 
              style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.7rem' }} 
              disabled
            >
              IN PROGRESS
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      {/* Pinned Wood Bulletin Board */}
      <div 
        className="material-wood"
        style={{
          padding: '36px 24px',
          background: 'var(--panel-bg)',
          borderWidth: '1px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
          minHeight: '500px',
          position: 'relative'
        }}
      >
        {/* Banner header inside board */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="retro-title" style={{ fontSize: '1.25rem', color: 'var(--neon-yellow)', margin: 0 }}>
            📌 VILLAGE BULLETIN BOARD
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '4px 0 0' }}>
            Fulfill lumbering requests for the village elders and get paid in copper gold and gems.
          </p>
        </div>

        {/* Daily Challenges */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="retro-title" style={{ fontSize: '0.78rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-cyan)', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '6px' }}>
            ⚡ DAILY CONVENTIONS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dailyMissions.map(renderMissionCard)}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div style={{ marginBottom: '40px' }}>
          <h3 className="retro-title" style={{ fontSize: '0.78rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-magenta)', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '6px' }}>
            📜 WEEKLY CONTRACTS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {weeklyMissions.map(renderMissionCard)}
          </div>
        </div>

        {/* Legendary Bounties */}
        {legendaryMissions.length > 0 && (
          <div>
            <h3 className="retro-title" style={{ fontSize: '0.78rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-yellow)', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '6px' }}>
              🏆 ELDER'S LEGENDARY CONTRACTS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {legendaryMissions.map(renderMissionCard)}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Missions;
