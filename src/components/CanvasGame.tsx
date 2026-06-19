import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../utils/AudioEngine';
import { db } from '../utils/LocalStorageDB';

interface CanvasGameProps {
  worldId: string;
  characterId: string;
  weaponId: string;
  trailId: string;
  difficulty: string;
  onGameOver: (score: number, maxCombo: number, coins: number, diamonds: number, tickets?: number) => void;
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
  },
  char_pyro: {
    idle: [
      "....KKKKK.......",
      "...KOOOOOK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "...KRRRRRRRK....",
      "..KRRRRRRRRRK...",
      "..KRRRRRRRRRK...",
      "..KOOOOOOOOOK...",
      "...KOO...OOK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KOOOOOK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "....KOOOOOOK....",
      ".....KOOOOOOK...",
      ".....KOOOOOOOK..",
      ".....KRRRRRRRK..",
      ".....KRR...RRK..",
      ".....KKK...KKK.."
    ]
  },
  char_druid: {
    idle: [
      "....KKKKK.......",
      "...KGGGGGK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "...KGGGGGGGK....",
      "..KGGGGGGGGGK...",
      "..KGGGGGGGGGK...",
      "..KNNNNNNNNNK...",
      "...KNN...NNK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KGGGGGK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSNNNSK.....",
      "....KGGGGGGK....",
      ".....KGGGGGGK...",
      ".....KGGGGGGGK..",
      ".....KNNNNNNNK..",
      ".....KNN...NNK..",
      ".....KKK...KKK.."
    ]
  },
  char_valkyrie: {
    idle: [
      "....KKKKK.......",
      "...KWWWWWK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSYYYSK.....",
      "...KWWWWWWWK....",
      "..KWWWWWWWWWK...",
      "..KWWWWWWWWWK...",
      "..KYYYYYYYYYK...",
      "...KYY...YYK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KWWWWWK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSYYYSK.....",
      "....KWWWWWWK....",
      ".....KWWWWWWK...",
      ".....KWWWWWWWK..",
      ".....KYYYYYYYK..",
      ".....KYY...YYK..",
      ".....KKK...KKK.."
    ]
  },
  char_pharaoh: {
    idle: [
      "....KKKKK.......",
      "...KYYYYYK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSBBBSK.....",
      "...KYYYYYYYK....",
      "..KYYBBYYBBYK...",
      "..KYYBBYYBBYK...",
      "..KBBBBBBBBBK...",
      "...KBB...BBK....",
      "...KKK...KKK...."
    ],
    attack: [
      "....KKKKK.......",
      "...KYYYYYK......",
      "...KSSSSSsK.....",
      "..KSSSSSSSSK....",
      "..KSKKSSKKsK....",
      "..KSSKKSSKKK....",
      "..KSSSSSSSSK....",
      "...KSSBBBSK.....",
      "....KYYYYYYK....",
      ".....KYYBBYYK...",
      ".....KYYBBYYYK..",
      ".....KBBBBBBBK..",
      ".....KBB...BBK..",
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
  weap_broadaxe: { color: '#334155', width: 9, height: 38, shape: 'axe' },
  weap_scythe: { color: '#475569', width: 7, height: 42, shape: 'chainsaw' },
  weap_candy_cane: { color: '#ef4444', width: 8, height: 34, shape: 'hammer' },
  weap_energy_halberd: { color: '#a855f7', width: 5, height: 46, shape: 'laser' },
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
  ticket?: 'none' | 'left' | 'right';
  isSourCandy?: boolean;
}

export const CanvasGame: React.FC<CanvasGameProps> = ({
  worldId,
  characterId,
  weaponId,
  trailId,
  difficulty,
  onGameOver,
  onScoreUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showReviveConfirm, setShowReviveConfirm] = useState(false);
  const [reviveCountdown, setReviveCountdown] = useState(5);

  const handleRevive = () => {
    const res = db.useReviveTicket();
    if (res.success) {
      sound.playChest();
      sound.startMusic(worldId.replace('world_', ''));
      
      const state = stateRef.current;
      state.isDead = false;
      state.isReviving = false;
      state.hasRevived = true;
      state.timeRemaining = state.maxTime; // refill time bar

      // Clear immediate obstacles so player is not instantly squashed
      for (let i = 0; i < Math.min(3, state.blocks.length); i++) {
        state.blocks[i].obstacle = 'none';
      }

      setShowReviveConfirm(false);
    } else {
      handleGiveUp();
    }
  };

  const handleGiveUp = () => {
    setShowReviveConfirm(false);
    const state = stateRef.current;
    state.isReviving = false;
    onGameOver(state.score, state.maxCombo, state.coinsCollected, state.diamondsCollected, state.ticketsCollected);
  };

  useEffect(() => {
    if (!showReviveConfirm) return;
    const interval = setInterval(() => {
      setReviveCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGiveUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showReviveConfirm]);

  // Determine starting time based on difficulty
  const startTimer = difficulty === 'easy' ? 45.0 :
                     difficulty === 'hard' ? 20.0 :
                     difficulty === 'extreme' ? 15.0 :
                     difficulty === 'nightmare' ? 10.0 :
                     difficulty === 'impossible' ? 8.0 : 30.0;

  // Game Variables Ref (to avoid closures in animation frame)
  const stateRef = useRef({
    isPlaying: false,
    isDead: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeRemaining: startTimer,
    maxTime: startTimer,
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
    ticketsCollected: 0,
    hasRevived: false,
    isReviving: false,
    treeOffset: 0, // for sliding animation
    targetTreeOffset: 0,
    screenShake: 0,
    comboLevel: 0, // 0=none, 1=fire, 2=lightning
    weatherParticles: [] as Particle[],
    bgScroll: 0,
    lastTime: 0,
    keys: {} as Record<string, boolean>,
    obstacleBuffer: 0, // spacing tracker for branches
    trailFade: 0,
    trailSide: 'left' as 'left' | 'right',
    bgSquirrelY: 350,
    bgSquirrelDir: 1,
    bgUfoX: -100,
    bgUfoY: 120,
    bgHeroX: -200,
    bgHeroY: 160,
    bgCatEyeOffset: 0,
    bgCatEyeTimer: 0,
    bgYetiFrame: 0,
    bgYetiTimer: 0,
    bgSnowballX: -150,
    bgPacmanX: -120,
    bgGhostX: -70,
    bgLavaMonsterY: 0,
    bgLavaMonsterTimer: 0,
    bgMarshmallowY: 0,
    // New level twists states
    hauntedVignetteAlpha: 0,
    hauntedTimer: 0,
    spaceAsteroidX: -200,
    spaceAsteroidY: 0,
    spaceAsteroidActive: false,
    spaceAsteroidWarningTimer: 0,
    spaceAsteroidSide: 'none' as 'left' | 'right' | 'none',
    spaceAsteroidSpeed: 0,
    spaceStunTimer: 0,
    toxicSludgeHeight: 0,
    steampunkWarningSide: 'none' as 'left' | 'right' | 'none',
    steampunkWarningTimer: 0,
    steampunkSteamActive: false,
    steampunkSteamTimer: 0,
    steamHitCounted: false,
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
          bgColor: '#111317',
          gridColor: '#181b22',
          treeColor: '#3e4654',
          branchColor: '#5c6475',
          accentColor: '#d28c38',
          textColor: '#d28c38',
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
      case 'world_autumn':
        return {
          bgColor: '#fdf6e2',
          gridColor: '#fae8ff',
          treeColor: '#854d0e',
          branchColor: '#b45309',
          accentColor: '#d97706',
          textColor: '#b45309',
          blockType: 'autumn',
          weather: 'autumn_leaves'
        };
      case 'world_desert':
        return {
          bgColor: '#fef08a',
          gridColor: '#fef9c3',
          treeColor: '#ca8a04',
          branchColor: '#854d0e',
          accentColor: '#eab308',
          textColor: '#a16207',
          blockType: 'desert',
          weather: 'sandstorm'
        };
      case 'world_haunted':
        return {
          bgColor: '#0c0714',
          gridColor: '#1a102b',
          treeColor: '#2b1b42',
          branchColor: '#4c3569',
          accentColor: '#4de680',
          textColor: '#4de680',
          blockType: 'haunted',
          weather: 'fog'
        };
      case 'world_space':
        return {
          bgColor: '#05050d',
          gridColor: '#0a0a1f',
          treeColor: '#1b1b42',
          branchColor: '#00ffff',
          accentColor: '#00ffff',
          textColor: '#00ffff',
          blockType: 'space',
          weather: 'stars'
        };
      case 'world_wasteland':
        return {
          bgColor: '#0e1710',
          gridColor: '#1b2e20',
          treeColor: '#3a2e1d',
          branchColor: '#7cb342',
          accentColor: '#aee50d',
          textColor: '#7cb342',
          blockType: 'wasteland',
          weather: 'acid_rain'
        };
      case 'world_steampunk':
        return {
          bgColor: '#1c120c',
          gridColor: '#2d1e16',
          treeColor: '#5c3e2e',
          branchColor: '#d87040',
          accentColor: '#ffaa66',
          textColor: '#d87040',
          blockType: 'steampunk',
          weather: 'steam_smoke'
        };
      case 'world_candy':
        return {
          bgColor: '#ffe4e6',
          gridColor: '#fecdd3',
          treeColor: '#fda4af',
          branchColor: '#fb7185',
          accentColor: '#f43f5e',
          textColor: '#e11d48',
          blockType: 'candy',
          weather: 'candy_confetti'
        };
      case 'world_zen':
        return {
          bgColor: '#2d1a22',
          gridColor: '#3e242f',
          treeColor: '#4a2c3a',
          branchColor: '#733e54',
          accentColor: '#ffb7c5',
          textColor: '#ffb7c5',
          blockType: 'zen',
          weather: 'zen_blossoms'
        };
      case 'world_coral':
        return {
          bgColor: '#001a33',
          gridColor: '#00264d',
          treeColor: '#003366',
          branchColor: '#004d99',
          accentColor: '#00ffff',
          textColor: '#00ffff',
          blockType: 'coral',
          weather: 'bubbles'
        };
      case 'world_cyberpunk':
        return {
          bgColor: '#120124',
          gridColor: '#20043c',
          treeColor: '#2b0b47',
          branchColor: '#450b73',
          accentColor: '#39ff14',
          textColor: '#39ff14',
          blockType: 'cyberpunk',
          weather: 'neon_rain'
        };
      case 'world_prehistoric':
        return {
          bgColor: '#2e1c0c',
          gridColor: '#3f2712',
          treeColor: '#472b15',
          branchColor: '#733d15',
          accentColor: '#ff4500',
          textColor: '#ff4500',
          blockType: 'prehistoric',
          weather: 'volcano_ash'
        };
      case 'world_sky':
        return {
          bgColor: '#e6f2ff',
          gridColor: '#cce6ff',
          treeColor: '#ffffff',
          branchColor: '#ffd700',
          accentColor: '#ffd700',
          textColor: '#ffd700',
          blockType: 'sky',
          weather: 'clouds'
        };
      case 'world_arcade':
        return {
          bgColor: '#000000',
          gridColor: '#111111',
          treeColor: '#1c1c1c',
          branchColor: '#ff007f',
          accentColor: '#ff007f',
          textColor: '#ff007f',
          blockType: 'arcade',
          weather: 'arcade_glitches'
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
      list.push({ obstacle: 'none', coin: 'none', chest: 'none', diamond: 'none', ticket: 'none' });
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
    let ticket: 'none' | 'left' | 'right' = 'none';

    // Difficulty parameters
    let minSpacing = 2;
    let obstacleProb = 0.45;
    if (difficulty === 'easy') { minSpacing = 3; obstacleProb = 0.3; }
    else if (difficulty === 'hard') { minSpacing = 1; obstacleProb = 0.55; }
    else if (difficulty === 'extreme') { minSpacing = 1; obstacleProb = 0.65; }
    else if (difficulty === 'nightmare') { minSpacing = 1; obstacleProb = 0.70; }
    else if (difficulty === 'impossible') { minSpacing = 1; obstacleProb = 0.75; }

    const state = stateRef.current;

    // Rules:
    if (state.obstacleBuffer < minSpacing) {
      state.obstacleBuffer++;
      obstacle = 'none';
    } else if (r < obstacleProb) {
      obstacle = Math.random() < 0.5 ? 'left' : 'right';
      state.obstacleBuffer = 0;
    } else {
      state.obstacleBuffer++;
      obstacle = 'none';
    }

    // Spawn coins/diamonds/chests/tickets on opposite side of obstacles, or randomly
    if (obstacle === 'none') {
      const itemRoll = Math.random();
      if (itemRoll < 0.15) {
        coin = Math.random() < 0.5 ? 'left' : 'right';
      } else if (itemRoll < 0.18) {
        diamond = Math.random() < 0.5 ? 'left' : 'right';
      } else if (itemRoll < 0.20) {
        chest = Math.random() < 0.5 ? 'left' : 'right';
      } else if (itemRoll < 0.21) {
        // 1% ticket drop chance
        ticket = Math.random() < 0.5 ? 'left' : 'right';
      }
    } else {
      // Coin or ticket opposite side of obstacle
      const roll = Math.random();
      if (roll < 0.20) {
        coin = obstacle === 'left' ? 'right' : 'left';
      } else if (roll < 0.21) {
        ticket = obstacle === 'left' ? 'right' : 'left';
      }
    }

    const isSourCandy = worldId === 'world_candy' ? Math.random() < 0.35 : undefined;

    return { obstacle, coin, chest, diamond, ticket, isSourCandy };
  };

  // Triggered when user chops
  const handleChop = (side: 'left' | 'right') => {
    const state = stateRef.current;
    if (state.isDead) return;
    if (state.spaceStunTimer > 0) return; // Block input if stunned in space station
    
    // Start music loop if it's the first swing of the game
    if (!state.isPlaying) {
      state.isPlaying = true;
      sound.startMusic(worldId.replace('world_', ''));
    }
    state.playerSide = side;
    state.isChopping = true;
    state.chopAnimTime = 0.08; // 80ms animation frame
    state.trailFade = 1.0;
    state.trailSide = side;

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

    // Candy Land sweet/sour block logic
    if (worldId === 'world_candy') {
      if (lowestBlock.isSourCandy) {
        state.timeRemaining = Math.max(0, state.timeRemaining * 0.85); // cut remaining time by 15%
        state.combo = 0; // break combo
        sound.playHit();
        state.scoreTexts.push({
          x: canvasRef.current!.width / 2 + (side === 'left' ? -100 : 100),
          y: canvasRef.current!.height - 240,
          text: 'SOUR CRASH! -15%',
          color: '#4de680', // bright green sour
          life: 45,
          alpha: 1
        });
      } else {
        state.timeRemaining = Math.min(state.maxTime, state.timeRemaining + 1.5);
        state.combo += 1; // Add +1 more combo (+2 total combo!)
        state.score += 1; // Double score award
        state.scoreTexts.push({
          x: canvasRef.current!.width / 2 + (side === 'left' ? -100 : 100),
          y: canvasRef.current!.height - 240,
          text: 'SWEET DOUBLE! +1.5s',
          color: '#e11d48', // rose sweet pink
          life: 40,
          alpha: 1
        });
      }
    }

    // Toxic Wasteland sludge reduction
    if (worldId === 'world_wasteland') {
      state.toxicSludgeHeight = Math.max(0, state.toxicSludgeHeight - 12);
    }

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
    } else if (lowestBlock.ticket === side) {
      state.ticketsCollected += 1;
      sound.playChest();
      createFlyingParticle(canvasRef.current!.width / 2 + (side === 'left' ? -70 : 70), canvasRef.current!.height - 180, '#ff007f', 'coin');
      createFloatingText(canvasRef.current!.width / 2 + (side === 'left' ? -60 : 60), canvasRef.current!.height - 200, '+1 Ticket 🎫', '#ff007f');
      for (let i = 0; i < 15; i++) {
        createSpark(canvasRef.current!.width / 2 + (side === 'left' ? -80 : 80), canvasRef.current!.height - 180, '#ff007f');
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
    
    const trailColor = trailId === 'trail_fire' ? '#FF4500' :
                       trailId === 'trail_spark' ? '#00FFFF' :
                       trailId === 'trail_rainbow' ? 'hsl(' + (Date.now() % 360) + ', 100%, 50%)' :
                       trailId === 'trail_dust' ? '#8B5A2B' :
                       trailId === 'trail_leaves' ? '#10b981' :
                       trailId === 'trail_void' ? '#8b5cf6' :
                       trailId === 'trail_sakura' ? '#ec4899' :
                       trailId === 'trail_gold' ? '#f59e0b' : '#ffffff';

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
    if (stateRef.current.isDead) return;
    stateRef.current.isDead = true;
    sound.playHit();
    sound.playGameOver();
    sound.stopMusic();
    
    const state = stateRef.current;
    state.deathTimer = 1; // 1 seconds delay
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
      if (stateRef.current.isDead) return;
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
  }, [worldId]);

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

    if (state.isReviving) {
      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life += 1;
        p.alpha = 1.0 - (p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
        }
      }
      updateWeather(dt);
      return;
    }

    // Timer tick down
    if (state.isPlaying && !state.isDead) {
      // Speed up decay rate based on difficulty and score
      let decayMultiplier = 1.0;
      if (difficulty === 'easy') decayMultiplier = 0.6;
      else if (difficulty === 'hard') decayMultiplier = 1.4;
      else if (difficulty === 'extreme') decayMultiplier = 1.8;
      else if (difficulty === 'nightmare') decayMultiplier = 2.0;
      else if (difficulty === 'impossible') decayMultiplier = 2.4;

      decayMultiplier *= (1.0 + (state.score * 0.003));

      // Level specific updates & modifiers (twists)
      
      // 1. Haunted Graveyard Darkness oscillation
      if (worldId === 'world_haunted') {
        state.hauntedTimer += dt;
        state.hauntedVignetteAlpha = 0.35 + 0.45 * Math.sin(state.hauntedTimer * 1.2);
      }

      // 2. Space Station flying asteroids
      if (worldId === 'world_space') {
        if (state.spaceStunTimer > 0) {
          state.spaceStunTimer -= dt;
          if (state.spaceStunTimer < 0) state.spaceStunTimer = 0;
        }

        // Asteroid spawn cycle
        if (!state.spaceAsteroidActive) {
          if (Math.random() < dt * 0.16) { // ~16% chance per second
            state.spaceAsteroidActive = true;
            state.spaceAsteroidSide = Math.random() < 0.5 ? 'left' : 'right';
            state.spaceAsteroidWarningTimer = 1.3; // 1.3 seconds warning
            state.spaceAsteroidY = canvasRef.current!.height - 180 + (Math.random() * 40 - 20); // Y of player
            state.spaceAsteroidSpeed = 380 + Math.random() * 280;
            state.spaceAsteroidX = state.spaceAsteroidSide === 'left' ? canvasRef.current!.width + 80 : -80;
          }
        } else {
          if (state.spaceAsteroidWarningTimer > 0) {
            state.spaceAsteroidWarningTimer -= dt;
          } else {
            // Fly asteroid
            if (state.spaceAsteroidSide === 'left') {
              state.spaceAsteroidX -= state.spaceAsteroidSpeed * dt;
              const playerX = canvasRef.current!.width / 2 - 100;
              if (state.spaceAsteroidX < playerX + 35 && state.spaceAsteroidX > playerX - 35) {
                if (state.playerSide === 'left') {
                  state.spaceStunTimer = 0.7; // stun
                  state.timeRemaining = Math.max(0, state.timeRemaining - 2.5); // penalty
                  sound.playHit();
                  state.screenShake = 12;
                  state.spaceAsteroidActive = false;
                }
              }
              if (state.spaceAsteroidX < -100) state.spaceAsteroidActive = false;
            } else {
              state.spaceAsteroidX += state.spaceAsteroidSpeed * dt;
              const playerX = canvasRef.current!.width / 2 + 100;
              if (state.spaceAsteroidX < playerX + 35 && state.spaceAsteroidX > playerX - 35) {
                if (state.playerSide === 'right') {
                  state.spaceStunTimer = 0.7; // stun
                  state.timeRemaining = Math.max(0, state.timeRemaining - 2.5); // penalty
                  sound.playHit();
                  state.screenShake = 12;
                  state.spaceAsteroidActive = false;
                }
              }
              if (state.spaceAsteroidX > canvasRef.current!.width + 100) state.spaceAsteroidActive = false;
            }
          }
        }
      }

      // 3. Toxic Wasteland acid sludge rise
      if (worldId === 'world_wasteland') {
        state.toxicSludgeHeight += dt * 10;
        if (state.toxicSludgeHeight > 130) {
          decayMultiplier *= 2.8; // 3x decay penalty
        }
      }

      // 4. Steampunk Workshop steam vent eruptions
      if (worldId === 'world_steampunk') {
        if (state.steampunkWarningSide === 'none' && !state.steampunkSteamActive) {
          if (Math.random() < dt * 0.15) {
            state.steampunkWarningSide = Math.random() < 0.5 ? 'left' : 'right';
            state.steampunkWarningTimer = 1.3;
            state.steamHitCounted = false;
          }
        }
        
        if (state.steampunkWarningSide !== 'none' && !state.steampunkSteamActive) {
          state.steampunkWarningTimer -= dt;
          if (state.steampunkWarningTimer <= 0) {
            state.steampunkSteamActive = true;
            state.steampunkSteamTimer = 1.1;
          }
        }
        
        if (state.steampunkSteamActive) {
          state.steampunkSteamTimer -= dt;
          if (state.playerSide === (state.steampunkWarningSide as any) && !state.steamHitCounted) {
            const penalty = Math.max(2.0, state.timeRemaining * 0.25);
            state.timeRemaining = Math.max(0, state.timeRemaining - penalty);
            state.steamHitCounted = true;
            sound.playHit();
            state.screenShake = 8;
          }
          if (state.steampunkSteamTimer <= 0) {
            state.steampunkSteamActive = false;
            state.steampunkWarningSide = 'none';
          }
        }
      }

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
    if (state.isDead && state.deathTimer > 0) {
      state.deathTimer -= dt;
      if (state.deathTimer <= 0) {
        state.deathTimer = 0;
        
        // Check if player has tickets and hasn't revived yet
        const userProfile = db.getUser();
        const tickets = userProfile.tickets || 0;
        if (tickets > 0 && !state.hasRevived) {
          state.isReviving = true;
          setShowReviveConfirm(true);
          setReviveCountdown(5);
        } else {
          // Stop and call React Game Over callback
          onGameOver(state.score, state.maxCombo, state.coinsCollected, state.diamondsCollected, state.ticketsCollected);
        }
      }
    }

    // Slashing trail fade decay
    if (state.trailFade > 0) {
      state.trailFade -= dt * 4;
      if (state.trailFade < 0) state.trailFade = 0;
    }

    // Background animation updates
    const canvas = canvasRef.current;
    if (canvas) {
      // 1. Forest squirrel & UFO
      state.bgSquirrelY += dt * 25 * state.bgSquirrelDir;
      if (state.bgSquirrelY > 520 || state.bgSquirrelY < 180) {
        state.bgSquirrelDir *= -1;
      }
      state.bgUfoX += dt * 45;
      if (state.bgUfoX > canvas.width + 120) {
        state.bgUfoX = -120;
        state.bgUfoY = 80 + Math.random() * 100;
      }

      // 2. City superhero & cat eyes
      state.bgHeroX += dt * 160;
      if (state.bgHeroX > canvas.width + 200) {
        state.bgHeroX = -200;
        state.bgHeroY = 100 + Math.random() * 120;
      }
      state.bgCatEyeTimer += dt;
      if (state.bgCatEyeTimer > 1.2) {
        state.bgCatEyeOffset = state.bgCatEyeOffset === 0 ? 4 : 0;
        state.bgCatEyeTimer = 0;
      }

      // 3. Ice Yeti & snowball
      state.bgYetiTimer += dt;
      if (state.bgYetiTimer > 0.45) {
        state.bgYetiFrame = (state.bgYetiFrame + 1) % 2;
        state.bgYetiTimer = 0;
      }
      state.bgSnowballX += dt * 70;
      if (state.bgSnowballX > canvas.width + 150) {
        state.bgSnowballX = -150;
      }

      // 4. Cyber PAC-MAN & Ghost
      state.bgPacmanX += dt * 95;
      state.bgGhostX += dt * 95;
      if (state.bgPacmanX > canvas.width + 120) {
        state.bgPacmanX = -120;
        state.bgGhostX = -70;
      }

      // 5. Volcano Monster & Marshmallow
      state.bgLavaMonsterTimer += dt;
      state.bgLavaMonsterY = Math.sin(state.bgLavaMonsterTimer * 3) * 12;
      state.bgMarshmallowY = Math.sin(Date.now() / 250) * 8;
    }

    state.bgScroll += dt * 5; // parallax slow background drift
  };

  const updateWeather = (dt: number) => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Spawn weather
    const maxWeather = config.weather === 'snow' ? 120 : (config.weather === 'rain' ? 150 : (config.weather === 'matrix' ? 80 : (config.weather === 'fog' ? 40 : (config.weather === 'candy_confetti' ? 50 : (config.weather === 'bubbles' ? 60 : (config.weather === 'neon_rain' ? 100 : (config.weather === 'zen_blossoms' ? 60 : (config.weather === 'arcade_glitches' ? 50 : 60))))))));
    
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
      } else if (config.weather === 'autumn_leaves') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -1 + Math.random() * 2,
          vy: 1 + Math.random() * 1.5,
          color: Math.random() < 0.33 ? '#ea580c' : (Math.random() < 0.66 ? '#ef4444' : '#f59e0b'),
          size: 3 + Math.random() * 4,
          alpha: 0.7,
          life: 0,
          maxLife: 250,
          rotation: Math.random() * Math.PI,
          vRotation: 0.02 - Math.random() * 0.04
        });
      } else if (config.weather === 'sandstorm') {
        state.weatherParticles.push({
          x: canvas.width + 10,
          y: Math.random() * canvas.height,
          vx: -3 - Math.random() * 3,
          vy: 0.2 + Math.random() * 0.6,
          color: Math.random() < 0.5 ? '#fef08a' : '#f59e0b',
          size: 1 + Math.random() * 2,
          alpha: 0.4 + Math.random() * 0.3,
          life: 0,
          maxLife: 150
        });
      } else if (config.weather === 'fog') {
        // Haunted Green glowing fog
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.4 + Math.random() * canvas.height * 0.6,
          vx: Math.random() * 0.4 - 0.2,
          vy: Math.random() * 0.2 - 0.1,
          color: 'rgba(77, 230, 128, 0.05)',
          size: 40 + Math.random() * 50,
          alpha: 0.06,
          life: 0,
          maxLife: 250
        });
      } else if (config.weather === 'stars') {
        // Space Station stars drifting down
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: 0,
          vy: 0.3 + Math.random() * 0.6,
          color: '#ffffff',
          size: 0.8 + Math.random() * 1.5,
          alpha: 0.3 + Math.random() * 0.7,
          life: 0,
          maxLife: 350
        });
      } else if (config.weather === 'acid_rain') {
        // Wasteland acidic green rain
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -1,
          vy: 6 + Math.random() * 3,
          color: 'rgba(164, 234, 164, 0.35)',
          size: 1.5,
          alpha: 0.4,
          life: 0,
          maxLife: 100
        });
      } else if (config.weather === 'steam_smoke') {
        // Steampunk industrial steam floating up
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: Math.random() * 1.6 - 0.8,
          vy: -(1.2 + Math.random() * 1.8),
          color: 'rgba(218, 200, 190, 0.15)',
          size: 15 + Math.random() * 20,
          alpha: 0.2,
          life: 0,
          maxLife: 160
        });
      } else if (config.weather === 'candy_confetti') {
        // Candy Land sweet color drops falling
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -1 + Math.random() * 2,
          vy: 1.2 + Math.random() * 1.8,
          color: ['#fda4af', '#f472b6', '#a7f3d0', '#bfdbfe', '#fef08a'][Math.floor(Math.random() * 5)],
          size: 3 + Math.random() * 4,
          alpha: 0.7,
          life: 0,
          maxLife: 200
        });
      } else if (config.weather === 'zen_blossoms') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -0.5 + Math.random() * 1.5,
          vy: 1.0 + Math.random() * 1.2,
          color: '#ffb7c5',
          size: 3 + Math.random() * 3,
          alpha: 0.6 + Math.random() * 0.4,
          life: 0,
          maxLife: 260,
          rotation: Math.random() * Math.PI,
          vRotation: 0.01 - Math.random() * 0.02
        });
      } else if (config.weather === 'bubbles') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: Math.random() * 0.8 - 0.4,
          vy: -(0.5 + Math.random() * 1.5),
          color: 'rgba(0, 255, 255, 0.3)',
          size: 2 + Math.random() * 5,
          alpha: 0.2 + Math.random() * 0.3,
          life: 0,
          maxLife: 300
        });
      } else if (config.weather === 'neon_rain') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -1,
          vy: 10 + Math.random() * 6,
          color: Math.random() < 0.3 ? '#ff00ff' : (Math.random() < 0.6 ? '#39ff14' : '#00ffff'),
          size: 1.5 + Math.random() * 1,
          alpha: 0.5,
          life: 0,
          maxLife: 80
        });
      } else if (config.weather === 'volcano_ash') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: -0.5 + Math.random() * 1.0,
          vy: 1.5 + Math.random() * 2.0,
          color: Math.random() < 0.3 ? '#ff4500' : (Math.random() < 0.6 ? '#555555' : '#888888'),
          size: 1 + Math.random() * 3,
          alpha: 0.4 + Math.random() * 0.4,
          life: 0,
          maxLife: 200
        });
      } else if (config.weather === 'clouds') {
        state.weatherParticles.push({
          x: -100 - Math.random() * 100,
          y: Math.random() * canvas.height * 0.4,
          vx: 0.2 + Math.random() * 0.5,
          vy: 0,
          color: 'rgba(255, 255, 255, 0.25)',
          size: 40 + Math.random() * 40,
          alpha: 0.15 + Math.random() * 0.15,
          life: 0,
          maxLife: 600
        });
      } else if (config.weather === 'arcade_glitches') {
        state.weatherParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0,
          color: Math.random() < 0.5 ? '#ff007f' : '#00f0ff',
          size: 4 + Math.random() * 6,
          alpha: 0.8,
          life: 0,
          maxLife: 40 + Math.random() * 40
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

      p.life++;
      if (p.maxLife && p.life > p.maxLife) {
        state.weatherParticles.splice(i, 1);
        continue;
      }

      if (config.weather === 'lava' || config.weather === 'bubbles') {
        // Embers and bubbles float up, reset if out
        if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          state.weatherParticles.splice(i, 1);
        }
      } else if (config.weather === 'sandstorm') {
        // Sandstorm particles blow left
        if (p.x < -10 || p.y > canvas.height + 10 || p.y < -10) {
          state.weatherParticles.splice(i, 1);
        }
      } else if (config.weather === 'clouds') {
        // Clouds drift right
        if (p.x > canvas.width + 100) {
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
    if (!state.isDead) {
      drawPlayer(ctx, canvas);
    }

    // 7. Draw Particles
    drawParticles(ctx);

    // 8. Draw Score Floating Texts
    drawScoreTexts(ctx);

    // Space Station Asteroid Alert & Flying Asteroid
    if (worldId === 'world_space' && state.spaceAsteroidActive) {
      if (state.spaceAsteroidWarningTimer > 0) {
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        if (blink) {
          ctx.fillStyle = '#ff3300';
          ctx.font = '24px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          const alertX = state.spaceAsteroidSide === 'left' ? 40 : canvas.width - 40;
          ctx.fillText('⚠', alertX, state.spaceAsteroidY);
        }
      } else {
        ctx.save();
        ctx.fillStyle = '#4b5563'; // dark grey asteroid
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.spaceAsteroidX, state.spaceAsteroidY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(state.spaceAsteroidX - 6, state.spaceAsteroidY - 4, 4, 0, Math.PI * 2);
        ctx.arc(state.spaceAsteroidX + 4, state.spaceAsteroidY + 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Space Stun stars above player
    if (worldId === 'world_space' && state.spaceStunTimer > 0 && !state.isDead) {
      ctx.save();
      ctx.fillStyle = '#eab308';
      const playerX = canvas.width / 2 + (state.playerSide === 'left' ? -100 : 100);
      const playerY = canvas.height - 180 - 60;
      const starCount = 3;
      const spin = Date.now() * 0.01;
      for (let s = 0; s < starCount; s++) {
        const angle = spin + (s * (Math.PI * 2)) / starCount;
        const sx = playerX + Math.cos(angle) * 20;
        const sy = playerY + Math.sin(angle) * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Steampunk steam warning & steam clouds
    if (worldId === 'world_steampunk') {
      if (state.steampunkWarningSide !== 'none' && !state.steampunkSteamActive) {
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        if (blink) {
          ctx.fillStyle = '#ffaa66';
          ctx.font = '24px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          const alertX = state.steampunkWarningSide === 'left' ? 40 : canvas.width - 40;
          ctx.fillText('⚠', alertX, canvas.height - 180);
        }
      } else if (state.steampunkSteamActive) {
        ctx.save();
        const steamX = state.steampunkWarningSide === 'left' ? 0 : canvas.width / 2;
        const steamW = canvas.width / 2;
        const grad = ctx.createLinearGradient(steamX, 0, steamX + steamW, 0);
        if (state.steampunkWarningSide === 'left') {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.45)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(steamX, 0, steamW, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        for (let sy = 50; sy < canvas.height; sy += 60) {
          const size = 30 + (sy % 20);
          const ox = Math.sin((Date.now() * 0.005) + sy) * 15;
          const px = state.steampunkWarningSide === 'left' 
            ? 40 + ox 
            : canvas.width - 40 + ox;
          ctx.beginPath();
          ctx.arc(px, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Toxic Sludge pool rising from bottom
    if (worldId === 'world_wasteland' && state.toxicSludgeHeight > 0) {
      ctx.save();
      const sludgeGrad = ctx.createLinearGradient(0, canvas.height - state.toxicSludgeHeight, 0, canvas.height);
      sludgeGrad.addColorStop(0, 'rgba(174, 229, 13, 0.85)');
      sludgeGrad.addColorStop(1, 'rgba(40, 92, 16, 0.95)');
      ctx.fillStyle = sludgeGrad;
      ctx.fillRect(0, canvas.height - state.toxicSludgeHeight, canvas.width, state.toxicSludgeHeight);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      const time = Date.now() * 0.003;
      for (let bx = 20; bx < canvas.width; bx += 40) {
        const bubbleY = canvas.height - state.toxicSludgeHeight + 10 + (Math.sin(time + bx) * 8);
        if (bubbleY < canvas.height) {
          ctx.beginPath();
          ctx.arc(bx + (Math.cos(time + bx) * 6), bubbleY, 3 + (bx % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore();

    // Haunted Graveyard vignette overlay
    if (worldId === 'world_haunted') {
      ctx.save();
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height - 180, 60,
        canvas.width / 2, canvas.height - 180, canvas.height * 0.7
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${state.hauntedVignetteAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

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
      ctx.strokeStyle = 'rgba(210, 140, 56, 0.08)';
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

  const drawLowPolyMountain = (
    ctx: CanvasRenderingContext2D,
    leftX: number,
    peakX: number,
    rightX: number,
    peakY: number,
    baseY: number,
    lightColor: string,
    darkColor: string
  ) => {
    // Left side (lit)
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(leftX, baseY);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(peakX, baseY);
    ctx.closePath();
    ctx.fill();

    // Right side (shadow)
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(peakX, baseY);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(rightX, baseY);
    ctx.closePath();
    ctx.fill();
  };

  const drawParallaxLayers = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    const baseY = canvas.height;
    
    if (config.blockType === 'forest') {
      // Draw distant mountains - Low Poly 3D
      drawLowPolyMountain(ctx, -120, canvas.width * 0.3, canvas.width * 0.7, baseY - 220, baseY, '#2a3a2a', '#1a241a');
      drawLowPolyMountain(ctx, canvas.width * 0.32, canvas.width * 0.75, canvas.width + 120, baseY - 260, baseY, '#223222', '#142014');

      // Midground Low Poly Mountains
      drawLowPolyMountain(ctx, -50, canvas.width * 0.15, canvas.width * 0.5, baseY - 150, baseY, '#385238', '#253625');
      drawLowPolyMountain(ctx, canvas.width * 0.2, canvas.width * 0.52, canvas.width * 0.85, baseY - 180, baseY, '#304730', '#1d2c1d');
      drawLowPolyMountain(ctx, canvas.width * 0.55, canvas.width * 0.88, canvas.width + 80, baseY - 140, baseY, '#3c563c', '#283b28');

      // Bizarre Squirrel on tree trunk
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(45, state.bgSquirrelY, 8, 14); // body
      ctx.fillStyle = '#A05A2C';
      ctx.fillRect(44 + (state.bgSquirrelDir > 0 ? 4 : -2), state.bgSquirrelY - 6, 7, 7); // head
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(40, state.bgSquirrelY + 5, 5, 12); // tail
      ctx.fillStyle = '#000000';
      ctx.fillRect(48 + (state.bgSquirrelDir > 0 ? 1 : -4), state.bgSquirrelY - 4, 1.5, 1.5); // eye

      // UFO Beaming sheep
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.ellipse(state.bgUfoX, state.bgUfoY, 24, 9, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#4b5563';
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(state.bgUfoX, state.bgUfoY - 3, 8, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 100, 0.16)';
      ctx.beginPath();
      ctx.moveTo(state.bgUfoX - 10, state.bgUfoY + 4);
      ctx.lineTo(state.bgUfoX - 35, state.bgUfoY + 120);
      ctx.lineTo(state.bgUfoX + 35, state.bgUfoY + 120);
      ctx.lineTo(state.bgUfoX + 10, state.bgUfoY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      const sheepY = state.bgUfoY + 40 + Math.sin(Date.now() / 250) * 12;
      ctx.fillRect(state.bgUfoX - 6, sheepY, 12, 8); // body
      ctx.fillStyle = '#000000';
      ctx.fillRect(state.bgUfoX + 2, sheepY - 2, 4, 4); // head
      ctx.fillRect(state.bgUfoX - 5, sheepY + 8, 2, 3); // legs
      ctx.fillRect(state.bgUfoX + 3, sheepY + 8, 2, 3);
    } 
    else if (config.blockType === 'city') {
      // Draw 3D buildings skyline
      const buildingWidth = 90;
      const spacing = 130;
      let idx = 0;
      for (let x = -60; x < canvas.width + 100; x += spacing) {
        idx++;
        const h = 220 + Math.sin(idx * 1.5) * 80;
        const frontW = buildingWidth * 0.75;
        const sideW = buildingWidth * 0.25;
        
        // 1. Front face (lit)
        ctx.fillStyle = '#1e2538';
        ctx.fillRect(x, canvas.height - h, frontW, h);
        
        // 2. Side face (shadowed, 3D skew)
        ctx.fillStyle = '#121622';
        ctx.beginPath();
        ctx.moveTo(x + frontW, canvas.height - h);
        ctx.lineTo(x + frontW + sideW, canvas.height - h - 10);
        ctx.lineTo(x + frontW + sideW, canvas.height);
        ctx.lineTo(x + frontW, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        // 3. Roof (top facet, 3D skew)
        ctx.fillStyle = '#2c354d';
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - h);
        ctx.lineTo(x + frontW, canvas.height - h);
        ctx.lineTo(x + frontW + sideW, canvas.height - h - 10);
        ctx.lineTo(x + sideW, canvas.height - h - 10);
        ctx.closePath();
        ctx.fill();
        
        // Draw tiny yellow windows in perspective (front face only)
        ctx.fillStyle = 'rgba(255,235,100,0.18)';
        for (let wy = canvas.height - h + 25; wy < canvas.height - 25; wy += 35) {
          ctx.fillRect(x + 10, wy, 8, 12);
          ctx.fillRect(x + frontW - 18, wy, 8, 12);
        }
      }

      // Draw highway traffic at the very bottom
      const roadY = canvas.height - 35;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, roadY, canvas.width, 35);
      
      // Dashed lane divider
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, roadY + 17);
      ctx.lineTo(canvas.width, roadY + 17);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
      
      // Moving traffic headlights (white, moving left)
      ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
      const hOffset = (Date.now() * 0.08) % 120;
      for (let hx = canvas.width + hOffset; hx > -50; hx -= 120) {
        ctx.beginPath();
        ctx.arc(hx, roadY + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Headlight glow cone
        const glow = ctx.createRadialGradient(hx, roadY + 8, 1, hx - 10, roadY + 8, 15);
        glow.addColorStop(0, 'rgba(255, 255, 230, 0.35)');
        glow.addColorStop(1, 'rgba(255, 255, 230, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(hx, roadY + 8, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 230, 0.9)';
      }
      
      // Moving traffic taillights (red, moving right)
      ctx.fillStyle = 'rgba(255, 60, 60, 0.9)';
      const tOffset = (Date.now() * 0.06) % 120;
      for (let tx = -50 + tOffset; tx < canvas.width + 50; tx += 120) {
        ctx.beginPath();
        ctx.arc(tx, roadY + 26, 2, 0, Math.PI * 2);
        ctx.fill();
        // Taillight glow
        const glow = ctx.createRadialGradient(tx, roadY + 26, 1, tx, roadY + 26, 8);
        glow.addColorStop(0, 'rgba(255, 60, 60, 0.4)');
        glow.addColorStop(1, 'rgba(255, 60, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tx, roadY + 26, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 60, 60, 0.9)';
      }

      // Flying superhero
      ctx.fillStyle = '#ff3300'; // cape
      ctx.beginPath();
      ctx.moveTo(state.bgHeroX - 18, state.bgHeroY + 2);
      ctx.lineTo(state.bgHeroX - 6, state.bgHeroY - 5);
      ctx.lineTo(state.bgHeroX - 6, state.bgHeroY + 9);
      ctx.fill();

      ctx.fillStyle = '#0066ff'; // suit
      ctx.fillRect(state.bgHeroX - 6, state.bgHeroY - 3, 18, 7);
      ctx.fillStyle = '#ffcc99'; // head
      ctx.beginPath();
      ctx.arc(state.bgHeroX + 15, state.bgHeroY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Funny Cat Billboard
      const billX = canvas.width - 130;
      const billY = canvas.height - 240;
      ctx.fillStyle = '#374151'; // frame
      ctx.fillRect(billX, billY, 80, 56);
      ctx.fillRect(billX + 36, billY + 56, 8, 40); // stand
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.strokeRect(billX, billY, 80, 56);

      ctx.fillStyle = '#1f2937'; // inner board
      ctx.fillRect(billX + 4, billY + 4, 72, 48);

      ctx.fillStyle = '#f97316'; // cat face
      ctx.beginPath();
      ctx.arc(billX + 40, billY + 30, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath(); // cat ears
      ctx.moveTo(billX + 26, billY + 20); ctx.lineTo(billX + 22, billY + 10); ctx.lineTo(billX + 32, billY + 18);
      ctx.moveTo(billX + 54, billY + 20); ctx.lineTo(billX + 58, billY + 10); ctx.lineTo(billX + 48, billY + 18);
      ctx.fill();

      ctx.fillStyle = '#facc15'; // yellow eyes
      ctx.beginPath();
      ctx.arc(billX + 34, billY + 28, 4.5, 0, Math.PI * 2);
      ctx.arc(billX + 46, billY + 28, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000'; // shifting pupils
      ctx.fillRect(billX + 33 + state.bgCatEyeOffset/2, billY + 26, 2, 4);
      ctx.fillRect(billX + 45 + state.bgCatEyeOffset/2, billY + 26, 2, 4);
    } 
    else if (config.blockType === 'ice') {
      // Draw Aurora Borealis (Realistic shifting waves)
      ctx.save();
      const time = Date.now() * 0.0008;
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        const startY = 90 + j * 30 + Math.sin(time + j) * 12;
        ctx.moveTo(0, startY);
        const cp1x = canvas.width * 0.28;
        const cp1y = startY - 35 + Math.cos(time + j) * 15;
        const cp2x = canvas.width * 0.72;
        const cp2y = startY + 35 - Math.sin(time + j) * 15;
        const endX = canvas.width;
        const endY = startY + Math.sin(time + j + 1.2) * 8;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.lineTo(canvas.width, endY + 70);
        ctx.bezierCurveTo(cp2x, cp2y + 70, cp1x, cp1y + 70, 0, startY + 70);
        ctx.closePath();
        
        const auroraGrd = ctx.createLinearGradient(0, startY - 10, 0, startY + 70);
        auroraGrd.addColorStop(0, 'rgba(0, 255, 190, 0)');
        auroraGrd.addColorStop(0.3, j === 0 ? 'rgba(0, 240, 255, 0.28)' : 'rgba(120, 80, 255, 0.24)');
        auroraGrd.addColorStop(0.75, 'rgba(0, 255, 170, 0.12)');
        auroraGrd.addColorStop(1, 'rgba(0, 255, 170, 0)');
        
        ctx.fillStyle = auroraGrd;
        ctx.fill();
      }
      ctx.restore();

      // Background Icebergs - Low Poly 3D
      drawLowPolyMountain(ctx, -60, canvas.width * 0.25, canvas.width * 0.65, baseY - 190, baseY, '#e0f2fe', '#93c5fd');
      drawLowPolyMountain(ctx, canvas.width * 0.42, canvas.width * 0.78, canvas.width + 80, baseY - 230, baseY, '#f0f9ff', '#cbd5e1');
      
      // Midground Icebergs
      drawLowPolyMountain(ctx, canvas.width * 0.12, canvas.width * 0.48, canvas.width * 0.88, baseY - 150, baseY, '#bde0fe', '#78b2e6');

      // yeti dancing
      const yetiX = 60;
      const yetiY = canvas.height - 130;
      ctx.fillStyle = '#f8fafc'; // white fur
      ctx.beginPath();
      ctx.arc(yetiX, yetiY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#93c5fd'; // blue face
      ctx.beginPath();
      ctx.arc(yetiX, yetiY - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000'; // eyes
      ctx.fillRect(yetiX - 3, yetiY - 8, 1.5, 1.5);
      ctx.fillRect(yetiX + 1.5, yetiY - 8, 1.5, 1.5);
      ctx.fillStyle = '#ef4444'; // red mouth
      ctx.fillRect(yetiX - 2, yetiY - 3, 4, 1.5);

      ctx.strokeStyle = '#f8fafc'; // waving yeti arms
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state.bgYetiFrame === 0) {
        ctx.moveTo(yetiX - 20, yetiY);
        ctx.lineTo(yetiX - 32, yetiY - 20);
        ctx.moveTo(yetiX + 20, yetiY);
        ctx.lineTo(yetiX + 32, yetiY - 20);
      } else {
        ctx.moveTo(yetiX - 20, yetiY);
        ctx.lineTo(yetiX - 32, yetiY + 12);
        ctx.moveTo(yetiX + 20, yetiY);
        ctx.lineTo(yetiX + 32, yetiY + 12);
      }
      ctx.stroke();

      // Rolling snowball
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(state.bgSnowballX, canvas.height - 110, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // running penguin
      const pengX = state.bgSnowballX + 40;
      ctx.fillStyle = '#0f172a'; // black body
      ctx.fillRect(pengX, canvas.height - 116, 11, 15);
      ctx.fillStyle = '#ffffff'; // white belly
      ctx.fillRect(pengX + 2, canvas.height - 112, 7, 9);
      ctx.fillStyle = '#f97316'; // orange beak
      ctx.fillRect(pengX + 8, canvas.height - 114, 4, 2.5);
    }
    else if (config.blockType === 'cyber') {
      // 3D Wireframe / Grid skyscrapers in background
      const cyberWidth = 80;
      const spacing = 140;
      let bIdx = 0;
      for (let cx = -40; cx < canvas.width + 100; cx += spacing) {
        bIdx++;
        const ch = 190 + Math.cos(bIdx * 2) * 60;
        
        // Front face grid outline
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, canvas.height - ch, cyberWidth * 0.75, ch);
        
        // Side face 3D skew
        ctx.strokeStyle = 'rgba(233, 69, 96, 0.15)';
        ctx.beginPath();
        ctx.moveTo(cx + cyberWidth * 0.75, canvas.height - ch);
        ctx.lineTo(cx + cyberWidth, canvas.height - ch - 12);
        ctx.lineTo(cx + cyberWidth, canvas.height);
        ctx.lineTo(cx + cyberWidth * 0.75, canvas.height);
        ctx.closePath();
        ctx.stroke();
      }

      // PAC-MAN chasing Red Ghost
      const pacY = 160;
      ctx.fillStyle = '#ef4444'; // Red Ghost
      ctx.fillRect(state.bgGhostX - 9, pacY - 9, 18, 15);
      ctx.beginPath(); ctx.arc(state.bgGhostX, pacY - 9, 9, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff'; // eyes
      ctx.fillRect(state.bgGhostX - 5, pacY - 11, 3, 3);
      ctx.fillRect(state.bgGhostX + 2, pacY - 11, 3, 3);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(state.bgGhostX - 4, pacY - 10, 1.5, 1.5);
      ctx.fillRect(state.bgGhostX + 3, pacY - 10, 1.5, 1.5);

      ctx.fillStyle = '#eab308'; // Pacman yellow
      ctx.beginPath();
      const mouthOpen = (Math.floor(Date.now() / 120) % 2 === 0);
      const startAngle = mouthOpen ? 0.2 * Math.PI : 0;
      const endAngle = mouthOpen ? 1.8 * Math.PI : 2 * Math.PI;
      ctx.arc(state.bgPacmanX, pacY, 13, startAngle, endAngle);
      ctx.lineTo(state.bgPacmanX, pacY);
      ctx.closePath();
      ctx.fill();

      // 404 block
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width - 180, 80, 120, 50);
      ctx.fillRect(canvas.width - 180, 80, 120, 50);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('404 WOOD', canvas.width - 170, 102);
      ctx.fillText('NOT FOUND', canvas.width - 170, 116);
    }
    else if (config.blockType === 'volcano') {
      // Volcano mountains - Low Poly 3D
      drawLowPolyMountain(ctx, -80, canvas.width * 0.4, canvas.width * 0.85, baseY - 200, baseY, '#22120d', '#140a06');
      drawLowPolyMountain(ctx, canvas.width * 0.35, canvas.width * 0.8, canvas.width + 120, baseY - 240, baseY, '#1c0f0a', '#100805');

      // Glowing magma cracks on the volcano faces
      ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, baseY - 200);
      ctx.lineTo(canvas.width * 0.45, baseY - 80);
      ctx.lineTo(canvas.width * 0.48, baseY - 80);
      ctx.lineTo(canvas.width * 0.4, baseY - 200);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 140, 0, 0.75)';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.8, baseY - 240);
      ctx.lineTo(canvas.width * 0.83, baseY - 120);
      ctx.lineTo(canvas.width * 0.85, baseY - 120);
      ctx.lineTo(canvas.width * 0.8, baseY - 240);
      ctx.closePath();
      ctx.fill();

      // glowing magma rivers in background
      ctx.fillStyle = '#e64000';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.35, canvas.height - 180);
      ctx.lineTo(canvas.width * 0.38, canvas.height - 180);
      ctx.lineTo(canvas.width * 0.5, canvas.height);
      ctx.lineTo(canvas.width * 0.45, canvas.height);
      ctx.fill();

      // Lava monster rising
      const monstX = 100;
      const monstY = canvas.height - 100 + state.bgLavaMonsterY;
      ctx.fillStyle = '#d946ef'; // Lava monster magenta purple
      ctx.beginPath();
      ctx.arc(monstX, monstY, 26, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(monstX - 26, monstY, 52, 45);

      ctx.fillStyle = '#facc15'; // eyes
      ctx.beginPath();
      ctx.arc(monstX - 10, monstY - 5, 5, 0, Math.PI * 2);
      ctx.arc(monstX + 10, monstY - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(monstX - 11, monstY - 6, 2, 2);
      ctx.fillRect(monstX + 9, monstY - 6, 2, 2);

      ctx.strokeStyle = '#d946ef'; // waving arms
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(monstX - 22, monstY + 12);
      ctx.lineTo(monstX - 38, monstY - 10 + Math.sin(Date.now() / 150) * 10);
      ctx.moveTo(monstX + 22, monstY + 12);
      ctx.lineTo(monstX + 38, monstY - 10 - Math.sin(Date.now() / 150) * 10);
      ctx.stroke();

      // Marshmallow with sunglasses floating
      const marshX = canvas.width - 120;
      const marshY = canvas.height - 90 + state.bgMarshmallowY;
      ctx.fillStyle = '#ffffff'; // marshmallow body
      ctx.fillRect(marshX - 12, marshY - 16, 24, 25);
      ctx.strokeStyle = '#7c2d12'; // toasted border
      ctx.lineWidth = 2;
      ctx.strokeRect(marshX - 12, marshY - 16, 24, 25);

      ctx.fillStyle = '#000000'; // sunglasses
      ctx.fillRect(marshX - 9, marshY - 11, 8, 4);
      ctx.fillRect(marshX + 2, marshY - 11, 8, 4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(marshX - 9, marshY - 11); ctx.lineTo(marshX + 10, marshY - 11); ctx.stroke();
    }
    else if (config.blockType === 'autumn') {
      // Draw distant autumn mountains - Low Poly 3D (terracotta, red-orange, gold/amber)
      drawLowPolyMountain(ctx, -120, canvas.width * 0.3, canvas.width * 0.7, baseY - 220, baseY, '#854d0e', '#7c2d12');
      drawLowPolyMountain(ctx, canvas.width * 0.32, canvas.width * 0.75, canvas.width + 120, baseY - 260, baseY, '#b45309', '#7c2d12');

      // Midground Low Poly Autumn Mountains
      drawLowPolyMountain(ctx, -50, canvas.width * 0.15, canvas.width * 0.5, baseY - 150, baseY, '#d97706', '#9a3412');
      drawLowPolyMountain(ctx, canvas.width * 0.2, canvas.width * 0.52, canvas.width * 0.85, baseY - 180, baseY, '#ea580c', '#9a3412');
      drawLowPolyMountain(ctx, canvas.width * 0.55, canvas.width * 0.88, canvas.width + 80, baseY - 140, baseY, '#f97316', '#c2410c');

      // Cute sleeping fox in autumn leaves
      const foxX = 70;
      const foxY = canvas.height - 100;
      ctx.fillStyle = '#ea580c'; // fox body
      ctx.beginPath();
      ctx.arc(foxX, foxY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // fox tail
      ctx.ellipse(foxX - 12, foxY + 4, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // tail tip
      ctx.beginPath();
      ctx.arc(foxX - 20, foxY + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c'; // fox head
      ctx.beginPath();
      ctx.arc(foxX + 10, foxY - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // fox ears
      ctx.moveTo(foxX + 6, foxY - 11); ctx.lineTo(foxX + 8, foxY - 18); ctx.lineTo(foxX + 12, foxY - 11);
      ctx.moveTo(foxX + 10, foxY - 11); ctx.lineTo(foxX + 14, foxY - 18); ctx.lineTo(foxX + 16, foxY - 11);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // fox cheeks
      ctx.beginPath();
      ctx.arc(foxX + 8, foxY - 3, 3, 0, Math.PI * 2);
      ctx.arc(foxX + 12, foxY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000'; // closed eyes & nose
      ctx.fillRect(foxX + 14, foxY - 5, 2, 1.5); // nose
    }
    else if (config.blockType === 'desert') {
      // Draw distant desert dunes - Low Poly 3D (warm gold/yellow/orange sand shades)
      drawLowPolyMountain(ctx, -100, canvas.width * 0.4, canvas.width * 0.8, baseY - 180, baseY, '#ca8a04', '#a16207');
      drawLowPolyMountain(ctx, canvas.width * 0.35, canvas.width * 0.75, canvas.width + 120, baseY - 210, baseY, '#d97706', '#9a3412');

      // Midground Low Poly Dunes
      drawLowPolyMountain(ctx, -40, canvas.width * 0.2, canvas.width * 0.55, baseY - 130, baseY, '#eab308', '#ca8a04');
      drawLowPolyMountain(ctx, canvas.width * 0.5, canvas.width * 0.85, canvas.width + 60, baseY - 140, baseY, '#facc15', '#d97706');

      // Cute camel walking
      const camelX = (Date.now() * 0.02) % (canvas.width + 100) - 50;
      const camelY = canvas.height - 110;
      ctx.fillStyle = '#d97706'; // camel color
      ctx.fillRect(camelX - 12, camelY - 8, 24, 12); // body
      ctx.fillRect(camelX - 4, camelY - 16, 8, 8); // hump
      ctx.fillRect(camelX + 8, camelY - 18, 5, 14); // neck
      ctx.fillRect(camelX + 10, camelY - 22, 7, 5); // head
      ctx.fillRect(camelX - 10, camelY + 4, 3, 10); // legs
      ctx.fillRect(camelX - 4, camelY + 4, 3, 10);
      ctx.fillRect(camelX + 4, camelY + 4, 3, 10);
      ctx.fillRect(camelX + 9, camelY + 4, 3, 10);
    }
    else if (config.blockType === 'haunted') {
      // Distant low poly gothic mountains/hills
      drawLowPolyMountain(ctx, -120, canvas.width * 0.3, canvas.width * 0.7, baseY - 190, baseY, '#180f2b', '#0c0717');
      drawLowPolyMountain(ctx, canvas.width * 0.32, canvas.width * 0.75, canvas.width + 120, baseY - 220, baseY, '#130c24', '#080410');

      // Midground gravestones and creepy trees silhouettes
      ctx.fillStyle = '#1c122e';
      
      // Gravestone 1
      ctx.fillRect(30, baseY - 50, 16, 30);
      ctx.beginPath(); ctx.arc(38, baseY - 50, 8, Math.PI, 0); ctx.fill();
      
      // Gravestone 2
      ctx.fillRect(canvas.width - 60, baseY - 60, 20, 40);
      ctx.beginPath(); ctx.arc(canvas.width - 50, baseY - 60, 10, Math.PI, 0); ctx.fill();

      // Creepy dead tree branches silhouette
      ctx.strokeStyle = '#10081d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // left tree trunk
      ctx.moveTo(15, baseY);
      ctx.quadraticCurveTo(20, baseY - 80, 5, baseY - 110);
      ctx.moveTo(18, baseY - 50);
      ctx.quadraticCurveTo(35, baseY - 80, 42, baseY - 90);
      // right tree trunk
      ctx.moveTo(canvas.width - 15, baseY);
      ctx.quadraticCurveTo(canvas.width - 25, baseY - 70, canvas.width - 12, baseY - 105);
      ctx.stroke();

      // Glowing ghost floating
      const ghostX = canvas.width * 0.25 + Math.sin(Date.now() * 0.002) * 40;
      const ghostY = baseY - 160 + Math.cos(Date.now() * 0.003) * 15;
      ctx.fillStyle = 'rgba(77, 230, 128, 0.2)'; // eerie green glow
      ctx.beginPath();
      ctx.arc(ghostX, ghostY, 15, Math.PI, 0);
      ctx.lineTo(ghostX + 15, ghostY + 20);
      ctx.quadraticCurveTo(ghostX, ghostY + 12, ghostX - 15, ghostY + 20);
      ctx.closePath();
      ctx.fill();
      
      // ghost eyes
      ctx.fillStyle = '#4de680';
      ctx.beginPath();
      ctx.arc(ghostX - 4, ghostY, 1.8, 0, Math.PI * 2);
      ctx.arc(ghostX + 4, ghostY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (config.blockType === 'space') {
      // Starry space station background: Draw distant blue nebula/planet
      ctx.save();
      
      // Distant planet
      const planetX = canvas.width * 0.8;
      const planetY = 120;
      const pGrd = ctx.createRadialGradient(planetX - 15, planetY - 10, 5, planetX, planetY, 35);
      pGrd.addColorStop(0, '#00ffff');
      pGrd.addColorStop(0.4, '#1b1b42');
      pGrd.addColorStop(1, '#05050d');
      ctx.fillStyle = pGrd;
      ctx.beginPath();
      ctx.arc(planetX, planetY, 35, 0, Math.PI*2);
      ctx.fill();
      
      // Planet ring
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(planetX, planetY, 55, 12, -0.3, 0, Math.PI*2);
      ctx.stroke();

      // Space Station solar wings structures in distance
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.fillRect(20, baseY - 120, 40, 100);
      ctx.strokeRect(20, baseY - 120, 40, 100);
      
      // Truss beam connecting
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, baseY - 70);
      ctx.lineTo(130, baseY - 70);
      ctx.stroke();
      
      // Astronaut floating
      const astroX = canvas.width * 0.3 + Math.sin(Date.now() * 0.0008) * 30;
      const astroY = baseY - 180 + Math.cos(Date.now() * 0.001) * 12;
      ctx.fillStyle = '#ffffff'; // astronaut suit
      ctx.beginPath();
      ctx.arc(astroX, astroY, 8, 0, Math.PI * 2); // helmet
      ctx.fill();
      ctx.fillRect(astroX - 6, astroY + 5, 12, 12); // body
      ctx.fillStyle = '#00ffff'; // visor
      ctx.fillRect(astroX - 4, astroY - 3, 8, 4);
      
      // tether cord
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(astroX, astroY + 12);
      ctx.quadraticCurveTo(astroX - 30, astroY + 40, -10, baseY - 40);
      ctx.stroke();
      
      ctx.restore();
    }
    else if (config.blockType === 'wasteland') {
      // Chemical silos, broken pipe structures, and bubbling green ooze pools in distance
      drawLowPolyMountain(ctx, -80, canvas.width * 0.3, canvas.width * 0.7, baseY - 170, baseY, '#272a24', '#11130f');
      drawLowPolyMountain(ctx, canvas.width * 0.35, canvas.width * 0.8, canvas.width + 120, baseY - 200, baseY, '#1e201b', '#0d0e0c');

      // Toxic silos midground
      ctx.fillStyle = '#22271d';
      ctx.fillRect(40, baseY - 110, 45, 110);
      ctx.fillRect(canvas.width - 80, baseY - 90, 40, 90);
      
      // Domed silo tops
      ctx.beginPath(); ctx.arc(62.5, baseY - 110, 22.5, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(canvas.width - 60, baseY - 90, 20, Math.PI, 0); ctx.fill();

      // Sludge pipes leaking green liquid
      ctx.fillStyle = '#553311';
      ctx.fillRect(0, baseY - 40, 90, 16);
      ctx.fillRect(canvas.width - 100, baseY - 50, 100, 16);
      ctx.fillStyle = '#aee50d'; // neon sludge drop
      ctx.fillRect(75, baseY - 24, 6, 24);
      ctx.fillRect(canvas.width - 90, baseY - 34, 6, 34);
    }
    else if (config.blockType === 'steampunk') {
      // Spinning copper gears and venting exhaust stacks
      drawLowPolyMountain(ctx, -100, canvas.width * 0.35, canvas.width * 0.75, baseY - 160, baseY, '#2a1a11', '#140c08');
      drawLowPolyMountain(ctx, canvas.width * 0.32, canvas.width * 0.78, canvas.width + 120, baseY - 190, baseY, '#1f130c', '#0f0805');

      ctx.save();
      const gearTime = Date.now() * 0.001;

      // Draw gear 1 (Left)
      const gear1X = 60;
      const gear1Y = baseY - 100;
      ctx.translate(gear1X, gear1Y);
      ctx.rotate(gearTime);
      ctx.fillStyle = '#5c3e2e';
      ctx.strokeStyle = '#1c120c';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // gear teeth
      ctx.fillStyle = '#5c3e2e';
      for (let t = 0; t < 8; t++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-6, -32, 12, 10);
        ctx.strokeRect(-6, -32, 12, 10);
      }
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fillStyle = '#1c120c'; ctx.fill();
      ctx.restore();

      ctx.save();
      // Draw gear 2 (Right, interlocks)
      const gear2X = canvas.width - 70;
      const gear2Y = baseY - 70;
      ctx.translate(gear2X, gear2Y);
      ctx.rotate(-gearTime + 0.3); // reverse rotation
      ctx.fillStyle = '#7c533c';
      ctx.strokeStyle = '#2d1e16';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // gear teeth
      ctx.fillStyle = '#7c533c';
      for (let t = 0; t < 10; t++) {
        ctx.rotate(Math.PI / 5);
        ctx.fillRect(-7, -40, 14, 12);
        ctx.strokeRect(-7, -40, 14, 12);
      }
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fillStyle = '#2d1e16'; ctx.fill();
      ctx.restore();

      // Copper pipe conduits
      ctx.strokeStyle = '#4e2f20';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-10, baseY - 30);
      ctx.lineTo(canvas.width + 10, baseY - 30);
      ctx.stroke();
    }
    else if (config.blockType === 'candy') {
      // Giant lollipops, candy cane pillars, and frosting-covered hills
      drawLowPolyMountain(ctx, -100, canvas.width * 0.3, canvas.width * 0.7, baseY - 160, baseY, '#ffb3c1', '#fae0e4');
      drawLowPolyMountain(ctx, canvas.width * 0.35, canvas.width * 0.75, canvas.width + 120, baseY - 180, baseY, '#ffccd5', '#fae0e4');

      // Midground giant lollipops
      ctx.save();
      
      // Lollipop 1 (Left)
      const pop1X = 60;
      const pop1Y = baseY - 120;
      ctx.strokeStyle = '#fda4af'; // stick
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(pop1X, pop1Y); ctx.lineTo(pop1X, baseY); ctx.stroke();
      // candy head
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(pop1X, pop1Y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(pop1X, pop1Y, 13, 0, Math.PI, true); ctx.stroke();
      
      // Lollipop 2 (Right)
      const pop2X = canvas.width - 60;
      const pop2Y = baseY - 140;
      ctx.strokeStyle = '#fda4af'; // stick
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(pop2X, pop2Y); ctx.lineTo(pop2X, baseY); ctx.stroke();
      // candy head
      ctx.fillStyle = '#e11d48';
      ctx.beginPath(); ctx.arc(pop2X, pop2Y, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(pop2X, pop2Y, 15, 0, Math.PI, true); ctx.stroke();

      ctx.restore();
    }
    else if (config.blockType === 'zen') {
      drawLowPolyMountain(ctx, -50, canvas.width * 0.3, canvas.width * 0.65, baseY - 160, baseY, '#3b202c', '#24131b');
      drawLowPolyMountain(ctx, canvas.width * 0.35, canvas.width * 0.72, canvas.width + 80, baseY - 180, baseY, '#351d27', '#1f1017');

      ctx.save();
      ctx.fillStyle = '#1c0e14';
      const gateX = 50;
      const gateY = baseY - 80;
      ctx.fillRect(gateX, gateY, 5, 80);
      ctx.fillRect(gateX + 25, gateY, 5, 80);
      ctx.fillRect(gateX - 8, gateY - 4, 46, 6);
      ctx.fillRect(gateX - 4, gateY + 4, 38, 4);
      ctx.restore();
    }
    else if (config.blockType === 'coral') {
      ctx.save();
      ctx.fillStyle = '#002244';
      ctx.fillRect(40, baseY - 120, 8, 120);
      ctx.fillRect(canvas.width - 50, baseY - 150, 10, 150);

      ctx.fillStyle = '#004d99';
      ctx.beginPath();
      ctx.moveTo(30, baseY);
      ctx.lineTo(40, baseY - 40);
      ctx.lineTo(45, baseY - 20);
      ctx.lineTo(55, baseY - 50);
      ctx.lineTo(60, baseY);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width - 70, baseY);
      ctx.lineTo(canvas.width - 60, baseY - 50);
      ctx.lineTo(canvas.width - 55, baseY - 30);
      ctx.lineTo(canvas.width - 40, baseY - 60);
      ctx.lineTo(canvas.width - 30, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (config.blockType === 'cyberpunk') {
      const spacing = 110;
      let count = 0;
      ctx.save();
      for (let x = -30; x < canvas.width + 50; x += spacing) {
        count++;
        const h = 240 + Math.sin(count) * 80;
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.08;
        ctx.strokeRect(x, baseY - h, 70, h);
        ctx.beginPath();
        ctx.moveTo(x, baseY - h);
        ctx.lineTo(x + 70, baseY);
        ctx.stroke();
      }
      ctx.restore();
    }
    else if (config.blockType === 'prehistoric') {
      drawLowPolyMountain(ctx, -100, canvas.width * 0.25, canvas.width * 0.6, baseY - 210, baseY, '#4c2e17', '#301d0e');
      drawLowPolyMountain(ctx, canvas.width * 0.4, canvas.width * 0.78, canvas.width + 120, baseY - 240, baseY, '#422814', '#2d1b0d');

      ctx.save();
      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.25, baseY - 210);
      ctx.lineTo(canvas.width * 0.23, baseY - 140);
      ctx.lineTo(canvas.width * 0.25, baseY);
      ctx.lineTo(canvas.width * 0.27, baseY);
      ctx.lineTo(canvas.width * 0.26, baseY - 140);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (config.blockType === 'sky') {
      ctx.save();
      const is1X = 60;
      const is1Y = baseY - 160;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(is1X, is1Y, 30, 0, Math.PI, true);
      ctx.lineTo(is1X - 35, is1Y + 20);
      ctx.lineTo(is1X + 35, is1Y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(is1X - 8, is1Y - 24, 4, 24);
      ctx.fillRect(is1X + 4, is1Y - 24, 4, 24);
      ctx.fillRect(is1X - 12, is1Y - 28, 24, 4);

      const is2X = canvas.width - 70;
      const is2Y = baseY - 200;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(is2X, is2Y, 40, 0, Math.PI, true);
      ctx.lineTo(is2X - 45, is2Y + 25);
      ctx.lineTo(is2X + 45, is2Y + 25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else if (config.blockType === 'arcade') {
      ctx.save();
      ctx.fillStyle = '#111111';
      const mX = canvas.width / 2;
      ctx.beginPath();
      ctx.moveTo(mX - 120, baseY);
      ctx.lineTo(mX, baseY - 140);
      ctx.lineTo(mX + 120, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      const gridY = baseY - 60;
      ctx.beginPath(); ctx.moveTo(0, gridY); ctx.lineTo(canvas.width, gridY); ctx.stroke();
      for (let rx = -50; rx <= canvas.width + 50; rx += 40) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, gridY);
        ctx.lineTo(rx, baseY);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const drawWeather = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = stateRef.current;
    
    state.weatherParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if ((config.weather === 'leaves' || config.weather === 'autumn_leaves' || config.weather === 'zen_blossoms') && p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw leaf/petal diamond
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.fill();
      } else if (config.weather === 'rain' || config.weather === 'neon_rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + 16);
        ctx.stroke();
      } else if (config.weather === 'arcade_glitches') {
        // Draw square pixel glitches
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        // snow / matrix code / embers / bubbles / clouds
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
      drawBlockSegment(ctx, centerX - treeWidth / 2, currentY, treeWidth, blockHeight, block);

      // Draw Obstacle/Branches
      if (block.obstacle === 'left') {
        drawObstacle(ctx, centerX - treeWidth / 2 - 80, currentY + 15, 80, 20, 'left');
      } else if (block.obstacle === 'right') {
        drawObstacle(ctx, centerX + treeWidth / 2, currentY + 15, 80, 20, 'right');
      }

      // Draw collectibles (Coins/Diamonds/Chests/Tickets)
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

      if (block.ticket === 'left') {
        drawTicket(ctx, centerX - treeWidth / 2 - 40, currentY + blockHeight / 2);
      } else if (block.ticket === 'right') {
        drawTicket(ctx, centerX + treeWidth / 2 + 40, currentY + blockHeight / 2);
      }
    }

    ctx.restore();
  };

  const drawBlockSegment = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, block?: GameBlock) => {
    if (config.blockType === 'forest') {
      // 3D cylindrical wood shading
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#2e1c14');
      grad.addColorStop(0.15, '#3b241a');
      grad.addColorStop(0.4, '#5c4033');
      grad.addColorStop(0.52, '#7a5a4a'); // highlight stripe
      grad.addColorStop(0.68, '#5c4033');
      grad.addColorStop(0.88, '#3b241a');
      grad.addColorStop(1, '#1e120d');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Wood bark rings curving in perspective (3D effect)
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/3, w/2 - 4, 5, 0, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + (h*2)/3, w/2 - 4, 5, 0, 0, Math.PI);
      ctx.stroke();

      // Main structural outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    } 
    else if (config.blockType === 'city') {
      // 3D structural steel beam with metallic highlight
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#262d3a');
      grad.addColorStop(0.25, '#3c4759');
      grad.addColorStop(0.5, '#7686a0'); // metal shine
      grad.addColorStop(0.75, '#4f5d75');
      grad.addColorStop(1, '#1d232e');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Rivets / Bolts in 3D panels
      ctx.fillStyle = '#171b24';
      ctx.beginPath();
      ctx.arc(x + 12, y + 15, 3, 0, Math.PI*2);
      ctx.arc(x + w - 12, y + 15, 3, 0, Math.PI*2);
      ctx.arc(x + 12, y + h - 15, 3, 0, Math.PI*2);
      ctx.arc(x + w - 12, y + h - 15, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#7686a0';
      ctx.beginPath();
      ctx.arc(x + 11, y + 14, 1.2, 0, Math.PI*2);
      ctx.arc(x + w - 13, y + 14, 1.2, 0, Math.PI*2);
      ctx.arc(x + 11, y + h - 16, 1.2, 0, Math.PI*2);
      ctx.arc(x + w - 13, y + h - 16, 1.2, 0, Math.PI*2);
      ctx.fill();

      // Steel plate seams
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x, y + 2, w, 4);
      ctx.fillRect(x, y + h - 6, w, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x, y + 6, w, 2);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    } 
    else if (config.blockType === 'ice') {
      // 3D Ice block with refracted crystal facets
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#51cfdf');
      grad.addColorStop(0.3, '#99e9f2');
      grad.addColorStop(0.7, '#c5f6fa'); // reflection core
      grad.addColorStop(1, '#3bc9db');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Light reflection facet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.3, y);
      ctx.lineTo(x + w * 0.15, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();

      // Refracted crystal shard lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.4, y);
      ctx.lineTo(x + w * 0.2, y + h * 0.7);
      ctx.lineTo(x + w * 0.65, y + h);
      ctx.stroke();

      ctx.strokeStyle = '#0b7285'; // ice block borders
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    } 
    else if (config.blockType === 'cyber') {
      // Holographic cyber grid block
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#0a0b0d');
      grad.addColorStop(0.5, '#1e2430'); // glowing core
      grad.addColorStop(1, '#07080a');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Scrolling neon perspective rings
      ctx.strokeStyle = 'rgba(210, 140, 56, 0.45)'; // cyber accent
      ctx.lineWidth = 1.5;
      for (let gy = y + 10; gy < y + h; gy += 20) {
        ctx.beginPath();
        ctx.ellipse(x + w/2, gy, w/2 - 4, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Neon center pulse line
      const pulse = Math.sin(Date.now() / 150) * 0.25 + 0.75;
      ctx.strokeStyle = `rgba(210, 140, 56, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w/2, y);
      ctx.lineTo(x + w/2, y + h);
      ctx.stroke();

      ctx.strokeStyle = '#d28c38';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);
    } 
    else if (config.blockType === 'volcano') {
      // 3D Volcanic basalt columnar columns
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#160e0e');
      grad.addColorStop(0.3, '#2a1a1a');
      grad.addColorStop(0.7, '#382222');
      grad.addColorStop(1, '#110b0b');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Basalt cracks (Giant's causeway structure)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.35, y);
      ctx.lineTo(x + w * 0.4, y + h);
      ctx.moveTo(x + w * 0.72, y);
      ctx.lineTo(x + w * 0.68, y + h);
      ctx.stroke();

      // Pulsing lava veins in the basalt seams
      const pulse = Math.sin(Date.now() / 180) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 69, 0, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.35, y);
      ctx.lineTo(x + w * 0.4, y + h);
      ctx.moveTo(x + w * 0.72, y);
      ctx.lineTo(x + w * 0.68, y + h);
      ctx.stroke();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'autumn') {
      // Warm orange-brown maple wood cylinder
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#7c2d12');
      grad.addColorStop(0.2, '#9a3412');
      grad.addColorStop(0.4, '#c2410c');
      grad.addColorStop(0.55, '#ea580c'); // bright highlight stripe
      grad.addColorStop(0.7, '#c2410c');
      grad.addColorStop(0.85, '#9a3412');
      grad.addColorStop(1, '#431407');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Wood bark rings curving in perspective (3D effect)
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.15)'; // light orange bark rings
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/3, w/2 - 4, 5, 0, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + (h*2)/3, w/2 - 4, 5, 0, 0, Math.PI);
      ctx.stroke();

      // Main structural outline
      ctx.strokeStyle = '#2d0600';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'desert') {
      // Pale yellow/sand palm cylinder
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#a16207');
      grad.addColorStop(0.18, '#ca8a04');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(0.55, '#fef08a'); // sand reflection stripe
      grad.addColorStop(0.7, '#eab308');
      grad.addColorStop(0.85, '#ca8a04');
      grad.addColorStop(1, '#713f12');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Palm trunk segments (ring outlines)
      ctx.strokeStyle = 'rgba(113, 63, 18, 0.25)';
      ctx.lineWidth = 2.5;
      for (let gy = y + 8; gy < y + h; gy += 12) {
        ctx.beginPath();
        ctx.ellipse(x + w/2, gy, w/2 - 4, 4, 0, 0, Math.PI);
        ctx.stroke();
      }

      // Main structural outline
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'haunted') {
      // Dark gnarled trunk with glowing green seams
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#100b1a');
      grad.addColorStop(0.3, '#1c122e');
      grad.addColorStop(0.7, '#2f1f4d');
      grad.addColorStop(1, '#0b0612');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = '#4de680';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.lineTo(x + w * 0.45, y + h);
      ctx.moveTo(x + w * 0.7, y);
      ctx.lineTo(x + w * 0.6, y + h * 0.5);
      ctx.lineTo(x + w * 0.8, y + h);
      ctx.stroke();

      ctx.strokeStyle = '#050308';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'space') {
      // Futuristic gray space hull plating
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.3, '#334155');
      grad.addColorStop(0.7, '#475569');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x + w / 2 - 2, y + 12, 4, h - 24);

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'wasteland') {
      // Toxic waste barrel
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#162b16');
      grad.addColorStop(0.3, '#305c30');
      grad.addColorStop(0.7, '#4c8a4c');
      grad.addColorStop(1, '#0e1c0e');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Ribbed metal ridges
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y + 12, w, 6);
      ctx.fillRect(x, y + h - 18, w, 6);

      // Hazard warning details
      ctx.fillStyle = '#aee50d';
      ctx.fillRect(x + w/2 - 10, y + h/2 - 2, 20, 4);
      ctx.fillRect(x + w/2 - 2, y + h/2 - 10, 4, 20);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'steampunk') {
      // Copper pipe with brass ring fittings
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#3e1d11');
      grad.addColorStop(0.3, '#7c3a22');
      grad.addColorStop(0.6, '#b85c37'); // copper gleam
      grad.addColorStop(0.8, '#7c3a22');
      grad.addColorStop(1, '#2c1209');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      // Brass ring
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x, y + h/2 - 4, w, 8);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y + h/2 - 4, w, 8);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'candy') {
      // Sweet/sour candy canes
      const isSour = block?.isSourCandy;
      const stripeColor1 = isSour ? '#22c55e' : '#ef4444'; // green vs red
      const stripeColor2 = '#ffffff';

      ctx.fillStyle = stripeColor2;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = stripeColor1;
      for (let offset = -40; offset < w; offset += 50) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + 20, y);
        ctx.lineTo(x + offset + 20 + 30, y + h);
        ctx.lineTo(x + offset + 30, y + h);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#4c0519'; // dark borders
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'zen') {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#3a1f28');
      grad.addColorStop(0.5, '#733e54');
      grad.addColorStop(1, '#241318');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#ffb7c5';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + w*0.2, y + h*0.3, 10, 4);
      ctx.fillRect(x + w*0.7, y + h*0.6, 8, 4);
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = '#1c0e14';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'coral') {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#001a33');
      grad.addColorStop(0.5, '#0059b3');
      grad.addColorStop(1, '#001122');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#00cc66';
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x + w, y + 60);
      ctx.lineTo(x + w, y + h - 10);
      ctx.lineTo(x, y + 30);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#000f1f';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'cyberpunk') {
      ctx.fillStyle = '#1c1c1e';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#39ff14';
      ctx.fillRect(x + 10, y, 6, h);
      ctx.fillRect(x + w - 16, y, 6, h);
      ctx.fillRect(x + 10, y + h*0.3, w - 20, 3);
      ctx.fillRect(x + 10, y + h*0.7, w - 20, 3);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'prehistoric') {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#1c1007');
      grad.addColorStop(0.5, '#472b15');
      grad.addColorStop(1, '#130a04');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#1b3b1f';
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + w - 20, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + 40, y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0a0502';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'sky') {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#ccac00');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1, '#998100');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 15, y, 4, h);
      ctx.fillRect(x + 35, y, 4, h);
      ctx.fillRect(x + 55, y, 4, h);

      ctx.strokeStyle = '#4d4000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }
    else if (config.blockType === 'arcade') {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#ff007f';
      ctx.fillRect(x + 8, y + 8, 16, 16);
      ctx.fillRect(x + w - 24, y + h - 24, 16, 16);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
    }
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, side: 'left' | 'right') => {
    ctx.save();
    
    if (config.blockType === 'forest') {
      // Wood textured branch
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(x, y + 4, w, h - 8);
      // Wood details (shading lines)
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(x, y + 6, w, 2);
      ctx.fillRect(x, y + h - 10, w, 2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Leaves clusters
      ctx.fillStyle = '#2e5c32';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const leafX = side === 'left' ? x - 5 : x + w + 5;
      
      // Draw 3 overlapping leaf circles for depth
      ctx.beginPath(); ctx.arc(leafX, y + h/2 - 12, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(leafX + (side==='left' ? -10 : 10), y + h/2 + 6, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#47854d'; // lighter green highlight
      ctx.beginPath(); ctx.arc(leafX, y + h/2, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } 
    else if (config.blockType === 'city') {
      // Metal support beam girder
      ctx.fillStyle = '#5a6375';
      ctx.fillRect(x, y + 2, w, h - 4);
      ctx.strokeStyle = '#2d3340';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 2, w, h - 4);

      // Girder truss cross lines
      ctx.strokeStyle = '#3e4654';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + w, y + h - 2);
      ctx.moveTo(x + w, y + 2);
      ctx.lineTo(x, y + h - 2);
      ctx.stroke();

      // Rivets (small circles)
      ctx.fillStyle = '#1f242e';
      ctx.beginPath();
      ctx.arc(x + 10, y + h/2, 3, 0, Math.PI*2);
      ctx.arc(x + w - 10, y + h/2, 3, 0, Math.PI*2);
      ctx.fill();
    } 
    else if (config.blockType === 'cyber') {
      // Cyber circuit conduit with black/yellow warning stripes (No neon glows!)
      ctx.fillStyle = '#3a414d';
      ctx.fillRect(x, y + 3, w, h - 6);
      ctx.strokeStyle = '#1d2127';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 3, w, h - 6);

      // Draw hazard stripes
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 2, y + 4, w - 4, h - 8);
      ctx.clip();
      
      ctx.strokeStyle = '#e5a93b'; // Amber yellow hazard lines
      ctx.lineWidth = 6;
      for (let offset = -20; offset < w + 20; offset += 16) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + 12, y + h);
        ctx.stroke();
      }
      ctx.restore();
    } 
    else if (config.blockType === 'volcano') {
      // Jagged volcanic obsidian crystal spike with glowing magma veins
      ctx.fillStyle = '#1c1c1f'; // dark obsidian grey
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x + w, y);
        ctx.lineTo(x + 10, y + 4);
        ctx.lineTo(x, y + h/2);
        ctx.lineTo(x + 10, y + h - 4);
        ctx.lineTo(x + w, y + h);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + w - 10, y + 4);
        ctx.lineTo(x + w, y + h/2);
        ctx.lineTo(x + w - 10, y + h - 4);
        ctx.lineTo(x, y + h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lava magma cracks inside spike
      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x + w - 10, y + h/2);
        ctx.lineTo(x + w/2, y + h/2 - 4);
        ctx.lineTo(x + 15, y + h/2 + 2);
      } else {
        ctx.moveTo(x + 10, y + h/2);
        ctx.lineTo(x + w/2, y + h/2 - 4);
        ctx.lineTo(x + w - 15, y + h/2 + 2);
      }
      ctx.stroke();
    } 
    else if (config.blockType === 'ice') {
      // Frosted light blue icy branch with hanging icicles
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(x, y + 2, w, h - 8);
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 2, w, h - 8);

      // Icicles hanging down
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      for (let offset = 10; offset < w; offset += 18) {
        ctx.moveTo(x + offset, y + h - 6);
        ctx.lineTo(x + offset + 4, y + h + 8);
        ctx.lineTo(x + offset + 8, y + h - 6);
      }
      ctx.fill();
      ctx.stroke();
    }
    else if (config.blockType === 'autumn') {
      // Reddish-orange maple branch with gold/red leaf clusters
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x, y + 6, w, 2);
      ctx.fillRect(x, y + h - 10, w, 2);
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Autumn Maple leaf clusters
      ctx.fillStyle = '#ea580c'; // main orange
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2;
      const leafX = side === 'left' ? x - 5 : x + w + 5;

      ctx.beginPath(); ctx.arc(leafX, y + h/2 - 12, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(leafX + (side==='left' ? -10 : 10), y + h/2 + 6, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ef4444'; // red leaf highlight
      ctx.beginPath(); ctx.arc(leafX, y + h/2, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    else if (config.blockType === 'desert') {
      // Dry yellow palm branch / frond
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x, y + 6, w, 2);
      ctx.fillRect(x, y + h - 10, w, 2);
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Palm leaf fronds hanging/pointing out
      ctx.fillStyle = '#854d0e';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      const leafX = side === 'left' ? x - 8 : x + w + 8;
      
      // Draw 3 pointed triangular palm leaf shapes
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(leafX, y + h/2 - 15);
        ctx.lineTo(leafX - 25, y + h/2 - 8);
        ctx.lineTo(leafX - 5, y + h/2 - 2);
        ctx.moveTo(leafX, y + h/2 - 2);
        ctx.lineTo(leafX - 28, y + h/2 + 5);
        ctx.lineTo(leafX - 5, y + h/2 + 10);
        ctx.moveTo(leafX, y + h/2 + 8);
        ctx.lineTo(leafX - 22, y + h/2 + 16);
        ctx.lineTo(leafX - 2, y + h/2 + 18);
      } else {
        ctx.moveTo(leafX, y + h/2 - 15);
        ctx.lineTo(leafX + 25, y + h/2 - 8);
        ctx.lineTo(leafX + 5, y + h/2 - 2);
        ctx.moveTo(leafX, y + h/2 - 2);
        ctx.lineTo(leafX + 28, y + h/2 + 5);
        ctx.lineTo(leafX + 5, y + h/2 + 10);
        ctx.moveTo(leafX, y + h/2 + 8);
        ctx.lineTo(leafX + 22, y + h/2 + 16);
        ctx.lineTo(leafX + 2, y + h/2 + 18);
      }
      ctx.fill();
      ctx.stroke();
    }
    else if (config.blockType === 'haunted') {
      // Spooky vine with green moss/glow details
      ctx.fillStyle = '#2b1b42'; // dark purple branch
      ctx.fillRect(x, y + 4, w, h - 8);
      
      // glowing cracks / moss
      ctx.fillStyle = '#4de680';
      ctx.fillRect(x + 10, y + h/2 - 2, w - 20, 3);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Spooky leaf / skull moss shape at the end
      ctx.fillStyle = '#1c1030';
      ctx.strokeStyle = '#4de680';
      ctx.lineWidth = 1.5;
      const leafX = side === 'left' ? x - 8 : x + w + 8;
      ctx.beginPath();
      ctx.arc(leafX, y + h/2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Spooky small glow dots (eyes)
      ctx.fillStyle = '#4de680';
      ctx.beginPath();
      ctx.arc(leafX - 4, y + h/2 - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(leafX + 4, y + h/2 - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (config.blockType === 'space') {
      // Metallic cyber truss / solar wing with light blue trim
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y + 2, w, h - 4);
      
      // Glowing panels
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x + 10, y + 6, w - 20, 3);
      ctx.fillRect(x + 10, y + h - 9, w - 20, 3);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 2, w, h - 4);

      // Solar wing panel at the end
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      const panelX = side === 'left' ? x - 25 : x + w;
      ctx.fillRect(panelX, y - 8, 25, h + 16);
      ctx.strokeRect(panelX, y - 8, 25, h + 16);
      
      // Grid lines inside panel
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + 12.5, y - 8);
      ctx.lineTo(panelX + 12.5, y + h + 8);
      ctx.moveTo(panelX, y + h/2);
      ctx.lineTo(panelX + 25, y + h/2);
      ctx.stroke();
    }
    else if (config.blockType === 'wasteland') {
      // Rusted metal pipe dripping toxic slime
      ctx.fillStyle = '#451a03'; // rusted brown
      ctx.fillRect(x, y + 4, w, h - 8);
      
      // Toxic green slime puddle on the pipe
      ctx.fillStyle = '#aee50d';
      ctx.fillRect(x + 12, y + 2, w - 24, 4);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Slime droplet hanging at the end
      ctx.fillStyle = '#aee50d';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      const dripX = side === 'left' ? x - 6 : x + w + 6;
      ctx.beginPath();
      ctx.arc(dripX, y + h/2 + 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Tiny drop tear
      ctx.beginPath();
      ctx.moveTo(dripX, y + h/2 - 4);
      ctx.lineTo(dripX - 5, y + h/2 + 6);
      ctx.lineTo(dripX + 5, y + h/2 + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    else if (config.blockType === 'steampunk') {
      // Copper pipe with brass valve or gears
      ctx.fillStyle = '#7c3a22'; // copper brown
      ctx.fillRect(x, y + 4, w, h - 8);
      
      // brass bands
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 15, y + 4, 10, h - 8);
      ctx.fillRect(x + w - 25, y + 4, 10, h - 8);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Venting valve gear wheel at the end
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const valveX = side === 'left' ? x - 12 : x + w + 12;
      ctx.beginPath();
      ctx.arc(valveX, y + h/2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Inner spokes of the valve wheel
      ctx.beginPath();
      ctx.arc(valveX, y + h/2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3e1d11';
      ctx.fill();
      ctx.stroke();
    }
    else if (config.blockType === 'candy') {
      // Red and white striped candy cane spike
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y + 4, w, h - 8);

      ctx.fillStyle = '#ef4444'; // Red stripe
      ctx.beginPath();
      for (let offset = -10; offset < w; offset += 30) {
        ctx.moveTo(x + offset, y + 4);
        ctx.lineTo(x + offset + 12, y + 4);
        ctx.lineTo(x + offset + 24, y + h - 4);
        ctx.lineTo(x + offset + 12, y + h - 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#4c0519';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 4, w, h - 8);

      // Sweet swirl candy lollipop at the end
      ctx.fillStyle = '#fda4af';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      const candyX = side === 'left' ? x - 14 : x + w + 14;
      ctx.beginPath();
      ctx.arc(candyX, y + h/2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Inner swirl
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(candyX, y + h/2, 10, 0, Math.PI, true);
      ctx.stroke();
      ctx.restore();
    }
    else if (config.blockType === 'zen') {
      ctx.save();
      ctx.fillStyle = '#733e54';
      ctx.fillRect(x, y + 5, w, h - 10);
      ctx.strokeStyle = '#1c0e14';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 5, w, h - 10);

      ctx.fillStyle = '#ffb7c5';
      ctx.strokeStyle = '#ffb7c5';
      const bloomX = side === 'left' ? x - 10 : x + w + 10;
      ctx.beginPath();
      ctx.arc(bloomX, y + h/2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    else if (config.blockType === 'coral') {
      ctx.save();
      ctx.fillStyle = '#0059b3';
      ctx.fillRect(x, y + 4, w, h - 8);

      ctx.fillStyle = '#00ffff';
      const spikeX = side === 'left' ? x - 8 : x + w + 8;
      ctx.beginPath();
      ctx.arc(spikeX, y + h/2, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#000f1f';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 4, w, h - 8);
      ctx.restore();
    }
    else if (config.blockType === 'cyberpunk') {
      ctx.save();
      ctx.fillStyle = '#1c1c1e';
      ctx.fillRect(x, y + 3, w, h - 6);
      
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(x, y + h/2 - 2, w, 4);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 3, w, h - 6);
      ctx.restore();
    }
    else if (config.blockType === 'prehistoric') {
      ctx.save();
      ctx.fillStyle = '#472b15';
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.strokeStyle = '#0a0502';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 4, w, h - 8);

      ctx.fillStyle = '#1b3b1f';
      ctx.strokeStyle = '#1b3b1f';
      const leafX = side === 'left' ? x - 12 : x + w + 12;
      ctx.beginPath();
      ctx.ellipse(leafX, y + h/2, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    else if (config.blockType === 'sky') {
      ctx.save();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x, y + 6, w, h - 12);
      ctx.strokeStyle = '#4d4000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y + 6, w, h - 12);

      ctx.fillStyle = '#ffffff';
      const wingX = side === 'left' ? x - 12 : x + w + 12;
      ctx.beginPath();
      ctx.arc(wingX, y + h/2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    else if (config.blockType === 'arcade') {
      ctx.save();
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(x, y + 4, w, h - 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y + 4, w, h - 8);
      
      ctx.fillStyle = '#00f0ff';
      const tipX = side === 'left' ? x - 8 : x + w;
      ctx.fillRect(tipX, y + 8, 8, h - 16);
      ctx.restore();
    }
    else {
      // Fallback
      ctx.fillStyle = config.branchColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
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

  const drawTicket = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Neon pink glowing ticket
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(x - 12, y - 8, 24, 16);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 12, y - 8, 24, 16);

    // Punch holes at left and right edges
    ctx.fillStyle = '#111827'; // match game background/wood card
    ctx.beginPath();
    ctx.arc(x - 12, y, 4, 0, Math.PI * 2);
    ctx.arc(x + 12, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text "T"
    ctx.fillStyle = '#ffffff';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('T', x - 3, y + 3);
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

    // Draw swing trail if active
    if (state.trailFade > 0 && trailId !== 'trail_none') {
      ctx.save();
      const pivotX = px + 25;
      const pivotY = py + 25 + bounceY;
      const startAngle = -Math.PI / 4;
      const endAngle = Math.PI / 2.2;
      
      let strokeStyle: string | CanvasGradient = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.globalAlpha = state.trailFade * 0.7;
      
      if (trailId === 'trail_fire') {
        const grad = ctx.createRadialGradient(pivotX, pivotY, 20, pivotX, pivotY, 65);
        grad.addColorStop(0, '#ffa500');
        grad.addColorStop(0.5, '#ff4500');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        strokeStyle = grad;
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 18;
      } else if (trailId === 'trail_spark') {
        strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 8;
      } else if (trailId === 'trail_rainbow') {
        const grad = ctx.createLinearGradient(pivotX - 30, pivotY - 30, pivotX + 30, pivotY + 30);
        grad.addColorStop(0, '#ff0000');
        grad.addColorStop(0.2, '#ff7f00');
        grad.addColorStop(0.4, '#ffff00');
        grad.addColorStop(0.6, '#00ff00');
        grad.addColorStop(0.8, '#0000ff');
        grad.addColorStop(1, '#8b00ff');
        strokeStyle = grad;
        ctx.lineWidth = 15;
      } else if (trailId === 'trail_dust') {
        strokeStyle = '#a05a2c';
        ctx.lineWidth = 16;
      } else if (trailId === 'trail_leaves') {
        strokeStyle = '#10b981';
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 16;
      } else if (trailId === 'trail_void') {
        strokeStyle = '#7c3aed';
        ctx.shadowColor = '#6d28d9';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 14;
      } else if (trailId === 'trail_sakura') {
        strokeStyle = '#f472b6';
        ctx.shadowColor = '#db2777';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 14;
      } else if (trailId === 'trail_gold') {
        strokeStyle = '#f59e0b';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 15;
      }
      
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 45, startAngle, endAngle, false);
      ctx.stroke();
      ctx.restore();
    }

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
        comboColor = '#ffcc00'; // Sparkling Gold
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
    if (!state.isPlaying && !state.isDead) {
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
    if (stateRef.current.isDead) return;
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
      {showReviveConfirm && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(5px)',
          zIndex: 20000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="game-card material-stone" style={{
            maxWidth: '400px',
            width: '100%',
            border: '2px solid var(--neon-magenta)',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
            padding: '24px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #1e2025 0%, #111827 100%)',
            animation: 'bounceSlow 2s infinite'
          }}>
            <h2 className="retro-title" style={{ color: 'var(--neon-magenta)', fontSize: '1.25rem', marginBottom: '12px', textShadow: '0 0 10px rgba(236,72,153,0.5)' }}>
              REVIVE AVAILABLE?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '20px', lineHeight: '1.5' }}>
              You were crushed! Spend 1 Revive Ticket to keep your score of <strong style={{ color: 'var(--neon-green)' }}>{stateRef.current.score}</strong> and continue the run.
            </p>

            <div style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-retro)',
              color: 'var(--neon-yellow)',
              margin: '16px 0',
              animation: 'pulseNeon 1s infinite'
            }}>
              {reviveCountdown}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1.5px solid var(--panel-border)',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '24px',
              fontSize: '0.85rem'
            }}>
              <span>🎫 Tickets Remaining:</span>
              <strong style={{ color: 'var(--neon-magenta)', fontFamily: 'var(--font-retro)' }}>{db.getUser().tickets || 0}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="neon-btn-magenta" 
                style={{ width: '100%', padding: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}
                onClick={handleRevive}
              >
                USE TICKET 🎫
              </button>
              <button 
                className="retro-btn" 
                style={{ width: '100%', padding: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)', borderColor: 'var(--panel-border)' }}
                onClick={handleGiveUp}
              >
                GIVE UP & COLLECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasGame;
