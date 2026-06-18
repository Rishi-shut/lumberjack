import React, { useState } from 'react';
import { Shield, Users, DollarSign, Database, RefreshCcw, AlertTriangle } from 'lucide-react';
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
      'Confirm Action',
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Analytics Row */}
      <div className="grid-3" style={{ marginBottom: '30px' }}>
        <div className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', padding: '14px', borderRadius: '8px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Registrations</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{stats.totalRegistrations} Players</div>
          </div>
        </div>

        <div className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(57,255,20,0.1)', color: 'var(--neon-green)', padding: '14px', borderRadius: '8px' }}>
            <Database size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Daily Users (DAU)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{stats.activeToday} Active</div>
          </div>
        </div>

        <div className="game-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--neon-yellow)', padding: '14px', borderRadius: '8px' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gross Platform Revenue</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>${stats.totalRevenue.toFixed(2)} USD</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Telemetry log viewer */}
        <div className="game-card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-magenta)' }}>
            <Shield size={18} /> REAL-TIME TELEMETRY EVENT LOGS
          </h3>
          
          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            border: '1px solid var(--panel-border)',
            padding: '12px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {stats.telemetryLogs.map((log, i) => {
              let color = 'white';
              if (log.type === 'cheat') color = 'var(--neon-red)';
              else if (log.type === 'admin') color = 'var(--neon-yellow)';
              else if (log.type === 'shop') color = 'var(--neon-magenta)';
              else if (log.type === 'game') color = 'var(--neon-green)';

              return (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span style={{ color, fontWeight: 'bold' }}>({log.type.toUpperCase()})</span>{' '}
                  <span style={{ color: '#e5e7eb' }}>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Balancing & actions panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Grant Currency Box */}
          <div className="game-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>CURRENCY INJECTION SERVICE</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Account</label>
                <input type="text" readOnly className="form-input" value={`${user.username} (Level ${user.level})`} style={{ cursor: 'not-allowed', opacity: 0.7 }} />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Currency</label>
                  <select 
                    className="form-input" 
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value as any)}
                    style={{ background: 'var(--panel-bg)' }}
                  >
                    <option value="coins">🪙 Coins</option>
                    <option value="diamonds">💎 Gems</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Amount</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <button className="neon-btn-cyan" style={{ marginTop: '6px' }} onClick={handleGrantCurrency}>
                INJECT CURRENCY
              </button>
            </div>
          </div>

          {/* User Restrictions & system reset */}
          <div className="game-card" style={{ border: user.isBanned ? '1px solid var(--neon-red)' : '1px solid var(--panel-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> CRITICAL SECURITY ACTIONS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Simulate Player Ban</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Locks user out of game submissions and page navigation.</p>
                </div>
                <button 
                  className={user.isBanned ? 'neon-btn-cyan' : 'neon-btn-magenta'}
                  style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                  onClick={handleBanToggle}
                >
                  {user.isBanned ? 'UNBAN USER' : 'BAN USER'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Wipe Ecosystem DB Cache</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resets all profiles, inventories, and shop unlocks to seed.</p>
                </div>
                <button 
                  className="neon-btn-magenta"
                  style={{ padding: '6px 12px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleResetData}
                >
                  <RefreshCcw size={12} /> RESET ALL
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
