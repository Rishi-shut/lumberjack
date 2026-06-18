import React, { useState } from 'react';
import { Shield, Users, DollarSign, Database, RefreshCcw, AlertTriangle, Cpu } from 'lucide-react';
import { db, UserProfile } from '../utils/LocalStorageDB';

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
  const stats = db.getAdminStats();
  const [grantType, setGrantType] = useState<'coins' | 'diamonds'>('coins');
  const [grantAmount, setGrantAmount] = useState(1000);

  const handleBanToggle = () => {
    const nextBan = !user.isBanned;
    showConfirm(
      'Confirm Security Action',
      `Are you sure you want to ${nextBan ? 'BAN' : 'UNBAN'} the player ${user.username}?`,
      () => {
        db.adminBanUser(nextBan);
        onAdminChange();
      }
    );
  };

  const handleGrantCurrency = () => {
    db.adminGrantCurrency(grantType, grantAmount);
    showAlert('Success', `Successfully granted ${grantAmount} ${grantType} to ${user.username}!`);
    onAdminChange();
  };

  const handleResetData = () => {
    showConfirm(
      'WARNING: WIPE DATA',
      "This will completely wipe all local storage data, including your high scores, inventory, and coins, and restore initial seed data. Do you want to proceed?",
      () => {
        db.adminResetAllData();
        showAlert('Database Restored', "Database restored to initial seed configuration!");
        onAdminChange();
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

      <div className="grid-2" style={{ gap: '24px' }}>
        
        {/* Left Side: Real-time Telemetry Monitor (Stone console bezel) */}
        <div className="material-stone" style={{ display: 'flex', flexDirection: 'column', height: '440px', padding: '24px', background: 'linear-gradient(180deg, #23252a, #16181b)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #383c44', paddingBottom: '12px' }}>
            <Cpu size={18} style={{ color: 'var(--neon-cyan)' }} />
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-cyan)', margin: 0 }}>
              TELEMETRY CORE DUMP
            </h3>
          </div>
          
          <div style={{
            flex: 1,
            background: '#0e1013',
            borderRadius: '6px',
            border: '2px solid #1a1c21',
            padding: '16px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.8)'
          }}>
            {stats.telemetryLogs.map((log, i) => {
              let color = '#a1a09e';
              if (log.type === 'cheat') color = 'var(--neon-red)';
              else if (log.type === 'admin') color = 'var(--neon-yellow)';
              else if (log.type === 'shop') color = 'var(--neon-cyan)';
              else if (log.type === 'game') color = 'var(--neon-green)';

              return (
                <div key={i} style={{ borderBottom: '1px solid #1a1c21', paddingBottom: '6px', lineHeight: '1.4' }}>
                  <span style={{ color: '#555e70' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span style={{ color, fontWeight: 'bold' }}>({log.type.toUpperCase()})</span>{' '}
                  <span style={{ color: '#c5c8cf' }}>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Injection and restriction services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
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
                  value={`${user.username} (Level ${user.level})`} 
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
              borderColor: user.isBanned ? 'var(--neon-red)' : '#383c44'
            }}
          >
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-red)', marginBottom: '16px', borderBottom: '2px dashed #383c44', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <AlertTriangle size={16} /> CRITICAL SEC OPS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121316', border: '2px solid #383c44', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>Simulated Player Ban</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Locks the current challenger profile out of runs.</p>
                </div>
                
                <button 
                  className={user.isBanned ? 'neon-btn-cyan' : 'neon-btn-magenta'}
                  style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                  onClick={handleBanToggle}
                >
                  {user.isBanned ? 'UNBAN HERO' : 'BAN HERO'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#121316', border: '2px solid #383c44', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>Wipe Local Databases</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Restores all scores, unlocks, and assets to seed state.</p>
                </div>
                
                <button 
                  className="neon-btn-magenta"
                  style={{ padding: '6px 14px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', borderWidth: '2px' }}
                  onClick={handleResetData}
                >
                  <RefreshCcw size={12} /> SHRED
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
