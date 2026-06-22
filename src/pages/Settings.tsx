import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Key, Cloud, Link, Sliders } from 'lucide-react';
import { db, UserProfile } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

interface SettingsProps {
  user: UserProfile;
  onSettingsChange: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setCurrentPage?: (page: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onSettingsChange,
  showAlert,
  showConfirm,
  setCurrentPage
}) => {
  const [settings, setSettings] = useState(db.getSettings());
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [rebinding, setRebinding] = useState<'left' | 'right' | null>(null);
  const [cityInput, setCityInput] = useState(user.stats?.location?.city || '');
  const [countryCodeInput, setCountryCodeInput] = useState(user.stats?.location?.countryCode || '');

  useEffect(() => {
    setCityInput(user.stats?.location?.city || '');
    setCountryCodeInput(user.stats?.location?.countryCode || '');
  }, [user]);

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim() || !countryCodeInput.trim()) {
      showAlert('Error', 'Please fill out both fields.');
      return;
    }
    const cleanCity = cityInput.trim();
    const cleanCode = countryCodeInput.trim().toUpperCase();
    if (cleanCode.length !== 2) {
      showAlert('Invalid Country Code', 'Country code must be exactly 2 letters (e.g. IN, US).');
      return;
    }

    const updatedUser = { ...user };
    if (!updatedUser.stats) {
      updatedUser.stats = {
        totalChops: 0,
        gamesPlayed: 0,
        timePlayed: 0,
        totalCoinsEarned: 0,
        totalChestsOpened: 0,
        totalDiamondsEarned: 0,
        worldRuns: {}
      };
    }
    updatedUser.stats.location = {
      city: cleanCity,
      countryCode: cleanCode,
      countryName: cleanCode === 'IN' ? 'India' : 'Other'
    };

    db.saveUser(updatedUser);
    db.syncActiveProfileToCloud();
    showAlert('Location Updated', `Location updated to ${cleanCity} (${cleanCode})! Synced to leaderboard.`);
    onSettingsChange();
  };

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
       showAlert('Incomplete Fields', 'Please fill out all fields.');
       return;
     }
     db.linkAccount(emailInput, usernameInput);
     showAlert('Link Success', 'Account successfully synchronized with simulated cloud databases!');
     onSettingsChange();
   };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      <div className="grid-2" style={{ gap: '24px' }}>
        
        {/* LEFT PAGE: Audio Control Panel (Wood Console) */}
        <div className="material-wood" style={{ padding: '24px 28px', background: 'var(--panel-bg)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '12px' }}>
            <Sliders size={18} style={{ color: 'var(--neon-yellow)' }} />
            <h3 className="retro-title" style={{ fontSize: '0.85rem', color: 'var(--neon-yellow)', margin: 0 }}>
              CABIN SYSTEM CONTROLS
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Tactile Switch for Mute */}
            <div className="material-leather" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                {settings.muted ? <VolumeX size={18} style={{ color: 'var(--neon-red)' }} /> : <Volume2 size={18} style={{ color: 'var(--neon-green)' }} />}
                MASTER MUTE SWITCH
              </span>
              <button 
                className={settings.muted ? 'neon-btn-magenta' : 'neon-btn-yellow'} 
                style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                onClick={handleToggleMute}
              >
                {settings.muted ? 'MUTED' : 'ACTIVE'}
              </button>
            </div>

            {/* Visual Style Selector */}
            <div className="material-leather" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                🎨 RENDER STYLE
              </span>
              <button 
                className={(settings.characterStyle || 'pixel') === 'vector' ? 'neon-btn-cyan' : 'neon-btn-yellow'} 
                style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                onClick={() => {
                  const currentStyle = settings.characterStyle || 'pixel';
                  const nextStyle = currentStyle === 'vector' ? 'pixel' : 'vector';
                  const newSets = { ...settings, characterStyle: nextStyle };
                  setSettings(newSets);
                  db.saveSettings(newSets);
                  onSettingsChange();
                }}
              >
                {(settings.characterStyle || 'pixel') === 'vector' ? '2D VECTOR (SMOOTH)' : 'RETRO PIXEL ART'}
              </button>
            </div>

            {/* Volume Sliders */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontFamily: 'var(--font-retro)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>MASTER MIX</span>
                <span style={{ color: 'var(--neon-yellow)' }}>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-yellow)' }}
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontFamily: 'var(--font-retro)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>MUSIC MUSIC</span>
                <span style={{ color: 'var(--neon-cyan)' }}>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-cyan)' }}
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontFamily: 'var(--font-retro)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SOUND EFFECTS (SFX)</span>
                <span style={{ color: 'var(--neon-red)' }}>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                style={{ width: '100%', accentColor: 'var(--neon-red)' }}
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfxVolume', Number(e.target.value))}
                disabled={settings.muted}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PAGE: Keyboard Rebinding (Leather Console) */}
        <div className="material-leather" style={{ padding: '24px 28px', color: 'var(--text-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '12px' }}>
            <Key size={18} style={{ color: 'var(--neon-cyan)' }} />
            <h3 className="retro-title" style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', margin: 0 }}>
              DESKTOP CONTROLS DESK
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rebinding && (
              <div style={{ padding: '12px', background: 'rgba(0,240,255,0.05)', border: '2px dashed var(--neon-cyan)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-retro)' }}>
                Press any keyboard key for Chop {rebinding.toUpperCase()}...
              </div>
            )}

            {/* Left Action key rebinder */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>CHOP LEFT ACTION</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Current: <kbd style={{ padding: '2px 6px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontFamily: 'var(--font-retro)', fontSize: '0.65rem', color: 'var(--text-primary)' }}>{settings.keyLeft.toUpperCase()}</kbd>
                </p>
              </div>
              <button 
                className="neon-btn-cyan" 
                style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                onClick={() => startRebind('left')}
                disabled={!!rebinding}
              >
                ENGRAVE
              </button>
            </div>

            {/* Right Action key rebinder */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0 }}>CHOP RIGHT ACTION</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Current: <kbd style={{ padding: '2px 6px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontFamily: 'var(--font-retro)', fontSize: '0.65rem', color: 'var(--text-primary)' }}>{settings.keyRight.toUpperCase()}</kbd>
                </p>
              </div>
              <button 
                className="neon-btn-cyan" 
                style={{ padding: '6px 14px', fontSize: '0.65rem', borderWidth: '2px' }}
                onClick={() => startRebind('right')}
                disabled={!!rebinding}
              >
                ENGRAVE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Challenger Profile & Account Switching Section */}
      {!user.isGuest && (
        <div 
          className="material-wood" 
          style={{ 
            marginTop: '32px', 
            padding: '24px 28px',
            color: 'var(--text-primary)',
            background: 'var(--panel-bg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
          }}
        >
          <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', textShadow: 'none' }}>
            👤 CHALLENGER PROFILE SESSION
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <h4 style={{ fontWeight: '900', fontSize: '1.05rem', margin: 0, color: 'var(--neon-cyan)' }}>
                Active Challenger: {user.username}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                Your progress, scores, coins, and unlocks are synchronized with your account details.
              </p>
            </div>
            <button
              className="neon-btn-magenta"
              style={{ fontSize: '0.75rem', padding: '10px 24px', borderWidth: '2px' }}
              onClick={() => {
                showConfirm(
                  'Switch Account',
                  'Are you sure you want to log out and switch accounts? Your current progress is saved in the simulated cloud registry.',
                  () => {
                    db.logoutUser();
                    if (setCurrentPage) {
                      setCurrentPage('home');
                    }
                    onSettingsChange();
                  }
                );
              }}
            >
              LOG OUT & SWITCH ACCOUNT
            </button>
          </div>
        </div>
      )}

      {/* City/Location Settings Section */}
      <div 
        className="material-wood" 
        style={{ 
          marginTop: '32px', 
          padding: '24px 28px',
          color: 'var(--text-primary)',
          background: 'var(--panel-bg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
        }}
      >
        <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', textShadow: 'none' }}>
          📍 LEADERBOARD CITY & COUNTRY LOCATION
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
          Set your real city and country so it displays correctly next to your name on the global leaderboards.
        </p>

        <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>City Name</label>
            <input 
              type="text" required placeholder="e.g. Mumbai, New Delhi, Bengaluru" className="form-input" 
              style={{ background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              value={cityInput} onChange={(e) => setCityInput(e.target.value)}
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Country Code (2 Letters)</label>
            <input 
              type="text" required maxLength={2} placeholder="e.g. IN, US, GB" className="form-input" 
              style={{ background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', fontSize: '0.85rem', textTransform: 'uppercase' }}
              value={countryCodeInput} onChange={(e) => setCountryCodeInput(e.target.value)}
            />
          </div>

          <button type="submit" className="neon-btn-yellow" style={{ height: '40px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            UPDATE LOCATION
          </button>
        </form>
      </div>

      {/* Cloud Sync account binding (Aged Parchment) */}
      {user.username === 'mriga' && (
        <div 
          className="material-paper" 
          style={{ 
            marginTop: '32px', 
            padding: '24px 28px',
            color: 'var(--text-primary)',
            boxShadow: 'none'
          }}
        >
          <h3 className="retro-title" style={{ fontSize: '0.85rem', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-yellow)', textShadow: 'none' }}>
            <Cloud size={18} style={{ color: 'var(--neon-yellow)' }} /> CLOUD SYNCHRONIZATION LEDGER
          </h3>

          {user.isGuest ? (
            <form onSubmit={handleLinkAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Synchronize Email</label>
                <input 
                  type="email" required placeholder="name@domain.com" className="form-input" 
                  style={{ background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
              
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Challenger Username</label>
                <input 
                  type="text" required placeholder="Lumbermaster" className="form-input" 
                  style={{ background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)}
                />
              </div>

              <button type="submit" className="neon-btn-cyan" style={{ height: '40px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                <Link size={14} /> LINK CONTRACT
              </button>
            </form>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--neon-green)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: 'var(--neon-green)', fontFamily: 'var(--font-retro)', fontWeight: 'bold' }}>SYNCHRONIZED CONTRACT</span>
                <h4 style={{ fontWeight: '900', fontSize: '1.05rem', marginTop: '4px', color: 'var(--text-primary)' }}>Linked Hero: {user.username}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>Backup dispatch email: {user.email}</p>
              </div>
              <span style={{ fontSize: '2.5rem' }}>☁️</span>
            </div>
          )}

          {/* Sync telemetry backup */}
          <div style={{ padding: '18px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '850', color: 'var(--text-primary)', marginBottom: '12px' }}>Simulate Cloud Backup Operations</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button 
                className="neon-btn-yellow"
                style={{ fontSize: '0.7rem', padding: '8px 18px', borderWidth: '2px' }}
                onClick={() => {
                  const res = db.syncToCloud();
                  if (res.success) {
                    localStorage.setItem('infinite_chop_cloud_sync_time', res.timestamp || '');
                    showAlert('Sync Completed', 'Local game data sync backup completed successfully!');
                    onSettingsChange();
                  } else {
                    showAlert('Sync Failed', res.error || 'Unknown error.');
                  }
                }}
              >
                BACKUP SAVE TO CLOUD
              </button>
              
              <button 
                className="neon-btn-magenta" 
                style={{ fontSize: '0.7rem', padding: '8px 18px', borderWidth: '2px' }}
                onClick={() => {
                  showConfirm(
                    'Restore Data',
                    'Wipe current local data and restore from cloud backup?',
                    () => {
                      const res = db.loadFromCloudBackup();
                      if (res.success) {
                        showAlert('Restore Success', 'Ecosystem data restored successfully from cloud backup!');
                        onSettingsChange();
                      } else {
                        showAlert('Restore Failed', `Restore failed: ${res.error}`);
                      }
                    }
                  );
                }}
              >
                RESTORE SAVE FROM CLOUD
              </button>
              
              {setCurrentPage && (
                <button 
                  className="neon-btn" 
                  style={{ fontSize: '0.7rem', padding: '8px 18px', borderWidth: '2px' }}
                  onClick={() => {
                    sound.playCoin();
                    setCurrentPage('404');
                  }}
                >
                  TRIGGER 404 SCREEN
                </button>
              )}

              {localStorage.getItem('infinite_chop_cloud_sync_time') && (
                <span style={{ fontSize: '0.75rem', color: '#7c654e', fontStyle: 'italic', marginLeft: '8px' }}>
                  Last synced: {localStorage.getItem('infinite_chop_cloud_sync_time')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
