import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Key, Cloud, Link } from 'lucide-react';
import { db, UserProfile } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

interface SettingsProps {
  user: UserProfile;
  onSettingsChange: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState(db.getSettings());
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState(user.username);
  
  // Key rebinding state
  const [rebinding, setRebinding] = useState<'left' | 'right' | null>(null);

  // Sync Audio Engine on component mount / state updates
  useEffect(() => {
    sound.setMute(settings.muted);
    sound.setMasterVolume(settings.masterVolume);
    sound.setMusicVolume(settings.musicVolume);
    sound.setSfxVolume(settings.sfxVolume);
  }, [settings]);

  const handleToggleMute = () => {
    const nextMuted = !settings.muted;
    const newSets = { ...settings, muted: nextMuted };
    setSettings(newSets);
    db.saveSettings(newSets);
    onSettingsChange();
  };

  const handleVolumeChange = (key: 'masterVolume' | 'musicVolume' | 'sfxVolume', val: number) => {
    const newSets = { ...settings, [key]: val };
    setSettings(newSets);
    db.saveSettings(newSets);
  };

  const startRebind = (action: 'left' | 'right') => {
    setRebinding(action);
  };

  // Listen for rebind keys
  useEffect(() => {
    if (!rebinding) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const newSets = { ...settings };
      if (rebinding === 'left') {
        newSets.keyLeft = e.key;
      } else {
        newSets.keyRight = e.key;
      }
      setSettings(newSets);
      db.saveSettings(newSets);
      db.logTelemetry('settings', `Rebound Chop ${rebinding.toUpperCase()} to key [${e.key}]`);
      setRebinding(null);
      onSettingsChange();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rebinding, settings]);

  const handleLinkAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !usernameInput.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    db.linkAccount(emailInput, usernameInput);
    alert('Account successfully synchronized with simulated cloud databases!');
    onSettingsChange();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="grid-2">
        {/* Audio Mixers */}
        <div className="game-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
            AUDIO SETTINGS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Mute Toggle */}
            <div className="switch-container">
              <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {settings.muted ? <VolumeX size={18} style={{ color: 'var(--neon-red)' }} /> : <Volume2 size={18} style={{ color: 'var(--neon-green)' }} />}
                Mute Game Audio
              </span>
              <button 
                className={settings.muted ? 'neon-btn-magenta' : 'neon-btn'} 
                style={{ padding: '6px 16px', fontSize: '0.65rem' }}
                onClick={handleToggleMute}
              >
                {settings.muted ? 'MUTED' : 'UNMUTED'}
              </button>
            </div>

            {/* Sliders */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Master Volume</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-cyan)' }}
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Music Loop Volume</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-magenta)' }}
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Sound Effects (SFX) Volume</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-green)' }}
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfxVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Controls rebinding */}
        <div className="game-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
            DESKTOP KEY BINDINGS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rebinding && (
              <div style={{ padding: '12px', background: 'rgba(255,0,255,0.05)', border: '1px solid var(--neon-magenta)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--neon-magenta)' }}>
                Press any key on your keyboard to assign to Chop {rebinding.toUpperCase()}...
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Chop LEFT Action</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Key: <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>{settings.keyLeft}</kbd></p>
              </div>
              <button 
                className="neon-btn-cyan" 
                style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                onClick={() => startRebind('left')}
                disabled={!!rebinding}
              >
                REBIND
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Chop RIGHT Action</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Key: <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>{settings.keyRight}</kbd></p>
              </div>
              <button 
                className="neon-btn-cyan" 
                style={{ padding: '6px 12px', fontSize: '0.65rem' }}
                onClick={() => startRebind('right')}
                disabled={!!rebinding}
              >
                REBIND
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Account Linking */}
      <div className="game-card" style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cloud size={18} style={{ color: 'var(--neon-cyan)' }} /> CLOUD SYNCHRONIZATION
        </h3>

        {user.isGuest ? (
          <form onSubmit={handleLinkAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Synchronize Email</label>
              <input 
                type="email" required placeholder="name@domain.com" className="form-input" 
                value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Username</label>
              <input 
                type="text" required placeholder="Lumbermaster" className="form-input" 
                value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>

            <button type="submit" className="neon-btn-cyan" style={{ height: '40px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link size={14} /> LINK & BACKUP DATA
            </button>
          </form>
        ) : (
          <div style={{ padding: '16px', background: 'rgba(57,255,20,0.02)', border: '1px solid rgba(57,255,20,0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)', fontFamily: 'var(--font-retro)' }}>SYNCHRONIZED</span>
              <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '4px' }}>Linked Username: {user.username}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Backup email: {user.email}</p>
            </div>
            <span style={{ fontSize: '2rem' }}>☁️</span>
          </div>
        )}

        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px' }}>Simulate Cloud Backup Operations</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button className="neon-btn" onClick={() => {
              const res = db.syncToCloud();
              if (res.success) {
                localStorage.setItem('infinite_chop_cloud_sync_time', res.timestamp);
                alert('Local game data sync backup completed successfully!');
                onSettingsChange();
              }
            }}>
              BACKUP SAVE TO CLOUD
            </button>
            <button className="neon-btn-magenta" onClick={() => {
              const confirmAction = window.confirm('Wipe current local data and restore from cloud backup?');
              if (confirmAction) {
                const res = db.loadFromCloudBackup();
                if (res.success) {
                  alert('Ecosystem data restored successfully from cloud backup!');
                  onSettingsChange();
                } else {
                  alert(`Restore failed: ${res.error}`);
                }
              }
            }}>
              RESTORE SAVE FROM CLOUD
            </button>
            {localStorage.getItem('infinite_chop_cloud_sync_time') && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                Last synced: {localStorage.getItem('infinite_chop_cloud_sync_time')}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
export default Settings;
