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
    
    // Handcrafted alternating micro-rotation for the pinned look
    const charCodeSum = mission.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rotation = (charCodeSum % 2 === 0) ? 'rotate(-1deg)' : 'rotate(1.2deg)';

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
          color: '#2b2112',
          borderWidth: '1px',
          borderColor: '#e9dcb9',
          boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s ease',
          marginBottom: '8px'
        }}
      >
        {/* Iron pushpin at the top center */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#3a3a3a',
          backgroundImage: 'radial-gradient(circle at 4px 4px, #5c5c5c 0%, #1a1a1a 80%)',
          border: '2px solid #1c1c1c',
          boxShadow: '0 3px 4px rgba(0,0,0,0.5)',
          zIndex: 10
        }} />

        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h4 className="retro-title" style={{ fontSize: '0.8rem', color: '#3b2410', textShadow: 'none', margin: 0 }}>
              {mission.title}
            </h4>
            {mission.claimed ? (
              <span style={{ fontSize: '0.62rem', color: '#7c654e', fontFamily: 'var(--font-retro)' }}>[CLAIMED]</span>
            ) : isCompleted ? (
              <span style={{ fontSize: '0.62rem', color: '#2e7d32', fontFamily: 'var(--font-retro)', fontWeight: 'bold' }}>[COMPLETE]</span>
            ) : null}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#5c4b3c', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
            <span>Progress: {mission.current} / {mission.target}</span>
            <span style={{ fontWeight: 'bold', color: '#8c5922' }}>
              Reward: {mission.rewardCoins > 0 ? `🪙 ${mission.rewardCoins}` : ''} {mission.rewardDiamonds > 0 ? `💎 ${mission.rewardDiamonds}` : ''}
            </span>
          </div>

          {/* Carved wood progress slot */}
          <div className="progress-bar-container" style={{ height: '8px', background: '#e9dcb9', border: '1px solid #ccc1ab' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${progressPct}%`,
                backgroundColor: mission.claimed ? '#8c7662' : (isCompleted ? '#388e3c' : '#2563eb')
              }}
            ></div>
          </div>
        </div>

        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          {mission.claimed ? (
            <button 
              className="neon-btn" 
              style={{ pointerEvents: 'none', borderColor: '#ccc1ab', color: '#7c654e', textShadow: 'none', opacity: 0.5, fontSize: '0.7rem' }} 
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
          background: 'radial-gradient(circle, #7d5032 0%, #54341e 100%)',
          borderWidth: '6px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 12px 24px rgba(0,0,0,0.6)',
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
          <h3 className="retro-title" style={{ fontSize: '0.78rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-cyan)', borderBottom: '2px dashed rgba(255,255,255,0.15)', paddingBottom: '6px' }}>
            ⚡ DAILY CONVENTIONS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dailyMissions.map(renderMissionCard)}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div>
          <h3 className="retro-title" style={{ fontSize: '0.78rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-magenta)', borderBottom: '2px dashed rgba(255,255,255,0.15)', paddingBottom: '6px' }}>
            📜 WEEKLY CONTRACTS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {weeklyMissions.map(renderMissionCard)}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Missions;
