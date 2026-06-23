import React, { useState } from 'react';
import { Search, Globe, Award, Trophy, Shield } from 'lucide-react';
import { db, LeaderboardEntry, UserProfile, getCharacterEmoji } from '../utils/LocalStorageDB';

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
};

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

  // Get mapped entries based on timeframe
  const getMappedEntries = () => {
    // Since the game has started for less than a week, weekly and all-time are identical
    if (timeframe === 'all' || timeframe === 'weekly') {
      return leaderboard;
    }

    // Daily timeframe: only show players who actually played today (stats.lastDailyKey === todayKey)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const todayKey = `${now.getFullYear()}-${dayOfYear}`;

    const mapped = leaderboard.map(entry => {
      const isMe = entry.username === user.username;
      const playerStats = isMe ? (user.stats || {}) : (entry.stats || {});
      
      let score = 0;
      let coins = 0;
      let maxCombo = 0;

      if (playerStats.lastDailyKey === todayKey && playerStats.dailyScores && playerStats.dailyScores.score > 0) {
        score = playerStats.dailyScores.score;
        coins = playerStats.dailyScores.coins;
        maxCombo = playerStats.dailyScores.combo;
      }

      return {
        ...entry,
        score,
        coins,
        maxCombo
      };
    });

    return mapped.filter(entry => entry.score > 0);
  };

  const getSortedEntries = (list: LeaderboardEntry[]) => {
    let sorted = [...list];
    if (category === 'score') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (category === 'coins') {
      sorted.sort((a, b) => b.coins - a.coins);
    } else {
      sorted.sort((a, b) => b.maxCombo - a.maxCombo);
    }

    if (searchQuery.trim() !== '') {
      sorted = sorted.filter(entry => 
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sorted;
  };

  const getSortedEntriesUnfiltered = (list: LeaderboardEntry[]) => {
    let sorted = [...list];
    if (category === 'score') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (category === 'coins') {
      sorted.sort((a, b) => b.coins - a.coins);
    } else {
      sorted.sort((a, b) => b.maxCombo - a.maxCombo);
    }
    return sorted;
  };

  const mappedList = getMappedEntries();
  const sortedList = getSortedEntries(mappedList);
  const unfilteredSortedList = getSortedEntriesUnfiltered(mappedList);
  const playerRankIndex = unfilteredSortedList.findIndex(entry => entry.username === user.username);
  const playerRankNum = playerRankIndex >= 0 ? playerRankIndex + 1 : '100+';
  const myEntry = playerRankIndex >= 0 ? unfilteredSortedList[playerRankIndex] : null;

  const getRealRank = (username: string) => {
    const index = unfilteredSortedList.findIndex(entry => entry.username === username);
    return index >= 0 ? index + 1 : '-';
  };

  const showPodium = searchQuery.trim() === '';
  const listToRender = showPodium ? sortedList.slice(3) : sortedList;

  const getRecordTitle = () => {
    const prefix = timeframe === 'all' ? 'RECORD' : (timeframe === 'weekly' ? 'WEEKLY' : 'DAILY');
    if (category === 'score') return `${prefix} SCORE`;
    if (category === 'coins') return `${prefix} GOLD`;
    return `${prefix} COMBO`;
  };

  const getRecordValue = () => {
    if (!myEntry) return '0';
    if (category === 'score') return myEntry.score.toLocaleString();
    if (category === 'coins') return `🪙 ${myEntry.coins.toLocaleString()}`;
    return `${myEntry.maxCombo}x`;
  };


  const renderPodiumCard = (entry: LeaderboardEntry, rank: 1 | 2 | 3) => {
    const isMe = entry.username === user.username;
    
    // Podium sizes & medal colors
    const height = rank === 1 ? '220px' : (rank === 2 ? '190px' : '175px');
    const medal = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : '🥉');
    const scale = rank === 1 ? 'scale(1.05) translateY(-6px)' : 'none';

    // Premium Metallic Styling Options
    let bgGradient = '';
    let borderTheme = '';
    let cardShadow = '';
    let textTheme = '';
    let subtextTheme = '';
    let scoreFooterBg = '';
    let scoreColor = '';

    if (rank === 1) {
      bgGradient = 'linear-gradient(135deg, #FFFDF0 0%, #FFEFC4 25%, #FFDF7A 60%, #FFCC33 85%, #FFB300 100%)';
      borderTheme = '#F59E0B';
      cardShadow = '0 12px 28px rgba(245, 158, 11, 0.25), inset 0 0 18px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.05)';
      textTheme = '#78350F';
      subtextTheme = '#92400E';
      scoreFooterBg = 'rgba(251, 191, 36, 0.2)';
      scoreColor = '#B45309';
    } else if (rank === 2) {
      bgGradient = 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 25%, #E5E7EB 60%, #D1D5DB 85%, #9CA3AF 100%)';
      borderTheme = '#9CA3AF';
      cardShadow = '0 10px 22px rgba(156, 163, 175, 0.2), inset 0 0 15px rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.05)';
      textTheme = '#374151';
      subtextTheme = '#4B5563';
      scoreFooterBg = 'rgba(156, 163, 175, 0.25)';
      scoreColor = '#374151';
    } else {
      bgGradient = 'linear-gradient(135deg, #FFFBF9 0%, #FEEFDF 25%, #FED7AA 60%, #FDBA74 85%, #EA580C 100%)';
      borderTheme = '#D97706';
      cardShadow = '0 8px 18px rgba(217, 119, 6, 0.18), inset 0 0 12px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0,0,0,0.05)';
      textTheme = '#9A3412';
      subtextTheme = '#B45309';
      scoreFooterBg = 'rgba(249, 115, 22, 0.15)';
      scoreColor = '#9A3412';
    }

    const finalShadow = isMe 
      ? `${cardShadow}, 0 0 15px rgba(14, 165, 233, 0.6)`
      : cardShadow;

    const finalBorder = isMe 
      ? `3px solid var(--neon-cyan)` 
      : `3px solid ${borderTheme}`;

    return (
      <div
        className="material-wood"
        style={{
          width: '210px',
          height: height,
          background: bgGradient,
          border: finalBorder,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px',
          transform: scale,
          boxShadow: finalShadow,
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
            {getCharacterEmoji(entry.avatar)}
          </div>
          
          <h4 className="retro-title" style={{ 
            fontSize: '0.72rem', 
            margin: '0 0 2px', 
            textShadow: isMe ? '0 1px 2px rgba(0,0,0,0.5)' : 'none', 
            color: isMe ? 'var(--neon-cyan)' : textTheme, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {entry.username}
          </h4>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: subtextTheme }}>
            <span>{getFlagEmoji(entry.country)} {entry.city || ''}</span>
            <span>•</span>
            <span style={{ textTransform: 'uppercase' }}>{entry.title.split(' ')[0]}</span>
          </div>
        </div>

        {/* Podium score footer */}
        <div style={{ background: scoreFooterBg, borderRadius: '4px', padding: '6px', fontFamily: 'var(--font-retro)', fontSize: '0.65rem', color: scoreColor, fontWeight: 'bold' }}>
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
          background: 'var(--panel-bg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.02)'
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
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
            {(['daily', 'weekly', 'all'] as const).map(tf => (
              <button
                key={tf}
                style={{
                  background: timeframe === tf ? 'var(--neon-yellow)' : 'transparent',
                  border: 'none',
                  color: timeframe === tf ? '#000' : 'var(--text-secondary)',
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
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.82rem', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {showPodium && (
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
      )}

      {/* Sub-podium players list (Parchment Scrolls) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
        {listToRender.length > 0 ? (
          listToRender.map((entry) => {
            const rankNum = getRealRank(entry.username);
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
                  color: 'var(--text-primary)',
                  border: isMe ? '2px solid var(--neon-cyan)' : '1px solid var(--panel-border)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                  background: isMe ? 'rgba(14, 165, 233, 0.05)' : 'var(--panel-bg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '36px' }}>
                    #{rankNum}
                  </span>
                  
                  <span style={{ fontSize: '1.25rem' }}>
                    {getCharacterEmoji(entry.avatar)}
                  </span>

                  <div>
                    <span style={{ fontWeight: '800', color: isMe ? 'var(--neon-cyan)' : 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span style={{ fontSize: '0.6rem', background: 'var(--neon-cyan)', color: '#000', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>
                        YOU
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>
                      {getFlagEmoji(entry.country)} {entry.city || ''} • {entry.title}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.72rem', fontWeight: 'bold', color: category === 'score' ? 'var(--text-primary)' : (category === 'coins' ? 'var(--neon-yellow)' : 'var(--neon-magenta)'), minWidth: '80px', textAlign: 'right' }}>
                    {category === 'score' ? entry.score : (category === 'coins' ? `🪙 ${entry.coins.toLocaleString()}` : `${entry.maxCombo}x`)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="material-paper" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {showPodium ? "No further logs available on the scroll." : "No matching players found."}
          </div>
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
            color: 'var(--text-primary)',
            background: 'var(--panel-bg)',
            border: '1px dashed var(--panel-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--neon-yellow)', fontFamily: 'var(--font-retro)' }}>YOUR CURRENT STANDING</div>
            <h4 className="retro-title" style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-primary)', textShadow: 'none' }}>
              Rank #{playerRankNum} • {user.username}
            </h4>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{getRecordTitle()}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)' }}>
              {getRecordValue()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
