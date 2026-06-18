import React, { useState } from 'react';
import { Search, Globe, Award, Trophy, Shield } from 'lucide-react';
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

    if (searchQuery.trim() !== '') {
      list = list.filter(entry => 
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list;
  };

  const sortedList = getSortedEntries();
  const playerRankIndex = leaderboard.findIndex(entry => entry.username === user.username);
  const playerRankNum = playerRankIndex >= 0 ? playerRankIndex + 1 : '10+';

  const renderPodiumCard = (entry: LeaderboardEntry, rank: 1 | 2 | 3) => {
    const isMe = entry.username === user.username;
    
    // Podium sizes & medal colors
    const height = rank === 1 ? '220px' : (rank === 2 ? '190px' : '175px');
    const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : '🥉');
    const borderTheme = rank === 1 ? 'var(--neon-yellow)' : (rank === 2 ? '#b5b5b5' : '#cd7f32');
    const scale = rank === 1 ? 'scale(1.05) translateY(-6px)' : 'none';

    return (
      <div
        className="material-wood"
        style={{
          width: '210px',
          height: height,
          background: 'linear-gradient(180deg, #322116, #20140d)',
          borderWidth: '3px',
          borderColor: borderTheme,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          transform: scale,
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {/* Medal Ring */}
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 5 }}>
          {medal}
        </div>

        <div style={{ marginTop: '8px' }}>
          {/* Avatar breathing */}
          <div className="character-breath" style={{ fontSize: '2.5rem', marginBottom: '4px' }}>
            {entry.avatar === 'char_lumberjack' ? '🪓' : (entry.avatar === 'char_viking' ? '🛡️' : (entry.avatar === 'char_knight' ? '⚔️' : (entry.avatar === 'char_samurai' ? '🥷' : (entry.avatar === 'char_wizard' ? '🧙' : (entry.avatar === 'char_alien' ? '👽' : '🤖')))))}
          </div>
          
          <h4 className="retro-title" style={{ fontSize: '0.72rem', margin: '0 0 2px', textShadow: 'none', color: isMe ? 'var(--neon-cyan)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.username}
          </h4>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
            <span>{entry.country === 'US' ? '🇺🇸' : (entry.country === 'JP' ? '🇯🇵' : (entry.country === 'NO' ? '🇳🇴' : (entry.country === 'KR' ? '🇰🇷' : (entry.country === 'CA' ? '🇨🇦' : '🌐'))))}</span>
            <span>•</span>
            <span style={{ textTransform: 'uppercase' }}>{entry.title.split(' ')[0]}</span>
          </div>
        </div>

        {/* Podium score footer */}
        <div style={{ background: '#1c130d', borderRadius: '4px', padding: '6px', fontFamily: 'var(--font-retro)', fontSize: '0.65rem', color: category === 'score' ? '#fff' : (category === 'coins' ? 'var(--neon-yellow)' : 'var(--neon-magenta)') }}>
          {category === 'score' ? entry.score : (category === 'coins' ? `🪙 ${entry.coins}` : `${entry.maxCombo}x`)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      {/* Filters Board Panel */}
      <div 
        className="material-wood" 
        style={{ 
          padding: '20px', 
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #2b1d14, #22160f)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Category triggers */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="neon-btn-cyan" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'score' ? 'var(--neon-cyan)' : 'transparent',
                color: category === 'score' ? '#000' : 'var(--neon-cyan)',
                borderWidth: '2px', boxShadow: 'none'
              }}
              onClick={() => setCategory('score')}
            >
              HIGH SCORE
            </button>
            <button 
              className="neon-btn-yellow" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'coins' ? 'var(--neon-yellow)' : 'transparent',
                color: category === 'coins' ? '#000' : 'var(--neon-yellow)',
                borderWidth: '2px', boxShadow: 'none'
              }}
              onClick={() => setCategory('coins')}
            >
              GOLD COLLECTED
            </button>
            <button 
              className="neon-btn-magenta" 
              style={{
                padding: '8px 16px', fontSize: '0.7rem',
                background: category === 'combo' ? 'var(--neon-magenta)' : 'transparent',
                color: category === 'combo' ? '#000' : 'var(--neon-magenta)',
                borderWidth: '2px', boxShadow: 'none'
              }}
              onClick={() => setCategory('combo')}
            >
              MAX COMBO
            </button>
          </div>

          {/* Timeframe Tag Selectors */}
          <div style={{ display: 'flex', gap: '4px', background: '#1c130d', padding: '4px', borderRadius: '6px', border: '2px solid #422a1b' }}>
            {(['daily', 'weekly', 'all'] as const).map(tf => (
              <button
                key={tf}
                style={{
                  background: timeframe === tf ? '#422a1b' : 'transparent',
                  border: 'none',
                  color: timeframe === tf ? 'var(--neon-yellow)' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Filter names..." 
              className="form-input" 
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.82rem', background: '#150d09', border: '2px solid #422a1b' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          alignItems: 'flex-end', 
          gap: '16px', 
          marginBottom: '32px',
          marginTop: '20px'
        }}
      >
        {sortedList[1] && renderPodiumCard(sortedList[1], 2)}
        {sortedList[0] && renderPodiumCard(sortedList[0], 1)}
        {sortedList[2] && renderPodiumCard(sortedList[2], 3)}
      </div>

      {/* Sub-podium players list (Parchment Scrolls) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
        {sortedList.length > 3 ? (
          sortedList.slice(3).map((entry, index) => {
            const rankNum = index + 4;
            const isMe = entry.username === user.username;
            return (
              <div 
                key={entry.username}
                className="material-paper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  color: '#2b2112',
                  border: isMe ? '2px solid var(--neon-cyan)' : '1px solid #e9dcb9',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                  background: isMe ? '#fffceb' : '#fdf6e2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.72rem', color: '#7c654e', minWidth: '36px' }}>
                    #{rankNum}
                  </span>
                  
                  <span style={{ fontSize: '1.25rem' }}>
                    {entry.avatar === 'char_lumberjack' ? '🪓' : (entry.avatar === 'char_viking' ? '🛡️' : (entry.avatar === 'char_knight' ? '⚔️' : (entry.avatar === 'char_samurai' ? '🥷' : (entry.avatar === 'char_wizard' ? '🧙' : (entry.avatar === 'char_alien' ? '👽' : '🤖')))))}
                  </span>

                  <div>
                    <span style={{ fontWeight: '800', color: isMe ? '#8c5922' : '#3b2410', fontSize: '0.88rem' }}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span style={{ fontSize: '0.6rem', background: 'var(--neon-cyan)', color: '#000', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>
                        YOU
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', color: '#7c654e', display: 'block' }}>
                      {entry.title}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '1.1rem' }}>
                    {entry.country === 'US' ? '🇺🇸' : (entry.country === 'JP' ? '🇯🇵' : (entry.country === 'NO' ? '🇳🇴' : (entry.country === 'KR' ? '🇰🇷' : (entry.country === 'CA' ? '🇨🇦' : '🌐'))))}
                  </span>
                  
                  <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.72rem', fontWeight: 'bold', color: category === 'score' ? '#3b2410' : (category === 'coins' ? '#8c5922' : '#9a2415'), minWidth: '80px', textAlign: 'right' }}>
                    {category === 'score' ? entry.score : (category === 'coins' ? `🪙 ${entry.coins.toLocaleString()}` : `${entry.maxCombo}x`)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          sortedList.length <= 3 && (
            <div className="material-paper" style={{ padding: '30px', textAlign: 'center', color: '#7c654e' }}>
              No further logs available on the scroll.
            </div>
          )
        )}
      </div>

      {/* Bottom Sticky Standings Bar (Stitched Leather box) */}
      {playerRankIndex >= 0 && (
        <div 
          className="material-leather" 
          style={{ 
            marginTop: '20px', 
            padding: '16px 24px',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--neon-yellow)', fontFamily: 'var(--font-retro)' }}>YOUR CURRENT STANDING</div>
            <h4 className="retro-title" style={{ fontSize: '0.85rem', marginTop: '4px', color: '#fff', textShadow: 'none' }}>
              Rank #{playerRankNum} • {user.username}
            </h4>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>HIGH SCORE RECORD</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)' }}>
              {user.highScore}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
