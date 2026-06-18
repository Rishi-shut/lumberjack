import React, { useState } from 'react';
import { Search, Globe, Award, Sparkles, Star } from 'lucide-react';
import { db, LeaderboardEntry, UserProfile } from '../utils/LocalStorageDB';

interface LeaderboardProps {
  user: UserProfile;
  leaderboard: LeaderboardEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  leaderboard,
}) => {
  const [category, setCategory] = useState<'score' | 'coins' | 'combo'>('score');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get sorted list based on category
  const getSortedEntries = () => {
    let list = [...leaderboard];
    if (category === 'score') {
      list.sort((a, b) => b.score - a.score);
    } else if (category === 'coins') {
      list.sort((a, b) => b.coins - a.coins);
    } else {
      list.sort((a, b) => b.maxCombo - a.maxCombo);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      list = list.filter(entry => 
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const sortedList = getSortedEntries();

  // Find player's current rank
  const playerRankIndex = leaderboard.findIndex(entry => entry.username === user.username);
  const playerRankNum = playerRankIndex >= 0 ? playerRankIndex + 1 : '10+';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Filters Bar */}
      <div className="game-card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="neon-btn-cyan" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'score' ? 'var(--neon-cyan)' : 'transparent',
                color: category === 'score' ? '#000' : 'var(--neon-cyan)'
              }}
              onClick={() => setCategory('score')}
            >
              HIGH SCORE
            </button>
            <button 
              className="neon-btn-magenta" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'coins' ? 'var(--neon-magenta)' : 'transparent',
                color: category === 'coins' ? '#000' : 'var(--neon-magenta)'
              }}
              onClick={() => setCategory('coins')}
            >
              COINS COLLECTED
            </button>
            <button 
              className="neon-btn" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'combo' ? 'var(--neon-green)' : 'transparent',
                color: category === 'combo' ? '#000' : 'var(--neon-green)'
              }}
              onClick={() => setCategory('combo')}
            >
              MAX COMBO
            </button>
          </div>

          {/* Timeframe selector */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
            {(['daily', 'weekly', 'all'] as const).map(tf => (
              <button
                key={tf}
                style={{
                  background: timeframe === tf ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  color: timeframe === tf ? 'white' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search username..." 
              className="form-input" 
              style={{ paddingLeft: '38px', height: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="game-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.1)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>RANK</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PLAYER</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>TITLE</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>NATIVE</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>
                {category === 'score' ? 'HIGH SCORE' : (category === 'coins' ? 'TOTAL COINS' : 'MAX COMBO')}
              </th>
            </tr>
          </thead>
          
          <tbody>
            {sortedList.length > 0 ? (
              sortedList.map((entry, index) => {
                const isMe = entry.username === user.username;
                const rankNum = index + 1;
                
                // Medal colors for top 3
                let rankDisplay: React.ReactNode = rankNum;
                if (rankNum === 1) rankDisplay = <span style={{ fontSize: '1.25rem' }}>🥇</span>;
                else if (rankNum === 2) rankDisplay = <span style={{ fontSize: '1.25rem' }}>🥈</span>;
                else if (rankNum === 3) rankDisplay = <span style={{ fontSize: '1.25rem' }}>🥉</span>;

                return (
                  <tr 
                    key={entry.username} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: isMe ? 'rgba(0,240,255,0.03)' : 'transparent',
                      transition: 'background 0.2s ease',
                      borderLeft: isMe ? '3px solid var(--neon-cyan)' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? 'rgba(0,240,255,0.03)' : 'transparent'; }}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 'bold', fontFamily: 'var(--font-retro)', fontSize: '0.75rem' }}>
                      {rankDisplay}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {entry.avatar === 'char_lumberjack' ? '🪓' : (entry.avatar === 'char_viking' ? '🛡️' : (entry.avatar === 'char_knight' ? '⚔️' : (entry.avatar === 'char_samurai' ? '🥷' : (entry.avatar === 'char_wizard' ? '🧙' : (entry.avatar === 'char_alien' ? '👽' : '🤖')))))}
                        </span>
                        <div>
                          <span style={{ fontWeight: 'bold', color: isMe ? 'var(--neon-cyan)' : 'white' }}>{entry.username}</span>
                          {isMe && <span style={{ fontSize: '0.65rem', background: 'var(--neon-cyan)', color: '#000', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>YOU</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="rarity-tag rarity-common" style={{ fontSize: '8px' }}>
                        {entry.title}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '1.1rem' }}>
                      {entry.country === 'US' ? '🇺🇸' : (entry.country === 'JP' ? '🇯🇵' : (entry.country === 'NO' ? '🇳🇴' : (entry.country === 'KR' ? '🇰🇷' : (entry.country === 'CA' ? '🇨🇦' : '🌐'))))}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--font-retro)', fontSize: '0.75rem', color: category === 'score' ? 'white' : (category === 'coins' ? 'var(--neon-yellow)' : 'var(--neon-magenta)') }}>
                      {category === 'score' ? entry.score : (category === 'coins' ? `🪙 ${entry.coins.toLocaleString()}` : `${entry.maxCombo}x`)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No player records matched.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Persistent Bottom sticky bar showing player's current standings */}
      {playerRankIndex >= 0 && (
        <div 
          className="game-card animate-pulse" 
          style={{ 
            marginTop: '20px', 
            background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.08) 0%, transparent 100%)', 
            border: '1px solid var(--neon-cyan)',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-retro)' }}>YOUR STANDING</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>
              Rank #{playerRankNum}: {user.username}
            </h4>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Score</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-retro)' }}>{user.highScore}</div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Leaderboard;
