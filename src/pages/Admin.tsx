import React, { useState, useEffect } from 'react';
import { Shield, Users, DollarSign, Database, RefreshCcw, AlertTriangle } from 'lucide-react';
import { db, UserProfile } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

interface AdminProps {
  user: UserProfile;
  onAdminChange: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const Admin: React.FC<AdminProps> = ({
  user,
  onAdminChange,
  showAlert,
  showConfirm
}) => {
  const [stats, setStats] = useState<{
    totalRegistrations: number;
    activeToday: number;
    totalRevenue: number;
    telemetryLogs: any[];
    playerBanned: boolean;
  }>({
    totalRegistrations: 0,
    activeToday: 0,
    totalRevenue: 0,
    telemetryLogs: [],
    playerBanned: user.isBanned
  });

  const [allPlayers, setAllPlayers] = useState<{ username: string; level: number; coins: number; diamonds: number; isBanned: boolean; createdAt?: string }[]>([]);
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState<string>('');

  const loadStats = () => {
    db.getAdminStats()
      .then(res => setStats(res))
      .catch(err => console.error("Error loading admin stats:", err));

    db.getAllPlayers()
      .then(players => {
        setAllPlayers(players);
        if (players.length > 0) {
          setSelectedPlayerUsername(prev => {
            if (prev && players.some(p => p.username === prev)) return prev;
            const currentLogged = players.find(p => p.username === user.username);
            return currentLogged ? currentLogged.username : players[0].username;
          });
        }
      })
      .catch(err => console.error("Error loading players list:", err));
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  const [grantType, setGrantType] = useState<'coins' | 'diamonds' | 'tickets'>('coins');
  const [grantAmount, setGrantAmount] = useState(1000);

  const targetPlayer = allPlayers.find(p => p.username === selectedPlayerUsername);
  const isTargetBanned = targetPlayer ? targetPlayer.isBanned : false;
  const targetLevel = targetPlayer ? targetPlayer.level : 1;

  const sortedPlayersBySignup = [...allPlayers].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleBanToggle = () => {
    if (!selectedPlayerUsername) return;
    const nextBan = !isTargetBanned;
    showConfirm(
      'Confirm Security Action',
      `Are you sure you want to ${nextBan ? 'BAN' : 'UNBAN'} the player ${selectedPlayerUsername}?`,
      () => {
        db.adminBanUser(selectedPlayerUsername, nextBan).then(res => {
          if (res.success) {
            loadStats();
            onAdminChange();
          } else {
            showAlert('Error', res.error || 'Ban operation failed.');
          }
        });
      }
    );
  };

  const handleGrantCurrency = () => {
    if (!selectedPlayerUsername) return;
    db.adminGrantCurrency(selectedPlayerUsername, grantType, grantAmount).then(res => {
      if (res.success) {
        showAlert('Success', `Successfully granted ${grantAmount} ${grantType} to ${selectedPlayerUsername}!`);
        loadStats();
        onAdminChange();
      } else {
        showAlert('Error', res.error || 'Currency grant failed.');
      }
    });
  };

  const handleResetPlayerData = () => {
    if (!selectedPlayerUsername) return;
    showConfirm(
      'WARNING: WIPE PLAYER DATA',
      `This will completely wipe all scores, unlocks, and coins for the player ${selectedPlayerUsername}. Do you want to proceed?`,
      () => {
        db.adminResetPlayerData(selectedPlayerUsername).then(res => {
          if (res.success) {
            showAlert('Database Restored', `Successfully shredded all stats and progress for player ${selectedPlayerUsername}!`);
            loadStats();
            onAdminChange();
          } else {
            showAlert('Error', res.error || 'Reset operation failed.');
          }
        });
      }
    );
  };

  const handleDeletePlayerAccount = () => {
    if (!selectedPlayerUsername) return;
    showConfirm(
      'DANGER: DELETE ACCOUNT COMPLETELY',
      `This will permanently purge the account of ${selectedPlayerUsername} (both their login credentials and all game data) from the database. This action is irreversible.`,
      () => {
        db.adminDeleteUserAccount(selectedPlayerUsername).then(res => {
          if (res.success) {
            showAlert('Account Deleted', `Successfully deleted account ${selectedPlayerUsername} completely.`);
            loadStats();
            onAdminChange();
          } else {
            showAlert('Error', res.error || 'Delete account failed.');
          }
        });
      }
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      {/* Ancient Analytics Slate Rows */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        
        <div className="material-stone" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(180deg, #2c2f36 0%, #1e2025 100%)' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', color: 'var(--neon-cyan)', padding: '12px', borderRadius: '6px', border: '1px solid #3f444f' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Total Guild</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {stats.totalRegistrations} Challengers
            </div>
          </div>
        </div>

        <div className="material-stone" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(180deg, #2c2f36 0%, #1e2025 100%)' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', color: 'var(--neon-green)', padding: '12px', borderRadius: '6px', border: '1px solid #3f444f' }}>
            <Database size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Active Core</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              {stats.activeToday} Logged
            </div>
          </div>
        </div>

        <div className="material-stone" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(180deg, #2c2f36 0%, #1e2025 100%)' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', color: 'var(--neon-yellow)', padding: '12px', borderRadius: '6px', border: '1px solid #3f444f' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-retro)' }}>Treasury Value</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
              ${stats.totalRevenue.toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        
        {/* Right Side: Injection and restriction services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Chronological Guild Registry Logs */}
          <div className="material-stone" style={{ padding: '24px', background: 'linear-gradient(180deg, #23252a, #16181b)' }}>
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-green)', marginBottom: '16px', borderBottom: '2px dashed #383c44', paddingBottom: '10px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥 GUILD SIGN-UP REGISTRY</span>
              <span style={{ fontSize: '0.6rem', background: 'var(--neon-green)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-retro)', fontWeight: 'bold', marginLeft: 'auto' }}>
                LATEST FIRST
              </span>
            </h3>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '16px' }}>
              Whenever a new challenger signs up, they appear below. Click any row to target the profile.
            </p>

            <div style={{ 
              maxHeight: '260px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              paddingRight: '6px',
              border: '1px solid #2d3139',
              borderRadius: '8px',
              background: '#121316',
              padding: '8px'
            }}>
              {sortedPlayersBySignup.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.8rem' }}>
                  No guild members registered in scroll registry.
                </div>
              ) : (
                sortedPlayersBySignup.map((player) => {
                  const isSelected = player.username === selectedPlayerUsername;
                  const dateStr = player.createdAt 
                    ? new Date(player.createdAt).toLocaleString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) 
                    : 'Ages ago';

                  return (
                    <div 
                      key={player.username}
                      onClick={() => {
                        setSelectedPlayerUsername(player.username);
                        sound.playCoin();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#191b1f',
                        border: isSelected ? '1px solid var(--neon-green)' : '1px solid #2d3139',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="guild-log-row"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>
                          {player.isBanned ? '🚫' : '🛡️'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: isSelected ? 'var(--neon-green)' : '#fff' }}>
                            {player.username}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Registered: {dateStr}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '0.62rem', 
                          background: '#2d3139', 
                          color: 'var(--text-secondary)', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          Lv {player.level}
                        </span>
                        <span style={{ 
                          fontSize: '0.62rem', 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          color: 'var(--neon-yellow)', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          🪙 {player.coins}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Currency injection panel */}
          <div className="material-stone" style={{ padding: '24px', background: 'linear-gradient(180deg, #23252a, #16181b)' }}>
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-yellow)', marginBottom: '16px', borderBottom: '2px dashed #383c44', paddingBottom: '10px', marginTop: 0 }}>
              CURRENCY INJECTOR PANEL
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Target Account</label>
                <input 
                  type="text" 
                  readOnly 
                  className="form-input" 
                  value={selectedPlayerUsername ? `${selectedPlayerUsername} (Level ${targetLevel})` : 'No player selected'} 
                  style={{ cursor: 'not-allowed', opacity: 0.6, background: '#121316', border: '2px solid #383c44' }} 
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Select Core</label>
                  <select 
                    className="form-input" 
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value as any)}
                    style={{ background: '#121316', border: '2px solid #383c44', color: '#fff' }}
                  >
                    <option value="coins">🪙 Coins Gold</option>
                    <option value="diamonds">💎 Gems Crystal</option>
                    <option value="tickets">🎫 Revive Tickets</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Count</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                    style={{ background: '#121316', border: '2px solid #383c44' }}
                  />
                </div>
              </div>

              <button 
                className="neon-btn-cyan" 
                style={{ marginTop: '6px', fontSize: '0.75rem', borderWidth: '2px' }} 
                onClick={handleGrantCurrency}
                disabled={!selectedPlayerUsername}
              >
                INJECT VALUE
              </button>
            </div>
          </div>

          {/* Critical Security restrictions */}
          <div 
            className="material-stone" 
            style={{ 
              padding: '24px', 
              background: 'linear-gradient(180deg, #23252a, #16181b)',
              borderColor: isTargetBanned ? 'var(--neon-red)' : '#383c44'
            }}
          >
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-red)', marginBottom: '16px', borderBottom: '2px dashed #383c44', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <AlertTriangle size={16} /> CRITICAL SEC OPS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121316', border: '2px solid #383c44', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>Simulated Player Ban</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Locks the selected challenger profile out of runs.</p>
                </div>
                
                <button 
                  className={isTargetBanned ? 'neon-btn-cyan' : 'neon-btn-magenta'}
                  style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                  onClick={handleBanToggle}
                  disabled={!selectedPlayerUsername}
                >
                  {isTargetBanned ? 'UNBAN HERO' : 'BAN HERO'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121316', border: '2px solid #383c44', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>Shred Player Profile</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Resets all scores, unlocks, and coins for this player in database.</p>
                </div>
                
                <button 
                  className="neon-btn-magenta"
                  style={{ padding: '6px 14px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', borderWidth: '2px' }}
                  onClick={handleResetPlayerData}
                  disabled={!selectedPlayerUsername}
                >
                  <RefreshCcw size={12} /> SHRED
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121316', border: '2px solid #383c44', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, color: 'var(--neon-red)' }}>Delete Account Completely</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Permanently purges the player credentials and data from database.</p>
                </div>
                
                <button 
                  className="neon-btn-magenta"
                  style={{ padding: '6px 14px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', borderWidth: '2px', borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}
                  onClick={handleDeletePlayerAccount}
                  disabled={!selectedPlayerUsername}
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
