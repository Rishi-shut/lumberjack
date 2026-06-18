import React from 'react';
import { Award, Star, CheckCircle, Gift } from 'lucide-react';
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

    return (
      <div 
        key={mission.id}
        className="game-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          borderLeft: mission.claimed ? '4px solid var(--panel-border)' : (isCompleted ? '4px solid var(--neon-green)' : '4px solid var(--neon-cyan)'),
          opacity: mission.claimed ? 0.6 : 1,
          background: isCompleted && !mission.claimed ? 'linear-gradient(90deg, rgba(57,255,20,0.02) 0%, transparent 100%)' : 'var(--panel-bg)'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: isCompleted ? 'white' : 'var(--text-secondary)' }}>
              {mission.title}
            </h4>
            {mission.claimed ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>[CLAIMED]</span>
            ) : isCompleted ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--neon-green)', fontFamily: 'var(--font-retro)', animation: 'bounceSlow 2s infinite' }}>[COMPLETE]</span>
            ) : null}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Progress: {mission.current} / {mission.target}</span>
            <span>Reward: {mission.rewardCoins > 0 ? `🪙 ${mission.rewardCoins}` : ''} {mission.rewardDiamonds > 0 ? `💎 ${mission.rewardDiamonds}` : ''}</span>
          </div>

          <div className="progress-bar-container" style={{ height: '6px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${progressPct}%`,
                backgroundColor: mission.claimed ? 'var(--text-secondary)' : (isCompleted ? 'var(--neon-green)' : 'var(--neon-cyan)')
              }}
            ></div>
          </div>
        </div>

        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          {mission.claimed ? (
            <button className="neon-btn" style={{ pointerEvents: 'none', borderColor: 'var(--panel-border)', color: 'var(--text-secondary)', textShadow: 'none' }} disabled>
              CLAIMED
            </button>
          ) : isCompleted ? (
            <button className="neon-btn" style={{ animation: 'pulseNeon 2s infinite' }} onClick={() => handleClaim(mission.id)}>
              CLAIM 🎁
            </button>
          ) : (
            <button className="neon-btn-cyan" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
              LOCKED
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Daily Challenges */}
      <h3 className="retro-title" style={{ fontSize: '0.95rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-cyan)' }}>
        ⚡ DAILY MISSIONS
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '45px' }}>
        {dailyMissions.map(renderMissionCard)}
      </div>

      {/* Weekly Challenges */}
      <h3 className="retro-title" style={{ fontSize: '0.95rem', textAlign: 'left', marginBottom: '16px', color: 'var(--neon-magenta)' }}>
        🏆 WEEKLY CHALLENGES
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {weeklyMissions.map(renderMissionCard)}
      </div>

    </div>
  );
};
export default Missions;
