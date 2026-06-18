import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/AudioEngine';

interface CanvasGameProps {
  worldId: string;
  characterId: string;
  weaponId: string;
  trailId: string;
  onGameOver: (score: number, maxCombo: number, coins: number, diamonds: number) => void;
  onScoreUpdate: (score: number, combo: number) => void;
}

// Pixel art definitions for characters (16x16 matrices)
// '.' = transparent, 'K' = black outline, 'S' = skin, 'B' = blue, 'R' = red, 'G' = green, 'Y' = yellow, 'W' = white, 'O' = orange, 'P' = purple, 'C' = cyan, 'M' = magenta, 'D' = dark grey, 'L' = light grey, 'N' = brown
const SPRITES: Record<string, { idle: string[]; attack: string[] }> = {
  char_lumberjack: {
    idle: [
      "....KKKKK.......",
      "...KRRRRRK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "...KRRRRRRRK....",
      "..KRRRRRRRRRK...",
      "..KRRRRRRRRRK...",
      "..KBBBBBBBBBK...",
      "...KBB...BBK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KRRRRRK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "....KRRRRRRK....",
      ".....KRRRRRRK...",
      ".....KRRRRRRRK..",
      ".....KBBBBBBBK..",
      ".....KBB...BBK..",
      ".....KKK...KKK.."
    ]
  },
  char_viking: {
    idle: [
      "...WKKKKKW......",
      "..WKKLLLKkW.....",
      "..KLLLLLLLK.....",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSOOOOOOOK....",
      "..KOOOOOOOOOK...",
      "..KDDDDDDDDDK...",
      "..KDDDDDDDDDK...",
      "..KDDDDDDDDDK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "...WKKKKKW......",
      "..WKKLLLKkW.....",
      "..KLLLLLLLK.....",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSOOOOOOOK....",
      "..KOOOOOOOOOK...",
      "....KDDDDDDK....",
      ".....KDDDDDDK...",
      ".....KDDDDDDDK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  },
  char_knight: {
    idle: [
      "....KKKKK.......",
      "...KLLLLLK......",
      "...KLWLLWkK.....",
      "..KLLLLLLLLK....",
      "..KLLKKLLKkK....",
      "..KLKKMKKMKK....",
      "..KLLLLLLLLK....",
      "...KLLLLLKK.....",
      "...KLLLLLLLK....",
      "..KLLLLLLLLLK...",
      "..KLLLLLLLLLK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KLLLLLK......",
      "...KLWLLWkK.....",
      "..KLLLLLLLLK....",
      "..KLLKKLLKkK....",
      "..KLKKMKKMKK....",
      "..KLLLLLLLLK....",
      "...KLLLLLKK.....",
      "....KLLLLLLK....",
      ".....KLLLLLLK...",
      ".....KLLLLLLLK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  },
  char_samurai: {
    idle: [
      "....KKKKK.......",
      "...KKKKKKK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSSSSSK.....",
      "...KRRRRRRRK....",
      "..KRRRWRRRRRK...",
      "..KRRRWRRRRRK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KKKKKKK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSSSSSK.....",
      "....KRRRRRRK....",
      ".....KRRRWRRK...",
      ".....KRRRWRRRK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  },
  char_wizard: {
    idle: [
      "....KKKKK.......",
      "...KPPPPPPC.....",
      "...KPPPPPCC.....",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KWWWWWWWWK....",
      "..KWWWWWWWWK....",
      "..KPPPPPPPPC....",
      "..KPPPPPPPPCK...",
      "..KPPPPPPPPCK...",
      "..KPPPPPPPPCK...",
      "...KPP...PPK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KPPPPPPC.....",
      "...KPPPPPCC.....",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KWWWWWWWWK....",
      "..KWWWWWWWWK....",
      "....KPPPPPPC....",
      ".....KPPPPPPK...",
      ".....KPPPPPPPK..",
      ".....KPPPPPPPK..",
      ".....KPP...PPK..",
      ".....KKK...KKK.."
    ]
  },
  char_ninja: {
    idle: [
      "....KKKKK.......",
      "...KKKKKKK......",
      "...KDDDDDCK.....",
      "..KDDCDDCDDK....",
      "..KDDCDDCDDK....",
      "..KDDDDDDCDK....",
      "..KDDDDDDCDK....",
      "...KDDDDDCK.....",
      "...KDDDDDDDK....",
      "..KDDCDDDCDDK...",
      "..KDDCDDDCDDK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KKKKKKK......",
      "...KDDDDDCK.....",
      "..KDDCDDCDDK....",
      "..KDDCDDCDDK....",
      "..KDDDDDDCDK....",
      "..KDDDDDDCDK....",
      "...KDDDDDCK.....",
      "....KDDDDDDK....",
      ".....KDDCDDCK...",
      ".....KDDCDDCDK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  },
  char_alien: {
    idle: [
      "....GGGGG.......",
      "...GGGGGGGG.....",
      "...GKKGGKKG.....",
      "..GGKKGGKKGG....",
      "..GGGGGGGGGG....",
      "..GGGGGGGGGG....",
      "..GGGGGGGGGG....",
      "...GGGGGGGG.....",
      "...KPPPPPPPK....",
      "..KPPPPPPPPPK...",
      "..KPPPPPPPPPK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....GGGGG.......",
      "...GGGGGGGG.....",
      "...GKKGGKKG.....",
      "..GGKKGGKKGG....",
      "..GGGGGGGGGG....",
      "..GGGGGGGGGG....",
      "..GGGGGGGGGG....",
      "...GGGGGGGG.....",
      "....KPPPPPPK....",
      ".....KPPPPPPK...",
      ".....KPPPPPPPK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  },
  char_robot: {
    idle: [
      "....KKKKK.......",
      "...KDDDDDK......",
      "...KDDRDDKK.....",
      "..KDDDDDDDDK....",
      "..KDKKDKKDKK....",
      "..KDKKDKKDKK....",
      "..KDDDDDDDDK....",
      "...KDDDDDKK.....",
      "...KYYYYYYYK....",
      "..KYYYYYYYYYK...",
      "..KYYYYYYYYYK...",
      "..KDDDDDDDDDK...",
      "...KDD...DDK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KDDDDDK......",
      "...KDDRDDKK.....",
      "..KDDDDDDDDK....",
      "..KDKKDKKDKK....",
      "..KDKKDKKDKK....",
      "..KDDDDDDDDK....",
      "...KDDDDDKK.....",
      "....KYYYYYYK....",
      ".....KYYYYYYK...",
      ".....KYYYYYYYK..",
      ".....KDDDDDDDK..",
      ".....KDD...DDK..",
      ".....KKK...KKK.."
    ]
  }
};

const WEAPONS: Record<string, { color: string; width: number; height: number; shape: 'axe' | 'hammer' | 'chainsaw' | 'laser' }> = {
  weap_axe_wood: { color: '#8B5A2B', width: 6, height: 35, shape: 'axe' },
  weap_axe_golden: { color: '#FFD700', width: 6, height: 35, shape: 'axe' },
  weap_hammer: { color: '#808080', width: 8, height: 32, shape: 'hammer' },
  weap_axe_fire: { color: '#FF4500', width: 6, height: 35, shape: 'axe' },
  weap_chainsaw: { color: '#FF8C00', width: 10, height: 42, shape: 'chainsaw' },
  weap_laser: { color: '#00FFFF', width: 4, height: 45, shape: 'laser' },
  weap_blade: { color: '#FF00FF', width: 4, height: 48, shape: 'laser' },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRotation?: number;
}

interface FlyingSegment {
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  side: 'left' | 'right';
  type: string;
}

interface ScoreText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

interface GameBlock {
  obstacle: 'none' | 'left' | 'right';
  coin: 'none' | 'left' | 'right';
  chest: 'none' | 'left' | 'right';
  diamond: 'none' | 'left' | 'right';
}

export const CanvasGame: React.FC<CanvasGameProps> = ({
  worldId,
  characterId,
  weaponId,
  trailId,
  onGameOver,
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDead, setIsDead] = useState(false);
  
  // Game Variables Ref (to avoid closures in animation frame)
  const stateRef = useRef({
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeRemaining: 30.0, // seconds
    maxTime: 30.0,
    playerSide: 'left' as 'left' | 'right',
    isChopping: false,
    chopAnimTime: 0,
    deathTimer: 0,
    blocks: [] as GameBlock[],
    flyingSegments: [] as FlyingSegment[],
    particles: [] as Particle[],
    scoreTexts: [] as ScoreText[],
    coinsCollected: 0,
    diamondsCollected: 0,
    treeOffset: 0, // for sliding animation
    targetTreeOffset: 0,
    screenShake: 0,
    comboLevel: 0, // 0=none, 1=fire, 2=lightning
    weatherParticles: [] as Particle[],
    bgScroll: 0,
    lastTime: 0,
    keys: {} as Record<string, boolean>,
  });

  // World configs
  const getWorldConfig = () => {
    switch (worldId) {
      case 'world_city':
        return {
          bgColor: '#1a1a2e',
          gridColor: '#16213e',
          treeColor: '#4f5d75',
          branchColor: '#2d3748',
          accentColor: '#e94560',
          textColor: '#e94560',
          blockType: 'city',
          weather: 'rain'
        };
      case 'world_ice':
        return {
          bgColor: '#e3fafc',
          gridColor: '#c5f6fa',
          treeColor: '#99e9f2',
          branchColor: '#66d9e8',
          accentColor: '#15aabf',
          textColor: '#0b7285',
          blockType: 'ice',
          weather: 'snow'
        };
      case 'world_cyber':
        return {
          bgColor: '#08020f',
          gridColor: '#1a052e',
          treeColor: '#00f0ff',
          branchColor: '#ff00ff',
          accentColor: '#39ff14',
          textColor: '#39ff14',
          blockType: 'cyber',
          weather: 'matrix'
        };
      case 'world_volcano':
        return {
          bgColor: '#1a0d00',
          gridColor: '#331a00',
          treeColor: '#3a2b2b',
          branchColor: '#e65c00',
          accentColor: '#ffcc00',
          textColor: '#ff3300',
          blockType: 'volcano',
          weather: 'lava'
        };
      default: // Forest
        return {
          bgColor: '#2b3e2b',
          gridColor: '#3d523d',
          treeColor: '#5c4033',
          branchColor: '#7a5a40',
          accentColor: '#80c080',
          textColor: '#a3e2a3',
          blockType: 'forest',
          weather: 'leaves'
        };
    }
  };

  const config = getWorldConfig();

  // Initialize blocks procedurally
  const generateInitialTree = () => {
    const list: GameBlock[] = [];
    // Start with 4 clean segments at bottom
    for (let i = 0; i < 5; i++) {
      list.push({ obstacle: 'none', coin: 'none', chest: 'none', diamond: 'none' });
    }
    // Add procedural segments
    for (let i = 0; i < 15; i++) {
      list.push(generateNewSegment(list[list.length - 1]));
    }
    stateRef.current.blocks = list;
  };

  const generateNewSegment = (prev: GameBlock): GameBlock => {
    const r = Math.random();
    let obstacle: 'none' | 'left' | 'right' = 'none';
    let coin: 'none' | 'left' | 'right' = 'none';
    let chest: 'none' | 'left' | 'right' = 'none';
    let diamond: 'none' | 'left' | 'right' = 'none';

    // Rules:
    // 1. If previous had an obstacle, force at least 1 or 2 empty buffers to make it fair
    const hadObstacle = prev.obstacle !== 'none';

    if (!hadObstacle && r < 0.45) {
      obstacle = Math.random() < 0.5 ? 'left' : 'right';
    }

    // Spawn coins/diamonds on opposite side of obstacles, or randomly
    if (obstacle === 'none') {
      const itemRoll = Math.random();
      if (itemRoll < 0.15) {
        coin = Math.random() < 0.5 ? 'left' : 'right';
      } else if (itemRoll < 0.18) {
        diamond = Math.random() < 0.5 ? 'left' : 'right';
      } else if (itemRoll < 0.20) {
        chest = Math.random() < 0.5 ? 'left' : 'right';
      }
    } else {
      // Coin opposite side of obstacle
      if (Math.random() < 0.20) {
        coin = obstacle === 'left' ? 'right' : 'left';
      }
    }

    return { obstacle, coin, chest, diamond };
  };

  // Triggered when user chops
  const handleChop = (side: 'left' | 'right') => {
    if (isDead) return;
    
    // Start music loop if it's the first swing of the game
    if (!isPlaying) {
      setIsPlaying(true);
      sound.startMusic(worldId.replace('world_', ''));
    }

    const state = stateRef.current;
    state.playerSide = side;
    state.isChopping = true;
    state.chopAnimTime = 0.08; // 80ms animation frame

    // Get lowest block
    const lowestBlock = state.blocks[0];

    // Collision check: Did we hit a branch before chopping?
    // In woodchopping, the branch on the segment IMMEDIATELY above us can squash us if we walk under it.
    // So we must check collision before removing the segment.
    if (lowestBlock.obstacle === side) {
      triggerDeath('squashed');
      return;
    }

    // Chop successful!
    const weapon = WEAPONS[weaponId] || WEAPONS.weap_axe_wood;
    sound.playChop(weapon.shape);

    // Score and time updates
    state.score += 1;
    state.combo += 1;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;

    // Time increment (Timerman formula: more combo = more bonus)
    const timeBonus = Math.max(0.12, 0.25 - Math.min(0.12, state.score * 0.0002));
    state.timeRemaining = Math.min(state.maxTime, state.timeRemaining + timeBonus);

    // Dynamic combo effects
    let currentComboLevel = 0;
    if (state.combo >= 50) currentComboLevel = 2; // Lightning / Electrified
    else if (state.combo >= 20) currentComboLevel = 1; // Fire / Heat

    if (currentComboLevel > state.comboLevel) {
      sound.playComboUp(currentComboLevel);
      createFloatingText(canvasRef.current!.width / 2, 180, 'SUPER COMBO!', config.accentColor);
    }
    state.comboLevel = currentComboLevel;

    // Item Collection check on the lowest block
    if (lowestBlock.coin === side) {
      state.coinsCollected += 1;
      sound.playCoin();
      createFlyingParticle(canvasRef.current!.width / 2 + (side === 'left' ? -70 : 70), canvasRef.current!.height - 180, '#FFD700', 'coin');
      createFloatingText(canvasRef.current!.width / 2 + (side === 'left' ? -60 : 60), canvasRef.current!.height - 200, '+1 Coin', '#FFD700');
    } else if (lowestBlock.diamond === side) {
      state.diamondsCollected += 1;
      sound.playCoin();
      createFlyingParticle(canvasRef.current!.width / 2 + (side === 'left' ? -70 : 70), canvasRef.current!.height - 180, '#00FFFF', 'diamond');
      createFloatingText(canvasRef.current!.width / 2 + (side === 'left' ? -60 : 60), canvasRef.current!.height - 200, '+1 Gem', '#00FFFF');
    } else if (lowestBlock.chest === side) {
      const coinGift = Math.floor(10 + Math.random() * 40);
      state.coinsCollected += coinGift;
      sound.playChest();
      createFloatingText(canvasRef.current!.width / 2 + (side === 'left' ? -60 : 60), canvasRef.current!.height - 200, `Chest! +${coinGift} Coins`, '#FFA500');
      // spawn massive sparks
      for (let i = 0; i < 20; i++) {
        createSpark(canvasRef.current!.width / 2 + (side === 'left' ? -80 : 80), canvasRef.current!.height - 180, '#FFA500');
      }
    }

    // Spawn fly-off segment
    state.flyingSegments.push({
      y: canvasRef.current!.height - 180,
      vx: side === 'left' ? 12 : -12,
      vy: -8 - Math.random() * 4,
      rotation: 0,
      vRotation: side === 'left' ? 0.2 : -0.2,
      side: side,
      type: config.blockType
    });

    // Spawn wood chips particles
    const chipColor = config.treeColor;
    const particleX = canvasRef.current!.width / 2 + (side === 'left' ? -30 : 30);
    const particleY = canvasRef.current!.height - 180;
    
    // Weapon specific particles
    const trailColor = trailId === 'trail_fire' ? '#FF4500' : (trailId === 'trail_spark' ? '#00FFFF' : (trailId === 'trail_rainbow' ? 'hsl(' + (Date.now() % 360) + ', 100%, 50%)' : '#ffffff'));

    for (let i = 0; i < 8; i++) {
      state.particles.push({
        x: particleX,
        y: particleY,
        vx: (side === 'left' ? 3 : -3) + (Math.random() * 8 - 4),
        vy: -3 - Math.random() * 6,
        color: chipColor,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 20
      });
      
      if (trailId !== 'trail_none') {
        state.particles.push({
          x: particleX + (Math.random() * 20 - 10),
          y: particleY + (Math.random() * 20 - 10),
          vx: (Math.random() * 4 - 2),
          vy: (Math.random() * 4 - 2),
          color: trailColor,
          size: 2 + Math.random() * 3,
          alpha: 1,
          life: 0,
          maxLife: 15 + Math.random() * 10
        });
      }
    }

    // Add extra effects based on combo levels
    if (state.comboLevel >= 1) {
      state.screenShake = 5;
      // Fire sparks
      for (let i = 0; i < 3; i++) {
        createSpark(particleX, particleY, '#FF4500');
      }
    }
    if (state.comboLevel >= 2) {
      state.screenShake = 10;
      // Cyan lightning sparks
      for (let i = 0; i < 5; i++) {
        createSpark(particleX, particleY, '#00FFFF');
      }
    }

    // Remove bottom block, generate next block at top
    state.blocks.shift();
    state.blocks.push(generateNewSegment(state.blocks[state.blocks.length - 1]));

    // Animate tree drop
    state.treeOffset = 80; // height of block
    state.targetTreeOffset = 0;

    // React State callback
    onScoreUpdate(state.score, state.combo);

    // Collision check post-chop: Did the new segment that slid down crush the player?
    const nextLowestBlock = state.blocks[0];
    if (nextLowestBlock.obstacle === side) {
      triggerDeath('crushed');
    }
  };

  const createSpark = (x: number, y: number, color: string) => {
    stateRef.current.particles.push({
      x,
      y,
      vx: Math.random() * 12 - 6,
      vy: Math.random() * -8 - 2,
      color,
      size: 2 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 20 + Math.random() * 15
    });
  };

  const createFloatingText = (x: number, y: number, text: string, color: string) => {
    stateRef.current.scoreTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life: 40
    });
  };

  const createFlyingParticle = (x: number, y: number, color: string, type: 'coin' | 'diamond') => {
    // A particle that flies to the UI header counter
    stateRef.current.particles.push({
      x,
      y,
      vx: (Math.random() * 4 - 2),
      vy: -15, // fly straight up then ease to target
      color,
      size: type === 'coin' ? 8 : 6,
      alpha: 1,
      life: 0,
      maxLife: 45
    });
  };

  const triggerDeath = (reason: string) => {
    if (isDead) return;
    setIsDead(true);
    sound.playHit();
    sound.playGameOver();
    sound.stopMusic();
    
    const state = stateRef.current;
    state.deathTimer = 2.0; // 2 seconds delay
    state.combo = 0;
    state.comboLevel = 0;

    // Explode player particles
    const playerX = canvasRef.current!.width / 2 + (state.playerSide === 'left' ? -100 : 100);
    const playerY = canvasRef.current!.height - 180;
    for (let i = 0; i < 30; i++) {
      state.particles.push({
        x: playerX + Math.random() * 30 - 15,
        y: playerY + Math.random() * 50 - 25,
        vx: Math.random() * 16 - 8,
        vy: Math.random() * -12 - 4,
        color: i % 2 === 0 ? '#ff3300' : '#ffa500',
        size: 3 + Math.random() * 5,
        alpha: 1,
        life: 0,
        maxLife: 60 + Math.random() * 30
      });
    }

    stateRef.current.keys = {}; // reset keys
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDead) return;
      const key = e.key.toLowerCase();
      
      // Prevent scrolling
      if (['arrowleft', 'arrowright', 'a', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || key === 'a') {
        if (!stateRef.current.keys[e.key]) {
          stateRef.current.keys[e.key] = true;
          handleChop('left');
        }
      } else if (e.key === 'ArrowRight' || key === 'd') {
        if (!stateRef.current.keys[e.key]) {
          stateRef.current.keys[e.key] = true;
          handleChop('right');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDead, isPlaying, worldId]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial Tree
    generateInitialTree();

    let animationId: number;
    let lastTimestamp = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      update(deltaTime);
      draw(ctx, canvas);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [worldId]);

  // Game Logic Tick
  const update = (dt: number) => {
    const state = stateRef.current;

    // Timer tick down
    if (isPlaying && !isDead) {
      // Speed up decay rate as score increases to make it harder
      const decayMultiplier = 1.0 + (state.score * 0.003);
      state.timeRemaining -= dt * decayMultiplier;

      if (state.timeRemaining <= 0) {
        state.timeRemaining = 0;
        triggerDeath('time_out');
      }
    }

    // Lerp tree drop offset
    if (state.treeOffset > state.targetTreeOffset) {
      state.treeOffset -= dt * 500; // slide speed
      if (state.treeOffset < state.targetTreeOffset) {
        state.treeOffset = state.targetTreeOffset;
      }
    }

    // Chop animation timer
    if (state.isChopping) {
      state.chopAnimTime -= dt;
      if (state.chopAnimTime <= 0) {
        state.isChopping = false;
      }
    }

    // Screen shake decay
    if (state.screenShake > 0) {
      state.screenShake -= dt * 30;
    }

    // Update floating score/combo texts
    for (let i = state.scoreTexts.length - 1; i >= 0; i--) {
      const txt = state.scoreTexts[i];
      txt.y -= dt * 40;
      txt.life -= 1;
      txt.alpha = txt.life / 40;
      if (txt.life <= 0) {
        state.scoreTexts.splice(i, 1);
      }
    }

    // Update flying tree segments
    for (let i = state.flyingSegments.length - 1; i >= 0; i--) {
      const fs = state.flyingSegments[i];
      fs.y += fs.vy;
      fs.vy += 0.8; // gravity
      fs.vx += fs.vx > 0 ? -0.1 : 0.1; // drag
      fs.rotation += fs.vRotation;

      // boundaries check
      if (fs.y > canvasRef.current!.height + 100) {
        state.flyingSegments.splice(i, 1);
      }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // minor gravity
      p.life += 1;
      p.alpha = 1.0 - (p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        state.particles.splice(i, 1);
      }
    }

    // Update Weather
    updateWeather(dt);

    // Death transition logic
    if (isDead) {
      state.deathTimer -= dt;
      if (state.deathTimer <= 0) {
        // Stop and call React Game Over callback
        onGameOver(state.score, state.maxCombo, state.coinsCollected, state.diamondsCollected);
      }
    }

    state.bgScroll += dt * 5; // parallax slow background drift
  };

  const updateWeather = (dt: number) => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Spawn weather
    const maxWeather = config.weather === 'snow' ? 120 : (config.weather === 'rain' ? 150 : (config.weather === 'matrix' ? 80 : 60));
    
    if (state.weatherParticles.length < maxWeather) {
      if (config.weather === 'snow') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: Math.random() * 2 - 1,
          vy: 1 + Math.random() * 2,
          color: '#ffffff',
          size: 1 + Math.random() * 3,
          alpha: 0.5 + Math.random() * 0.5,
          life: 0,
          maxLife: 300
        });
      } else if (config.weather === 'rain') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -2,
          vy: 8 + Math.random() * 5,
          color: 'rgba(174,194,224,0.4)',
          size: 1,
          alpha: 0.4,
          life: 0,
          maxLife: 100
        });
      } else if (config.weather === 'matrix') {
        // Neon grid rain
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: 0,
          vy: 3 + Math.random() * 4,
          color: Math.random() < 0.2 ? '#00FFFF' : '#39ff14',
          size: 2,
          alpha: 0.3 + Math.random() * 0.7,
          life: 0,
          maxLife: 150
        });
      } else if (config.weather === 'lava') {
        // Lava ash embers
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: Math.random() * 2 - 1,
          vy: -(1 + Math.random() * 2),
          color: Math.random() < 0.3 ? '#ff3300' : '#ffa500',
          size: 1 + Math.random() * 3,
          alpha: 0.6,
          life: 0,
          maxLife: 200
        });
      } else {
        // forest floating leaves
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -1 + Math.random() * 2,
          vy: 1 + Math.random() * 1.5,
          color: Math.random() < 0.7 ? '#5c8a6f' : '#b28d46',
          size: 3 + Math.random() * 4,
          alpha: 0.7,
          life: 0,
          maxLife: 250,
          rotation: Math.random() * Math.PI,
          vRotation: 0.02 - Math.random() * 0.04
        });
      }
    }

    // Tick Weather
    for (let i = state.weatherParticles.length - 1; i >= 0; i--) {
      const p = state.weatherParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.rotation !== undefined && p.vRotation !== undefined) {
        p.rotation += p.vRotation;
      }

      if (config.weather === 'lava') {
        // Embers float up, reset if out
        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          state.weatherParticles.splice(i, 1);
        }
      } else {
        // Reset if goes off-screen
        if (p.y > canvas.height + 10 || p.x < -10 || p.x > canvas.width + 10) {
          state.weatherParticles.splice(i, 1);
        }
      }
    }
  };

  // --- DRAWING FUNCTIONS ---

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Screen Shake apply
    if (state.screenShake > 0) {
      const dx = (Math.random() * 2 - 1) * state.screenShake;
      const dy = (Math.random() * 2 - 1) * state.screenShake;
      ctx.translate(dx, dy);
    }

    // 1. Draw Background
    drawBackground(ctx, canvas);

    // 2. Draw Parallax Hills / Cyber buildings
    drawParallaxLayers(ctx, canvas);

    // 3. Draw Weather Backdrop
    drawWeather(ctx, canvas);

    // 4. Draw Tree Column
    drawTree(ctx, canvas);

    // 5. Draw Flying chopped blocks
    drawFlyingSegments(ctx);

    // 6. Draw Player
    if (!isDead) {
      drawPlayer(ctx, canvas);
    }

    // 7. Draw Particles
    drawParticles(ctx);

    // 8. Draw Score Floating Texts
    drawScoreTexts(ctx);

    ctx.restore();

    // 9. Draw HUD Overlay (Score, Combo, Timer Bar)
    drawHud(ctx, canvas);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, config.bgColor);
    grd.addColorStop(1, config.gridColor);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for Cyber
    if (config.blockType === 'cyber') {
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
      ctx.lineWidth = 2;
      const gridSpacing = 40;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      const scrollOffset = Math.floor(stateRef.current.bgScroll) % gridSpacing;
      for (let y = scrollOffset; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  };

  const drawParallaxLayers = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    
    if (config.blockType === 'forest') {
      // Draw distant mountains
      ctx.fillStyle = '#223322';
      ctx.beginPath();
      ctx.moveTo(-100, canvas.height);
      ctx.lineTo(canvas.width * 0.3, canvas.height - 200);
      ctx.lineTo(canvas.width * 0.7, canvas.height);
      ctx.fill();

      ctx.fillStyle = '#1e2e1e';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, canvas.height);
      ctx.lineTo(canvas.width * 0.8, canvas.height - 250);
      ctx.lineTo(canvas.width + 100, canvas.height);
      ctx.fill();
    } else if (config.blockType === 'city') {
      // Draw dark skyline
      ctx.fillStyle = '#111625';
      const buildingWidth = 80;
      const spacing = 120;
      for (let x = -50; x < canvas.width + 100; x += spacing) {
        const h = 200 + Math.sin(x) * 80;
        ctx.fillRect(x, canvas.height - h, buildingWidth, h);
        
        // draw tiny yellow windows
        ctx.fillStyle = 'rgba(255,235,100,0.1)';
        for (let wy = canvas.height - h + 20; wy < canvas.height - 20; wy += 30) {
          ctx.fillRect(x + 15, wy, 10, 15);
          ctx.fillRect(x + buildingWidth - 25, wy, 10, 15);
        }
        ctx.fillStyle = '#111625';
      }
    } else if (config.blockType === 'volcano') {
      // Volcano mountains with lava glows
      ctx.fillStyle = '#140800';
      ctx.beginPath();
      ctx.moveTo(-50, canvas.height);
      ctx.lineTo(canvas.width * 0.4, canvas.height - 180);
      ctx.lineTo(canvas.width * 0.9, canvas.height);
      ctx.fill();

      // glowing magma rivers in background
      ctx.fillStyle = '#e64000';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.35, canvas.height - 180);
      ctx.lineTo(canvas.width * 0.38, canvas.height - 180);
      ctx.lineTo(canvas.width * 0.5, canvas.height);
      ctx.lineTo(canvas.width * 0.45, canvas.height);
      ctx.fill();
    }
  };

  const drawWeather = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    
    state.weatherParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (config.weather === 'leaves' && p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw leaf diamond
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.fill();
      } else if (config.weather === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 4, p.y + 15);
        ctx.stroke();
      } else {
        // snow / matrix code / embers
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Matrix text drop glow
        if (config.weather === 'matrix' && Math.random() < 0.1) {
          ctx.font = '8px monospace';
          ctx.fillStyle = p.color;
          ctx.fillText(Math.floor(Math.random() * 9).toString(), p.x - 3, p.y + 10);
        }
      }
      ctx.restore();
    });
  };

  const drawTree = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    const treeWidth = 80;
    const blockHeight = 80;
    const startY = canvas.height - 180;
    const centerX = canvas.width / 2;

    ctx.save();
    
    // Draw the infinite blocks climbing upwards
    // Limit drawing to on-screen blocks (approx 12 segments)
    const blocksCount = Math.min(state.blocks.length, Math.ceil(canvas.height / blockHeight) + 2);
    
    for (let i = 0; i < blocksCount; i++) {
      const block = state.blocks[i];
      // Apply sliding offset on lowest block only to create drop effect
      const currentY = startY - i * blockHeight + (i === 0 ? 0 : state.treeOffset);

      // Draw Main trunk segment
      drawBlockSegment(ctx, centerX - treeWidth / 2, currentY, treeWidth, blockHeight);

      // Draw Obstacle/Branches
      if (block.obstacle === 'left') {
        drawObstacle(ctx, centerX - treeWidth / 2 - 80, currentY + 15, 80, 20, 'left');
      } else if (block.obstacle === 'right') {
        drawObstacle(ctx, centerX + treeWidth / 2, currentY + 15, 80, 20, 'right');
      }

      // Draw collectibles (Coins/Diamonds/Chests)
      if (block.coin === 'left') {
        drawCoinCollected(ctx, centerX - treeWidth / 2 - 40, currentY + blockHeight / 2);
      } else if (block.coin === 'right') {
        drawCoinCollected(ctx, centerX + treeWidth / 2 + 40, currentY + blockHeight / 2);
      }

      if (block.diamond === 'left') {
        drawDiamond(ctx, centerX - treeWidth / 2 - 40, currentY + blockHeight / 2);
      } else if (block.diamond === 'right') {
        drawDiamond(ctx, centerX + treeWidth / 2 + 40, currentY + blockHeight / 2);
      }

      if (block.chest === 'left') {
        drawChest(ctx, centerX - treeWidth / 2 - 45, currentY + blockHeight / 2 - 10);
      } else if (block.chest === 'right') {
        drawChest(ctx, centerX + treeWidth / 2 + 45, currentY + blockHeight / 2 - 10);
      }
    }

    ctx.restore();
  };

  const drawBlockSegment = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = config.treeColor;
    ctx.fillRect(x, y, w, h);

    // Draw borders/details per block
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    if (config.blockType === 'forest') {
      // Wood grains
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + 10, y, 6, h);
      ctx.fillRect(x + w - 16, y, 6, h);
      ctx.fillRect(x + w / 2 - 3, y, 6, h);
    } else if (config.blockType === 'city') {
      // Skyscraper grids
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 15, y + 15, 20, 20);
      ctx.fillRect(x + w - 35, y + 15, 20, 20);
      ctx.fillRect(x + 15, y + h - 35, 20, 20);
      ctx.fillRect(x + w - 35, y + h - 35, 20, 20);
    } else if (config.blockType === 'ice') {
      // Frost sparkles
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 10);
      ctx.lineTo(x + w - 10, y + 10);
      ctx.lineTo(x + 10, y + h - 10);
      ctx.fill();
    } else if (config.blockType === 'cyber') {
      // Cyber neon stripe
      ctx.fillStyle = 'rgba(255,0,255,0.4)';
      ctx.fillRect(x + w / 2 - 5, y, 10, h);
      // horizontal wire indicators
      ctx.fillStyle = config.accentColor;
      ctx.fillRect(x + 10, y + 20, w - 20, 3);
      ctx.fillRect(x + 10, y + h - 20, w - 20, 3);
    } else if (config.blockType === 'volcano') {
      // Volcanic magma veins
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(x + 20, y + 10, 8, h - 20);
      ctx.fillRect(x + w - 28, y + 15, 8, h - 30);
    }
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, side: 'left' | 'right') => {
    ctx.save();
    ctx.fillStyle = config.branchColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    if (config.blockType === 'forest') {
      // Branch leaves
      ctx.fillStyle = '#3a5f3d';
      if (side === 'left') {
        ctx.beginPath();
        ctx.arc(x, y + h / 2, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x + w, y + h / 2, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (config.blockType === 'city') {
      // Metal support beam truss
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    } else if (config.blockType === 'cyber') {
      // Glowing neon laser obstacle
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
      ctx.fillRect(x, y + 5, w, 10);
      // warning sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('⚡ DANGER', x + w / 2 - 25, y + 13);
    } else if (config.blockType === 'volcano') {
      // Molten crystal spikes
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x, y + h);
      }
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawCoinCollected = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner C letter
    ctx.fillStyle = '#D4AF37';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('c', x - 4, y + 4);
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#008080';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawChest = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 10x8 box
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 12, y - 8, 24, 16);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 12, y - 8, 24, 4); // lid top
    ctx.fillRect(x - 2, y, 4, 8); // golden lock
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 12, y - 8, 24, 16);
  };

  const drawFlyingSegments = (ctx: CanvasRenderingContext2D) => {
    const state = stateRef.current;
    
    state.flyingSegments.forEach(fs => {
      ctx.save();
      ctx.translate(canvasRef.current!.width / 2 + (fs.side === 'left' ? -40 : 40), fs.y);
      ctx.rotate(fs.rotation);
      drawBlockSegment(ctx, -40, -40, 80, 80);
      ctx.restore();
    });
  };

  // Render Pixel Matrix
  const drawPixelSprite = (ctx: CanvasRenderingContext2D, px: number, py: number, matrix: string[], pixelSize: number) => {
    matrix.forEach((row, rowIndex) => {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const char = row[colIndex];
        if (char === '.') continue; // transparent

        let fill = '#ffffff';
        switch (char) {
          case 'K': fill = '#000000'; break; // Black
          case 'S': fill = '#f5c697'; break; // Peach Skin
          case 's': fill = '#dfab7e'; break; // Darker skin
          case 'R': fill = '#cf2c2c'; break; // Red
          case 'r': fill = '#9e1b1b'; break; // Dark red
          case 'B': fill = '#2d5ea8'; break; // Blue
          case 'G': fill = '#4fa15c'; break; // Green
          case 'Y': fill = '#ebd534'; break; // Yellow
          case 'W': fill = '#ffffff'; break; // White
          case 'O': fill = '#f28e2b'; break; // Orange
          case 'P': fill = '#8e43e0'; break; // Purple
          case 'C': fill = '#2be0e0'; break; // Cyan
          case 'M': fill = '#e02bad'; break; // Magenta
          case 'D': fill = '#3a3d42'; break; // Dark Grey
          case 'L': fill = '#adb1b8'; break; // Light Grey
          case 'N': fill = '#664522'; break; // Brown
        }

        ctx.fillStyle = fill;
        ctx.fillRect(px + colIndex * pixelSize, py + rowIndex * pixelSize, pixelSize, pixelSize);
      }
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    const playerSide = state.playerSide;
    const isLeft = playerSide === 'left';
    
    // Position
    const pSize = 4; // Pixel size multiplier
    const px = canvas.width / 2 + (isLeft ? -130 : 90);
    const py = canvas.height - 180;

    ctx.save();
    
    // Mirror sprite if on right side
    if (!isLeft) {
      ctx.translate(px + 32, py);
      ctx.scale(-1, 1);
      ctx.translate(-(px + 32), -py);
    }

    // Load Character Matrix
    const animSet = SPRITES[characterId] || SPRITES.char_lumberjack;
    const frame = state.isChopping ? animSet.attack : animSet.idle;
    
    // Idle bounce
    let bounceY = 0;
    if (!state.isChopping) {
      bounceY = Math.sin(Date.now() / 150) * 2;
    }

    drawPixelSprite(ctx, px, py + bounceY, frame, pSize);

    // Draw Weapon
    const weapon = WEAPONS[weaponId] || WEAPONS.weap_axe_wood;
    
    ctx.save();
    ctx.translate(px + (state.isChopping ? 40 : 15), py + 25 + bounceY);
    
    // Weapon angle rotation based on swing state
    if (state.isChopping) {
      ctx.rotate(Math.PI / 3); // swung forward
    } else {
      ctx.rotate(-Math.PI / 6); // resting back
    }

    ctx.fillStyle = weapon.color;
    
    if (weapon.shape === 'axe') {
      // Shaft
      ctx.fillRect(-2, -weapon.height + 10, 4, weapon.height);
      // Axe Blade
      ctx.fillStyle = weapon.color === '#8B5A2B' ? '#a5adb8' : weapon.color;
      ctx.fillRect(-12, -weapon.height + 10, 10, 12);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -weapon.height + 10, 10, 12);
    } else if (weapon.shape === 'hammer') {
      // Handle
      ctx.fillRect(-2, -weapon.height + 10, 4, weapon.height);
      // Hammer Head
      ctx.fillStyle = '#b0b5be';
      ctx.fillRect(-15, -weapon.height + 10, 30, 15);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-15, -weapon.height + 10, 30, 15);
    } else if (weapon.shape === 'chainsaw') {
      // Chainsaw motor box
      ctx.fillRect(-8, -10, 16, 20);
      // Bar
      ctx.fillStyle = '#adb8c7';
      ctx.fillRect(-3, -weapon.height + 10, 6, weapon.height - 15);
      // Teeth details
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-5, -weapon.height + 12, 10, 4);
    } else {
      // Laser / saber blade
      // hilt
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-3, -8, 6, 12);
      // beam
      ctx.fillStyle = weapon.color;
      ctx.shadowColor = weapon.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-2, -weapon.height + 4, 4, weapon.height - 8);
    }

    ctx.restore();
    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    stateRef.current.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });
  };

  const drawScoreTexts = (ctx: CanvasRenderingContext2D) => {
    stateRef.current.scoreTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.font = '12px "Press Start 2P", monospace, sans-serif';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  };

  const drawHud = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;

    // 1. Timer Bar at top center
    const barW = Math.min(300, canvas.width * 0.7);
    const barH = 14;
    const barX = canvas.width / 2 - barW / 2;
    const barY = 60;

    // Base bar backing
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Timer fill
    const pct = state.timeRemaining / state.maxTime;
    let fill = config.accentColor;
    if (pct < 0.25) fill = '#ff3300'; // danger red
    ctx.fillStyle = fill;
    ctx.fillRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * pct), barH - 4);

    // 2. Score Center Display
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(state.score.toString(), canvas.width / 2, 120);

    // 3. Combo Display
    if (state.combo > 0) {
      let comboColor = '#ffffff';
      let animScale = 1.0;
      if (state.comboLevel === 1) {
        comboColor = '#ff8c00'; // Orange fire
        animScale = 1.1 + Math.sin(Date.now() / 100) * 0.05;
      } else if (state.comboLevel === 2) {
        comboColor = '#00ffff'; // Electric Neon Cyan
        animScale = 1.2 + Math.sin(Date.now() / 50) * 0.08;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, 150);
      ctx.scale(animScale, animScale);
      
      ctx.fillStyle = comboColor;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`${state.combo}x COMBO`, 0, 0);
      ctx.restore();
    }

    // 4. Instructions overlay if game has not started
    if (!isPlaying && !isDead) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('TAP LEFT / RIGHT', canvas.width / 2, canvas.height / 2 - 40);
      ctx.fillText('OR USE A/D / ARROWS TO START', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#80c080';
      ctx.fillText('[Avoid Branches & Balconies]', canvas.width / 2, canvas.height / 2 + 10);
    }
    
    ctx.textAlign = 'left'; // reset text align
  };

  // Manual Trigger handler for touch zones
  const handleTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isDead) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let clickX = 0;
    if ('touches' in e) {
      // touch event
      if (e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      clickX = e.touches[0].clientX - rect.left;
    } else {
      // mouse click
      const rect = canvas.getBoundingClientRect();
      clickX = e.clientX - rect.left;
    }

    if (clickX < canvas.width / 2) {
      handleChop('left');
    } else {
      handleChop('right');
    }
  };

  return (
    <div 
      className="game-container" 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'pointer', userSelect: 'none' }}
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
    >
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default CanvasGame;
