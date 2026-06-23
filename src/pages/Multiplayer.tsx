import React, { useState, useEffect, useRef } from 'react';
import { Users, Sword, Trophy, ShieldAlert, Coins, Sparkles, Send, CheckCircle2, Play } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { db, UserProfile, getCharacterEmoji } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

interface MultiplayerProps {
  user: UserProfile;
  onStartMatch: (
    roomId: string,
    opponentUsername: string,
    isHost: boolean,
    wagerType: 'free' | 'coins' | 'diamonds',
    wagerAmount: number,
    mode: 'vs' | 'boss',
    worldId?: string,
    difficulty?: string
  ) => void;
  showAlert: (title: string, message: string) => void;
}

interface ActiveRoom {
  roomCode: string;
  hostUsername: string;
  hostAvatar: string;
  hostTitle: string;
  hostCity: string;
  hostCountry: string;
  wagerType: 'free' | 'coins' | 'diamonds';
  wagerAmount: number;
  status: 'waiting' | 'ready' | 'playing';
}

export const Multiplayer: React.FC<MultiplayerProps> = ({
  user,
  onStartMatch,
  showAlert
}) => {
  const [activeTab, setActiveTab] = useState<'vs' | 'boss'>('vs');
  
  // VS Arena state
  const [wagerType, setWagerType] = useState<'free' | 'coins' | 'diamonds'>('free');
  const [wagerAmount, setWagerAmount] = useState<number>(0);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [lobbyMode, setLobbyMode] = useState<'vs' | 'boss'>('vs');
  const [bossDifficulty, setBossDifficulty] = useState<string>('normal');
  const [friendlyWorldId, setFriendlyWorldId] = useState<string>('world_forest');
  const [friendlyDifficulty, setFriendlyDifficulty] = useState<string>('normal');

  const broadcastRoomConfig = (wId: string, diff: string, md: 'vs' | 'boss' = 'vs') => {
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: 'broadcast',
        event: 'room-config-change',
        payload: {
          worldId: wId,
          difficulty: diff,
          mode: md
        }
      });
    }
  };
  
  // Active Room state (when inside a room)
  const [currentRoom, setCurrentRoom] = useState<ActiveRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [opponentInfo, setOpponentInfo] = useState<{ username: string; avatar: string; title: string; city: string; country: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Boss Raid states
  const [bossHp, setBossHp] = useState<number>(685420);
  const maxBossHp = 1000000;
  const [contributions, setContributions] = useState<{ username: string; damage: number; rank: number }[]>([
    { username: 'LumberKing', damage: 85400, rank: 1 },
    { username: 'ForestGump', damage: 62100, rank: 2 },
    { username: 'WoodyCutter', damage: 54900, rank: 3 },
    { username: 'OakSlayer', damage: 41200, rank: 4 },
  ]);

  // Supabase Channel references
  const lobbyChannelRef = useRef<any>(null);
  const roomChannelRef = useRef<any>(null);

  // Wager amounts suggestions
  const coinOptions = [100, 500, 1000];
  const diamondOptions = [5, 10, 50];

  useEffect(() => {
    // 1. Connect to global lobby presence channel to see active rooms
    const connectLobby = () => {
      const channel = supabase.channel('lumberjack-multiplayer-lobby');
      lobbyChannelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const rooms: ActiveRoom[] = [];
          
          Object.values(state).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.roomCode && p.status === 'waiting') {
                rooms.push({
                  roomCode: p.roomCode,
                  hostUsername: p.hostUsername,
                  hostAvatar: p.hostAvatar,
                  hostTitle: p.hostTitle,
                  hostCity: p.hostCity,
                  hostCountry: p.hostCountry,
                  wagerType: p.wagerType,
                  wagerAmount: p.wagerAmount,
                  status: p.status
                });
              }
            });
          });
          setActiveRooms(rooms);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Logged in user listens, but does not publish room unless hosting
          }
        });
    };

    connectLobby();

    // Cleanup channels on unmount
    return () => {
      if (lobbyChannelRef.current) supabase.removeChannel(lobbyChannelRef.current);
      if (roomChannelRef.current) supabase.removeChannel(roomChannelRef.current);
    };
  }, []);

  // Update room presence state on global lobby
  const publishRoomOnLobby = async (code: string, status: 'waiting' | 'ready' | 'playing') => {
    if (lobbyChannelRef.current) {
      await lobbyChannelRef.current.track({
        roomCode: code,
        hostUsername: user.username,
        hostAvatar: user.equippedCharacter,
        hostTitle: user.equippedTitle,
        hostCity: user.stats.location?.city || 'Mumbai',
        hostCountry: user.stats.location?.countryCode || 'IN',
        wagerType: wagerType,
        wagerAmount: wagerAmount,
        status: status,
        online_at: new Date().toISOString()
      });
    }
  };

  // Host a new match
  const handleHostMatch = async () => {
    sound.playCoin();
    // Currency pre-check
    if (wagerType === 'coins' && user.coins < wagerAmount) {
      showAlert('Insufficient Gold', `You need 🪙 ${wagerAmount} to host this wager match.`);
      return;
    }
    if (wagerType === 'diamonds' && user.diamonds < wagerAmount) {
      showAlert('Insufficient Gems', `You need 💎 ${wagerAmount} to host this wager match.`);
      return;
    }

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newRoom: ActiveRoom = {
      roomCode: code,
      hostUsername: user.username,
      hostAvatar: user.equippedCharacter,
      hostTitle: user.equippedTitle,
      hostCity: user.stats.location?.city || 'Mumbai',
      hostCountry: user.stats.location?.countryCode || 'IN',
      wagerType: wagerType,
      wagerAmount: wagerAmount,
      status: 'waiting'
    };

    setIsHost(true);
    setCurrentRoom(newRoom);
    setMyReady(false);
    setOpponentReady(false);
    setOpponentInfo(null);
    setChatMessages([{ sender: 'SYSTEM', text: `Room ${code} created. Wager: ${wagerType === 'free' ? 'FREE' : wagerType === 'coins' ? `🪙 ${wagerAmount}` : `💎 ${wagerAmount}`}` }]);

    // Track on global presence lobby
    await publishRoomOnLobby(code, 'waiting');

    // Subscribe to room-specific broadcast channel
    const roomChan = supabase.channel(`room-${code}`);
    roomChannelRef.current = roomChan;

    roomChan
      .on('broadcast', { event: 'join-lobby' }, (payload: any) => {
        // Opponent joined!
        sound.playCoin();
        setOpponentInfo({
          username: payload.payload.username,
          avatar: payload.payload.avatar,
          title: payload.payload.title,
          city: payload.payload.city,
          country: payload.payload.country
        });
        setChatMessages(prev => [...prev, { sender: 'SYSTEM', text: `${payload.payload.username} entered the arena.` }]);
        
        // Notify them of our presence and lobby state
        roomChan.send({
          type: 'broadcast',
          event: 'sync-lobby',
          payload: {
            hostUsername: user.username,
            hostAvatar: user.equippedCharacter,
            hostTitle: user.equippedTitle,
            hostCity: user.stats.location?.city || 'Mumbai',
            hostCountry: user.stats.location?.countryCode || 'IN',
            wagerType: wagerType,
            wagerAmount: wagerAmount,
            opponentReady: myReady,
            friendlyWorldId: friendlyWorldId,
            friendlyDifficulty: friendlyDifficulty,
            mode: lobbyMode
          }
        });
        
        publishRoomOnLobby(code, 'ready');
      })
      .on('broadcast', { event: 'state-change' }, (payload: any) => {
        if (payload.payload.username !== user.username) {
          setOpponentReady(payload.payload.ready);
        }
      })
      .on('broadcast', { event: 'chat' }, (payload: any) => {
        setChatMessages(prev => [...prev, { sender: payload.payload.sender, text: payload.payload.text }]);
      })
      .on('broadcast', { event: 'leave-lobby' }, (payload: any) => {
        setOpponentInfo(null);
        setOpponentReady(false);
        setChatMessages(prev => [...prev, { sender: 'SYSTEM', text: 'Opponent left the room.' }]);
        publishRoomOnLobby(code, 'waiting');
      })
      .subscribe();
  };

  // Join an existing match
  const handleJoinMatch = async (code: string) => {
    sound.playCoin();
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) return;

    // Find the room locally first in activeRooms
    const room = activeRooms.find(r => r.roomCode === formattedCode);
    const roomWagerType = room ? room.wagerType : 'free';
    const roomWagerAmount = room ? room.wagerAmount : 0;

    // Check currency
    if (roomWagerType === 'coins' && user.coins < roomWagerAmount) {
      showAlert('Insufficient Gold', `You need 🪙 ${roomWagerAmount} to join this wager match.`);
      return;
    }
    if (roomWagerType === 'diamonds' && user.diamonds < roomWagerAmount) {
      showAlert('Insufficient Gems', `You need 💎 ${roomWagerAmount} to join this wager match.`);
      return;
    }

    setIsHost(false);
    setMyReady(false);
    setOpponentReady(false);
    setChatMessages([{ sender: 'SYSTEM', text: `Connecting to room ${formattedCode}...` }]);

    const roomChan = supabase.channel(`room-${formattedCode}`);
    roomChannelRef.current = roomChan;

    roomChan
      .on('broadcast', { event: 'sync-lobby' }, (payload: any) => {
        // Sync lobby details from host
        sound.playCoin();
        const hostRoom: ActiveRoom = {
          roomCode: formattedCode,
          hostUsername: payload.payload.hostUsername,
          hostAvatar: payload.payload.hostAvatar,
          hostTitle: payload.payload.hostTitle,
          hostCity: payload.payload.hostCity,
          hostCountry: payload.payload.hostCountry,
          wagerType: payload.payload.wagerType,
          wagerAmount: payload.payload.wagerAmount,
          status: 'ready'
        };
        setCurrentRoom(hostRoom);
        setOpponentInfo({
          username: payload.payload.hostUsername,
          avatar: payload.payload.hostAvatar,
          title: payload.payload.hostTitle,
          city: payload.payload.hostCity,
          country: payload.payload.hostCountry
        });
        setOpponentReady(payload.payload.opponentReady);
        if (payload.payload.friendlyWorldId) {
          setFriendlyWorldId(payload.payload.friendlyWorldId);
        }
        if (payload.payload.friendlyDifficulty) {
          setFriendlyDifficulty(payload.payload.friendlyDifficulty);
        }
        if (payload.payload.mode) {
          setLobbyMode(payload.payload.mode);
        }
      })
      .on('broadcast', { event: 'room-config-change' }, (payload: any) => {
        setFriendlyWorldId(payload.payload.worldId);
        setFriendlyDifficulty(payload.payload.difficulty);
        if (payload.payload.mode) {
          setLobbyMode(payload.payload.mode);
        }
      })
      .on('broadcast', { event: 'state-change' }, (payload: any) => {
        if (payload.payload.username !== user.username) {
          setOpponentReady(payload.payload.ready);
        }
      })
      .on('broadcast', { event: 'chat' }, (payload: any) => {
        setChatMessages(prev => [...prev, { sender: payload.payload.sender, text: payload.payload.text }]);
      })
      .on('broadcast', { event: 'start-match' }, (payload: any) => {
        // Match starting!
        sound.playChest();
        
        // Deduct wagers first
        if (roomWagerType === 'coins') {
          db.addCoins(-roomWagerAmount);
        } else if (roomWagerType === 'diamonds') {
          db.addDiamonds(-roomWagerAmount);
        }

        onStartMatch(
          formattedCode,
          payload.payload.opponentUsername,
          false,
          roomWagerType,
          roomWagerAmount,
          payload.payload.mode || 'vs',
          payload.payload.worldId || friendlyWorldId,
          payload.payload.difficulty || friendlyDifficulty
        );
      })
      .on('broadcast', { event: 'leave-lobby' }, (payload: any) => {
        if (payload.payload.isHost) {
          handleLeaveRoom();
          showAlert('Lobby Closed', 'The host has closed the lobby.');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send join request to host
          roomChan.send({
            type: 'broadcast',
            event: 'join-lobby',
            payload: {
              username: user.username,
              avatar: user.equippedCharacter,
              title: user.equippedTitle,
              city: user.stats.location?.city || 'Mumbai',
              country: user.stats.location?.countryCode || 'IN'
            }
          });
        }
      });
  };

  // Leave active room
  const handleLeaveRoom = () => {
    sound.playCoin();
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: 'broadcast',
        event: 'leave-lobby',
        payload: {
          username: user.username,
          isHost: isHost
        }
      });
      supabase.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }

    if (isHost && currentRoom) {
      // Remove from global lobby
      if (lobbyChannelRef.current) {
        lobbyChannelRef.current.untrack();
      }
    }

    setCurrentRoom(null);
    setIsHost(false);
    setOpponentInfo(null);
    setOpponentReady(false);
    setMyReady(false);
    setChatMessages([]);
  };

  // Toggle ready status
  const toggleReady = () => {
    sound.playCoin();
    const newReady = !myReady;
    setMyReady(newReady);
    
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: 'broadcast',
        event: 'state-change',
        payload: {
          username: user.username,
          ready: newReady
        }
      });
    }
  };

  // Host starts the match
  const handleStartMatch = () => {
    if (!currentRoom || !opponentInfo || !myReady || !opponentReady) return;
    sound.playChest();

    // Deduct host wager
    if (currentRoom.wagerType === 'coins') {
      db.addCoins(-currentRoom.wagerAmount);
    } else if (currentRoom.wagerType === 'diamonds') {
      db.addDiamonds(-currentRoom.wagerAmount);
    }

    // Broadcast match start
    if (roomChannelRef.current) {
      roomChannelRef.current.send({
        type: 'broadcast',
        event: 'start-match',
        payload: {
          opponentUsername: user.username,
          worldId: friendlyWorldId,
          difficulty: friendlyDifficulty,
          mode: lobbyMode
        }
      });
    }

    // Remove room from global lobbies
    if (lobbyChannelRef.current) {
      lobbyChannelRef.current.untrack();
    }

    onStartMatch(currentRoom.roomCode, opponentInfo.username, true, currentRoom.wagerType, currentRoom.wagerAmount, lobbyMode, friendlyWorldId, friendlyDifficulty);
  };

  // Send lobby chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomChannelRef.current) return;
    
    roomChannelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: {
        sender: user.username,
        text: chatInput
      }
    });

    setChatMessages(prev => [...prev, { sender: user.username, text: chatInput }]);
    setChatInput('');
  };

  // Launch cooperative guild boss raid run
  const handleLaunchRaid = () => {
    sound.playChest();
    onStartMatch('boss-raid-room', 'Barkgorgon', true, 'free', 0, 'boss');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      {/* Tab selection menu */}
      {currentRoom === null && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px', marginTop: '10px' }}>
          <button 
            className="neon-btn-cyan"
            style={{
              padding: '12px 24px', fontSize: '0.85rem',
              background: activeTab === 'vs' ? 'var(--neon-cyan)' : 'transparent',
              color: activeTab === 'vs' ? '#000' : 'var(--neon-cyan)',
              borderWidth: '2px', boxShadow: 'none'
            }}
            onClick={() => { sound.playCoin(); setActiveTab('vs'); }}
          >
            ⚔️ Live 1v1 Arena
          </button>
          
          <button 
            className="neon-btn-magenta"
            style={{
              padding: '12px 24px', fontSize: '0.85rem',
              background: activeTab === 'boss' ? 'var(--neon-magenta)' : 'transparent',
              color: activeTab === 'boss' ? '#000' : 'var(--neon-magenta)',
              borderWidth: '2px', boxShadow: 'none'
            }}
            onClick={() => { sound.playCoin(); setActiveTab('boss'); }}
          >
            👹 Boss Raid
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LOBBY / ROOM ACTIVE VIEW */}
      {/* ========================================================================= */}
      {currentRoom !== null && (
        <div className="material-wood" style={{ padding: '24px', background: 'var(--panel-bg)', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div>
              <span className="rarity-tag rarity-legendary" style={{ fontSize: '10px' }}>
                LOBBY CODE: {currentRoom.roomCode}
              </span>
              <h2 className="retro-title" style={{ fontSize: '1rem', marginTop: '6px', color: 'var(--text-primary)', textShadow: 'none' }}>
                Wager: {currentRoom.wagerType === 'free' ? 'Friendly Match' : `${currentRoom.wagerType === 'coins' ? '🪙' : '💎'} ${currentRoom.wagerAmount}`}
              </h2>
            </div>
            <button className="neon-btn-red" style={{ padding: '6px 14px', fontSize: '0.7rem' }} onClick={handleLeaveRoom}>
              LEAVE ROOM
            </button>
          </div>

          {/* Player Cards side-by-side */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'center', flex: 1, margin: '20px 0' }}>
            
            {/* Host Card */}
            <div className="material-paper" style={{ padding: '20px', width: '220px', height: '220px', border: isHost ? '2px solid var(--neon-yellow)' : '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>{getCharacterEmoji(isHost ? user.equippedCharacter : opponentInfo?.avatar || 'char_lumberjack')}</div>
              <div>
                <h4 style={{ fontWeight: 'bold', margin: '4px 0 0', fontSize: '0.9rem' }}>{isHost ? user.username : opponentInfo?.username}</h4>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{isHost ? user.equippedTitle : opponentInfo?.title}</span>
              </div>
              <span className={isHost ? (myReady ? 'rarity-tag rarity-legendary' : 'rarity-tag') : (opponentReady ? 'rarity-tag rarity-legendary' : 'rarity-tag')} style={{ fontSize: '9px' }}>
                {isHost ? (myReady ? 'READY ✓' : 'PREPARING') : (opponentReady ? 'READY ✓' : 'PREPARING')}
              </span>
            </div>

            {/* VS Icon */}
            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', color: 'var(--neon-magenta)', textShadow: '0 0 10px rgba(236, 72, 153, 0.4)' }}>
              VS
            </div>

            {/* Opponent Card */}
            <div className="material-paper" style={{ padding: '20px', width: '220px', height: '220px', border: !isHost ? '2px solid var(--neon-yellow)' : '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
              {!isHost && opponentInfo === null ? (
                // We are not host, but host info is not loaded yet
                <div style={{ margin: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Syncing host details...</div>
              ) : opponentInfo ? (
                <>
                  <div style={{ fontSize: '2.5rem' }}>{getCharacterEmoji(opponentInfo.avatar)}</div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', margin: '4px 0 0', fontSize: '0.9rem' }}>{opponentInfo.username}</h4>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{opponentInfo.title}</span>
                  </div>
                  <span className={!isHost ? (myReady ? 'rarity-tag rarity-legendary' : 'rarity-tag') : (opponentReady ? 'rarity-tag rarity-legendary' : 'rarity-tag')} style={{ fontSize: '9px' }}>
                    {!isHost ? (myReady ? 'READY ✓' : 'PREPARING') : (opponentReady ? 'READY ✓' : 'PREPARING')}
                  </span>
                </>
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', animation: 'spin 3s linear infinite', marginBottom: '8px' }}>⏳</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Waiting for opponent...</div>
                </div>
              )}
            </div>

          </div>

          {/* Friendly Match Customizations */}
          {currentRoom.wagerType === 'free' && (
            <div style={{ margin: '12px auto', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--panel-border)', borderRadius: '8px', width: '100%', maxWidth: '520px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
              {isHost ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>Choose Map</label>
                    <select 
                      value={friendlyWorldId} 
                      onChange={e => {
                        sound.playCoin();
                        setFriendlyWorldId(e.target.value);
                        broadcastRoomConfig(e.target.value, friendlyDifficulty);
                      }}
                      className="form-input"
                      style={{ width: '170px', height: '34px', fontSize: '0.75rem', padding: '0 8px', background: 'var(--bg-color)' }}
                    >
                      <option value="world_forest">Pine Forest</option>
                      <option value="world_city">Metro Heights</option>
                      <option value="world_ice">Glacial Spires</option>
                      <option value="world_cyber">Vector Core</option>
                      <option value="world_volcano">Magma Core</option>
                      <option value="world_autumn">Autumn Canopy</option>
                      <option value="world_desert">Sand Dune Oasis</option>
                      <option value="world_haunted">Haunted Graveyard</option>
                      <option value="world_space">Space Station</option>
                      <option value="world_wasteland">Toxic Wasteland</option>
                      <option value="world_steampunk">Steampunk Workshop</option>
                      <option value="world_candy">Candy Land</option>
                      <option value="world_zen">Zen Garden</option>
                      <option value="world_coral">Coral Reef</option>
                      <option value="world_cyberpunk">Cyberpunk Grid</option>
                      <option value="world_prehistoric">Prehistoric Jungle</option>
                      <option value="world_sky">Sky Sanctuary</option>
                      <option value="world_arcade">Retro Arcade</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>Choose Difficulty</label>
                    <select 
                      value={friendlyDifficulty} 
                      onChange={e => {
                        sound.playCoin();
                        setFriendlyDifficulty(e.target.value);
                        broadcastRoomConfig(friendlyWorldId, e.target.value);
                      }}
                      className="form-input"
                      style={{ width: '150px', height: '34px', fontSize: '0.75rem', padding: '0 8px', background: 'var(--bg-color)' }}
                    >
                      <option value="easy">Easy (0.5x)</option>
                      <option value="normal">Normal (1.0x)</option>
                      <option value="hard">Hard (1.5x)</option>
                      <option value="extreme">Extreme (2.0x)</option>
                      <option value="nightmare">Nightmare (3.0x)</option>
                      <option value="impossible">Impossible (5.0x)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '24px', fontSize: '0.82rem', color: 'var(--text-primary)', justifySelf: 'center' }}>
                  <span>🗺️ Map: <strong style={{ color: 'var(--neon-cyan)' }}>{friendlyWorldId.replace('world_', '').toUpperCase()}</strong></span>
                  <span>⚔️ Difficulty: <strong style={{ color: 'var(--neon-yellow)' }}>{friendlyDifficulty.toUpperCase()}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div style={{ display: 'flex', gap: '16px', margin: '10px 0' }}>
            <button 
              className={myReady ? 'neon-btn-magenta' : 'neon-btn-cyan'}
              style={{ flex: 1, padding: '12px', fontSize: '0.8rem' }}
              onClick={toggleReady}
            >
              {myReady ? 'UNREADY' : 'MARK READY'}
            </button>

            {isHost && (
              <button 
                className="neon-btn-yellow"
                style={{ flex: 1.5, padding: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleStartMatch}
                disabled={!opponentReady || !myReady}
              >
                <Play size={16} /> START CHALLENGE
              </button>
            )}
          </div>

          {/* Chat Console */}
          <div className="material-paper" style={{ padding: '12px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', height: '140px', marginTop: '14px' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', textAlign: 'left', marginBottom: '8px', paddingRight: '4px' }}>
              {chatMessages.map((msg, index) => (
                <div key={index}>
                  {msg.sender === 'SYSTEM' ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{msg.text}</span>
                  ) : (
                    <>
                      <strong style={{ color: msg.sender === user.username ? 'var(--neon-cyan)' : 'var(--neon-magenta)' }}>{msg.sender}: </strong>
                      <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Type messages to opponent..." 
                className="form-input" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.78rem', height: '32px' }}
              />
              <button className="neon-btn-cyan" style={{ padding: '0 12px', height: '32px' }} type="submit">
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB VIEW: VS ARENA LOBBY FINDER */}
      {/* ========================================================================= */}
      {currentRoom === null && activeTab === 'vs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Host Panel (Left) */}
          <div className="material-wood" style={{ padding: '24px', background: 'var(--panel-bg)' }}>
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-cyan)', marginBottom: '20px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '8px', textAlign: 'left' }}>
              🛡️ INITIALIZE VS DUEL
            </h3>

            {/* Wager selectors */}
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select Wager Currency
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['free', 'coins', 'diamonds'] as const).map(wType => (
                  <button
                    key={wType}
                    className="neon-btn-cyan"
                    style={{
                      flex: 1, padding: '8px', fontSize: '0.65rem',
                      background: wagerType === wType ? 'var(--neon-cyan)' : 'transparent',
                      color: wagerType === wType ? '#000' : 'var(--neon-cyan)',
                      borderWidth: '2px', boxShadow: 'none'
                    }}
                    onClick={() => { sound.playCoin(); setWagerType(wType); setWagerAmount(0); }}
                  >
                    {wType === 'free' ? 'FRIENDLY' : wType.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Wager amounts */}
            {wagerType !== 'free' && (
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Wager Amount ({wagerType === 'coins' ? 'Gold' : 'Gems'})
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(wagerType === 'coins' ? coinOptions : diamondOptions).map(amount => (
                    <button
                      key={amount}
                      className="neon-btn-yellow"
                      style={{
                        flex: 1, padding: '8px', fontSize: '0.65rem',
                        background: wagerAmount === amount ? 'var(--neon-yellow)' : 'transparent',
                        color: wagerAmount === amount ? '#000' : 'var(--neon-yellow)',
                        borderWidth: '2px', boxShadow: 'none'
                      }}
                      onClick={() => { sound.playCoin(); setWagerAmount(amount); }}
                    >
                      {wagerType === 'coins' ? `🪙 ${amount}` : `💎 ${amount}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="neon-btn-yellow"
              style={{ width: '100%', padding: '14px', fontSize: '0.85rem', marginBottom: '24px' }}
              onClick={handleHostMatch}
            >
              HOST NEW ARENA LOBBY
            </button>

            {/* Direct Join Code */}
            <div style={{ borderTop: '1px dashed var(--panel-border)', paddingTop: '20px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Enter Secret Room Code
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. ABCD" 
                  className="form-input" 
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', height: '38px', fontSize: '0.82rem', flex: 1 }}
                />
                <button 
                  className="neon-btn-cyan" 
                  style={{ padding: '0 16px', fontSize: '0.7rem' }}
                  onClick={() => handleJoinMatch(roomCodeInput)}
                >
                  ENTER DUEL
                </button>
              </div>
            </div>

          </div>

          {/* Active Lobbies Panel (Right) */}
          <div className="material-paper" style={{ padding: '24px', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', height: '480px' }}>
            <h3 className="retro-title" style={{ fontSize: '0.82rem', color: 'var(--neon-magenta)', marginBottom: '16px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '8px', textAlign: 'left' }}>
              🗡️ ACTIVE VS LOBBIES
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {activeRooms.length > 0 ? (
                activeRooms.map(room => (
                  <div 
                    key={room.roomCode}
                    style={{
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-color)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{getCharacterEmoji(room.hostAvatar)}</span>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                          {room.hostUsername}
                        </strong>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          {room.hostTitle} • Room: {room.roomCode}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--neon-yellow)', marginBottom: '6px' }}>
                        Wager: {room.wagerType === 'free' ? 'Free' : room.wagerType === 'coins' ? `🪙 ${room.wagerAmount}` : `💎 ${room.wagerAmount}`}
                      </span>
                      <button 
                        className="neon-btn-cyan" 
                        style={{ padding: '4px 10px', fontSize: '0.65rem' }}
                        onClick={() => handleJoinMatch(room.roomCode)}
                      >
                        DUEL
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>No hosts waiting on the scroll. Host a room to start!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB VIEW: CO-OP GUILD BOSS RAID */}
      {/* ========================================================================= */}
      {currentRoom === null && activeTab === 'boss' && (
        <div className="material-wood" style={{ padding: '36px 24px', background: 'var(--panel-bg)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Dynamic Fog Backdrop for Boss environment */}
          <div className="fog-layer" style={{ opacity: 0.15 }}></div>

          <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 5 }}>
            <span className="rarity-tag rarity-legendary" style={{ animation: 'pulseNeon 1s infinite', fontSize: '10px' }}>
              ⚔️ ACTIVE WORLD RAID EVENT ⚔️
            </span>
            <h2 className="retro-title" style={{ fontSize: '1.4rem', color: 'var(--neon-yellow)', margin: '8px 0 0' }}>
              BARKGORGON, THE BEHEMOTH
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '4px 0 0' }}>
              Coordinate with lumberjacks globally to chop down the colossal boss tree and slay the forest monster!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', position: 'relative', zIndex: 5 }}>
            
            {/* Left Column: 3D Boss Tree & Floating Monster Representation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Premium 3D-Look Environment Container */}
              <div 
                className="material-paper"
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  height: '340px',
                  background: 'linear-gradient(180deg, #1e1b18 0%, #0c0806 100%)',
                  border: '3px solid var(--neon-magenta)',
                  boxShadow: '0 12px 30px rgba(236, 72, 153, 0.25), inset 0 0 20px rgba(0,0,0,0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '24px 16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Boss Monster Sitting at the Top */}
                <div 
                  className="character-breath"
                  style={{
                    fontSize: '6.5rem',
                    zIndex: 10,
                    textShadow: '0 0 25px rgba(239, 68, 68, 0.7)',
                    position: 'relative'
                  }}
                >
                  👹
                </div>

                {/* Colossal Tree Base */}
                <div 
                  style={{
                    width: '60px',
                    height: '140px',
                    background: 'linear-gradient(90deg, #2b1810 0%, #45281a 50%, #2b1810 100%)',
                    border: '2px solid #1a0f0a',
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    zIndex: 5,
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                    position: 'relative'
                  }}
                >
                  {/* Pinned leaves representing branches */}
                  <div style={{ position: 'absolute', top: '10px', left: '-30px', fontSize: '2rem' }}>🌿</div>
                  <div style={{ position: 'absolute', top: '50px', right: '-30px', fontSize: '2rem' }}>🌿</div>
                  <div style={{ position: 'absolute', top: '90px', left: '-30px', fontSize: '2rem' }}>🌿</div>
                </div>

                {/* Ground platform */}
                <div style={{ width: '100%', height: '10px', background: 'var(--neon-magenta)', filter: 'blur(2px)', zIndex: 6 }}></div>
              </div>

              {/* 3D HP Bar */}
              <div style={{ width: '100%', maxWidth: '320px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 'bold' }}>
                  <span>BOSS HP: {bossHp.toLocaleString()} / {maxBossHp.toLocaleString()}</span>
                  <span style={{ color: 'var(--neon-magenta)' }}>{((bossHp/maxBossHp)*100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar-container" style={{ height: '16px', background: 'rgba(0,0,0,0.5)', border: '2px solid var(--panel-border)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${(bossHp/maxBossHp)*100}%`,
                      backgroundColor: 'var(--neon-red)',
                      backgroundImage: 'linear-gradient(90deg, var(--neon-red) 0%, var(--neon-magenta) 100%)',
                      boxShadow: '0 0 8px var(--neon-red)'
                    }}
                  ></div>
                </div>
              </div>

              <button 
                className="neon-btn-magenta"
                style={{ width: '100%', maxWidth: '320px', padding: '14px', fontSize: '0.85rem', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleLaunchRaid}
              >
                ⚔️ LAUNCH RAID ASSAULT
              </button>
            </div>

            {/* Right Column: Guild Contributions Leaderboard */}
            <div className="material-paper" style={{ padding: '20px', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
              <h3 className="retro-title" style={{ fontSize: '0.8rem', color: 'var(--neon-yellow)', marginBottom: '16px', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '6px', textAlign: 'left' }}>
                🏆 RAID DAMAGE LEDGER
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {contributions.map((c) => (
                  <div 
                    key={c.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.7' + 'rem', color: 'var(--text-secondary)', minWidth: '24px' }}>
                        #{c.rank}
                      </span>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{c.username}</strong>
                    </div>

                    <span style={{ fontFamily: 'var(--font-retro)', fontSize: '0.7rem', color: 'var(--neon-red)', fontWeight: 'bold' }}>
                      💥 {c.damage.toLocaleString()} DMG
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '12px', border: '1px dashed var(--panel-border)', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.05)', fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                ⭐ <strong>Raid Rule:</strong> 1 chop dealt to the tree = 1 damage dealt to the boss. Slay the boss to earn up to 🪙 1,000 Coins and 💎 20 Gems for your guild contributions!
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Multiplayer;
