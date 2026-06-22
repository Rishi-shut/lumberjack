// Local Storage Database & Game State Service for Infinite Chop
// Emulates a backend server using LocalStorage, including seeding, transactions, and admin controls.
const ADMIN_CONFIG = {
  username: import.meta.env.VITE_ADMIN_USERNAME || '',
  passcode: import.meta.env.VITE_ADMIN_PASSCODE || ''
};
import { supabase } from './supabaseClient';

export interface UserProfile {
  username: string;
  isGuest: boolean;
  email?: string;
  isBanned: boolean;
  level: number;
  xp: number;
  xpNeeded: number;
  highScore: number;
  maxCombo: number;
  coins: number;
  diamonds: number;
  tickets?: number;
  equippedCharacter: string;
  equippedWeapon: string;
  equippedTrail: string;
  equippedTitle: string;
  equippedBadge: string;
  equippedFrame: string;
  lastDailyClaim: string | null; // ISO string
  hasPremiumPass?: boolean;
  claimedFreeTiers?: number[];
  claimedPremiumTiers?: number[];
  stats: {
    totalChops: number;
    totalChestsOpened: number;
    gamesPlayed: number;
    totalCoinsEarned: number;
    totalDiamondsEarned: number;
    timePlayed: number; // in seconds
    worldRuns: Record<string, number>;
    location?: {
      city: string;
      countryCode: string;
      countryName: string;
    };
    dailyScores?: { score: number; coins: number; combo: number };
    weeklyScores?: { score: number; coins: number; combo: number };
    lastDailyKey?: string;
    lastWeeklyKey?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'chops' | 'combo' | 'coins' | 'chests' | 'level' | 'worlds';
  target: number;
  current: number;
  rewardCoins: number;
  rewardDiamonds: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface GameMission {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'legendary';
  target: number;
  current: number;
  rewardCoins: number;
  rewardDiamonds: number;
  claimed: boolean;
  requiredMap?: string;
}

export interface LeaderboardEntry {
  username: string;
  country: string;
  score: number;
  maxCombo: number;
  coins: number;
  avatar: string;
  title: string;
  frame: string;
  city?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'character' | 'weapon' | 'trail' | 'title' | 'world';
  cost: number;
  currency: 'coins' | 'diamonds';
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const getCharacterEmoji = (charId: string): string => {
  switch (charId) {
    case 'char_lumberjack': return '🪓';
    case 'char_viking': return '🛡️';
    case 'char_knight': return '⚔️';
    case 'char_samurai': return '🥷';
    case 'char_wizard': return '🧙';
    case 'char_ninja': return '👤'; // Cyber Ninja
    case 'char_alien': return '👽';
    case 'char_robot': return '🤖';
    case 'char_pyro': return '🔥';
    case 'char_druid': return '🌿';
    case 'char_valkyrie': return '⚡';
    case 'char_pharaoh': return '👑';
    case 'char_lawyer': return '💼';
    case 'char_doctor': return '🥼';
    default: return '👤';
  }
};

export const getCharacterLabel = (charId: string): string => {
  switch (charId) {
    case 'char_lumberjack': return '🪓 Lumberjack';
    case 'char_viking': return '🛡️ Viking';
    case 'char_knight': return '⚔️ Knight';
    case 'char_samurai': return '🥷 Samurai';
    case 'char_wizard': return '🧙 Wizard';
    case 'char_ninja': return '👤 Cyber Ninja';
    case 'char_alien': return '👽 Alien';
    case 'char_robot': return '🤖 Android';
    case 'char_pyro': return '🔥 Pyro Ranger';
    case 'char_druid': return '🌿 Druid';
    case 'char_valkyrie': return '⚡ Valkyrie';
    case 'char_pharaoh': return '👑 Pharaoh';
    case 'char_lawyer': return '💼 Attorney';
    case 'char_doctor': return '🥼 Doctor';
    default: return '👤 Challenger';
  }
};

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Characters
  { id: 'char_lumberjack', name: 'Lumberjack', description: 'Just a regular guy who loves wood.', type: 'character', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'char_viking', name: 'Viking Olaf', description: 'Chops trunks with Norse fury.', type: 'character', cost: 600, currency: 'coins', unlocked: false, rarity: 'common' },
  { id: 'char_knight', name: 'Sir Galahad', description: 'Armor is heavy, but his swing is true.', type: 'character', cost: 1200, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_samurai', name: 'Kenshin', description: 'Slices blocks with katana precision.', type: 'character', cost: 2000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_wizard', name: 'Gandalf', description: 'Chops trees with fireballs and magic.', type: 'character', cost: 3500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_ninja', name: 'Cyber Ninja', description: 'Synthesized movements. Light-speed cuts.', type: 'character', cost: 5000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_pyro', name: 'Pyro Ranger', description: 'Fires up his swing with heated gauntlets.', type: 'character', cost: 6000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_druid', name: 'Archdruid Elidon', description: 'Commands nature itself to fell the trees.', type: 'character', cost: 8000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_lawyer', name: 'Attorney Suit', description: 'Chops down cases and logs with legal fury.', type: 'character', cost: 1000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_doctor', name: 'Surgeon White', description: 'Diagnoses trunks and slices with surgical precision.', type: 'character', cost: 2500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_valkyrie', name: 'Brunhilde', description: 'Descends from Valhalla to chop wood.', type: 'character', cost: 30, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'char_pharaoh', name: 'Egypt Pharaoh', description: 'Awakened from eternal slumber to chop pyramids.', type: 'character', cost: 60, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'char_alien', name: 'Zorgon', description: 'An alien lumberjack from Sector 9.', type: 'character', cost: 15, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'char_robot', name: 'Mecha Chop', description: 'Iron limbs fueled by steam power.', type: 'character', cost: 40, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Weapons
  { id: 'weap_axe_wood', name: 'Banana Splitter', description: 'A crude carved wooden banana pick. Smells like banana oil.', type: 'weapon', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'weap_axe_golden', name: 'Golden Bananarang', description: 'A solid gold curved banana blade that glints in the sunlight.', type: 'weapon', cost: 1000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'weap_hammer', name: 'Bananabreaker Hammer', description: 'A massive, heavy mallet shaped like a cluster of green plantains.', type: 'weapon', cost: 2000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'weap_axe_fire', name: 'Flamin\' Plantain Slicer', description: 'A hot, glowing caramelized plantain cleaver that sizzles as it cuts.', type: 'weapon', cost: 3000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_chainsaw', name: 'Gemini Banana Saw', description: 'Vroom vroom! Motorized chainsaw spinning double-sided banana blades.', type: 'weapon', cost: 4500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_broadaxe', name: 'Dark Matter Plantain', description: 'A massive broadaxe forged from deep cosmic banana peel composite.', type: 'weapon', cost: 5000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_scythe', name: 'Crescent Banana Reaper', description: 'A giant reaping scythe with a crescent-curved yellow banana edge.', type: 'weapon', cost: 7000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_candy_cane', name: 'Frosted Banana Candy', description: 'A candy-coated peppermint banana club that packs a sweet punch.', type: 'weapon', cost: 15, currency: 'diamonds', unlocked: false, rarity: 'rare' },
  { id: 'weap_laser', name: 'Gemini Banana Laser', description: 'An advanced plasma emitter that focuses energy into a banana-shaped cutting beam.', type: 'weapon', cost: 20, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'weap_energy_halberd', name: 'Quantum Banana Lance', description: 'A legendary polearm that hums with subatomic glowing banana energy.', type: 'weapon', cost: 35, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'weap_blade', name: 'Glitch Banana Saber', description: 'An elegant neon cyber-sword that flickers between yellow and cyan pixel glitches.', type: 'weapon', cost: 50, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Trails
  { id: 'trail_none', name: 'No Trail', description: 'Simple chop motion.', type: 'trail', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'trail_dust', name: 'Wood Chips', description: 'A shower of splinters and leaves.', type: 'trail', cost: 400, currency: 'coins', unlocked: false, rarity: 'common' },
  { id: 'trail_spark', name: 'Electric Spark', description: 'Neon lightning trails.', type: 'trail', cost: 1200, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'trail_leaves', name: 'Falling Leaves', description: 'Leaves a trail of swirling forest foliage.', type: 'trail', cost: 3000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'trail_fire', name: 'Fire Flame', description: 'Leaves a smoking flame behind.', type: 'trail', cost: 2500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'trail_void', name: 'Void Portal', description: 'Leaves trails of dark cosmic particles.', type: 'trail', cost: 5000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'trail_rainbow', name: 'Rainbow Ribbon', description: 'A vibrant spectrum of colors.', type: 'trail', cost: 15, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'trail_sakura', name: 'Cherry Blossom', description: 'Fell trees with elegant pink petals.', type: 'trail', cost: 20, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'trail_gold', name: 'Golden Glitter', description: 'Shimmering path of pure gold dust.', type: 'trail', cost: 40, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Titles
  { id: 'title_none', name: 'Chop Cadet', description: 'A title for beginners.', type: 'title', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'title_timber', name: 'Timber Titan', description: 'A recognized heavy chopper.', type: 'title', cost: 500, currency: 'coins', unlocked: false, rarity: 'common' },
  { id: 'title_combo', name: 'Combo Master', description: 'For those who never miss.', type: 'title', cost: 1200, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'title_cyber', name: 'Netrunner', description: 'For hacking cyber cores.', type: 'title', cost: 2500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'title_god', name: 'Log Slayer', description: 'Feared by all infinite structures.', type: 'title', cost: 30, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Worlds
  { id: 'world_forest', name: 'Pine Forest', description: 'A peaceful woodland setting.', type: 'world', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'world_city', name: 'Metro Heights', description: 'Chop down steel girders and balconies.', type: 'world', cost: 800, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_ice', name: 'Glacial Spires', description: 'Chop slippery pillars of pure ice.', type: 'world', cost: 1500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_cyber', name: 'Vector Core', description: 'Chop down central server cores in cyberspace.', type: 'world', cost: 3000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'world_volcano', name: 'Magma Core', description: 'Chop volcanic magma crystals beside lava.', type: 'world', cost: 5000, currency: 'coins', unlocked: false, rarity: 'legendary' },
  { id: 'world_autumn', name: 'Autumn Canopy', description: 'Chop golden maple trunks amidst falling maple leaves.', type: 'world', cost: 6000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_desert', name: 'Sand Dune Oasis', description: 'Chop dry palm trunks near desert pyramids.', type: 'world', cost: 8000, currency: 'coins', unlocked: false, rarity: 'legendary' },
  { id: 'world_haunted', name: 'Haunted Graveyard', description: 'Chop haunted branches under flickering lanterns.', type: 'world', cost: 4000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'world_space', name: 'Space Station', description: 'Chop floating girders under zero-gravity and asteroid threats.', type: 'world', cost: 7000, currency: 'coins', unlocked: false, rarity: 'legendary' },
  { id: 'world_wasteland', name: 'Toxic Wasteland', description: 'Chop barrels while avoiding rising acid sludge.', type: 'world', cost: 4500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_steampunk', name: 'Steampunk Workshop', description: 'Chop steam conduits while dodging boiling steam leaks.', type: 'world', cost: 5500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_candy', name: 'Candy Land', description: 'Chop sweet candy canes while avoiding sour blocks.', type: 'world', cost: 3500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_zen', name: 'Zen Garden', description: 'Chop cherry blossom trunks in a serene garden layout.', type: 'world', cost: 5000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_coral', name: 'Coral Reef', description: 'Chop giant kelp stalks underwater surrounded by coral.', type: 'world', cost: 6500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_cyberpunk', name: 'Cyberpunk Grid', description: 'Chop glowing neon cylinders amid futuristic skyscrapers.', type: 'world', cost: 8500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'world_prehistoric', name: 'Prehistoric Jungle', description: 'Chop massive fern logs in dinosaur territory.', type: 'world', cost: 7500, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'world_sky', name: 'Sky Sanctuary', description: 'Chop marble floating pillars high in golden clouds.', type: 'world', cost: 9000, currency: 'coins', unlocked: false, rarity: 'legendary' },
  { id: 'world_arcade', name: 'Retro Arcade', description: 'Chop 8-bit digital logs under retro scanlines.', type: 'world', cost: 10000, currency: 'coins', unlocked: false, rarity: 'legendary' },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_first_chop', title: 'First Contact', description: 'Chop your very first block.', category: 'chops', target: 1, current: 0, rewardCoins: 50, rewardDiamonds: 0, unlocked: false, unlockedAt: null },
  { id: 'ach_chops_100', title: 'Logger Initiate', description: 'Chop 100 blocks total.', category: 'chops', target: 100, current: 0, rewardCoins: 100, rewardDiamonds: 1, unlocked: false, unlockedAt: null },
  { id: 'ach_chops_1000', title: 'Forest Bane', description: 'Chop 1,000 blocks total.', category: 'chops', target: 1000, current: 0, rewardCoins: 500, rewardDiamonds: 5, unlocked: false, unlockedAt: null },
  { id: 'ach_chops_10000', title: 'Wood Pulverizer', description: 'Chop 10,000 blocks total.', category: 'chops', target: 10000, current: 0, rewardCoins: 2000, rewardDiamonds: 20, unlocked: false, unlockedAt: null },
  
  { id: 'ach_combo_10', title: 'Steady Rhythm', description: 'Reach a 10 combo multiplier.', category: 'combo', target: 10, current: 0, rewardCoins: 50, rewardDiamonds: 0, unlocked: false, unlockedAt: null },
  { id: 'ach_combo_30', title: 'On Fire', description: 'Reach a 30 combo multiplier.', category: 'combo', target: 30, current: 0, rewardCoins: 200, rewardDiamonds: 2, unlocked: false, unlockedAt: null },
  { id: 'ach_combo_50', title: 'Lightning Speed', description: 'Reach a 50 combo multiplier.', category: 'combo', target: 50, current: 0, rewardCoins: 500, rewardDiamonds: 5, unlocked: false, unlockedAt: null },
  { id: 'ach_combo_100', title: 'Untouchable', description: 'Reach a 100 combo multiplier.', category: 'combo', target: 100, current: 0, rewardCoins: 1500, rewardDiamonds: 15, unlocked: false, unlockedAt: null },

  { id: 'ach_coins_500', title: 'Pence Saver', description: 'Earn 500 coins total.', category: 'coins', target: 500, current: 0, rewardCoins: 100, rewardDiamonds: 1, unlocked: false, unlockedAt: null },
  { id: 'ach_coins_5000', title: 'Gold Hoarder', description: 'Earn 5,000 coins total.', category: 'coins', target: 5000, current: 0, rewardCoins: 500, rewardDiamonds: 5, unlocked: false, unlockedAt: null },
  { id: 'ach_coins_25000', title: 'Wealthy Merchant', description: 'Earn 25,000 coins total.', category: 'coins', target: 25000, current: 0, rewardCoins: 2000, rewardDiamonds: 25, unlocked: false, unlockedAt: null },

  { id: 'ach_chests_5', title: 'Curiosity', description: 'Open 5 Mystery Chests.', category: 'chests', target: 5, current: 0, rewardCoins: 200, rewardDiamonds: 2, unlocked: false, unlockedAt: null },
  { id: 'ach_chests_20', title: 'Treasure Hunter', description: 'Open 20 Mystery Chests.', category: 'chests', target: 20, current: 0, rewardCoins: 800, rewardDiamonds: 8, unlocked: false, unlockedAt: null },

  { id: 'ach_level_5', title: 'Rising Star', description: 'Reach Level 5.', category: 'level', target: 5, current: 1, rewardCoins: 100, rewardDiamonds: 1, unlocked: false, unlockedAt: null },
  { id: 'ach_level_15', title: 'Veteran Woodman', description: 'Reach Level 15.', category: 'level', target: 15, current: 1, rewardCoins: 500, rewardDiamonds: 5, unlocked: false, unlockedAt: null },
  { id: 'ach_level_30', title: 'Master of Chopping', description: 'Reach Level 30.', category: 'level', target: 30, current: 1, rewardCoins: 1500, rewardDiamonds: 15, unlocked: false, unlockedAt: null },
];

const DEFAULT_MISSIONS: GameMission[] = [
  { id: 'mis_d_chop_300', title: 'Chop 300 blocks today', type: 'daily', target: 300, current: 0, rewardCoins: 100, rewardDiamonds: 1, claimed: false },
  { id: 'mis_d_combo_30', title: 'Get a 30 combo', type: 'daily', target: 30, current: 0, rewardCoins: 100, rewardDiamonds: 1, claimed: false },
  { id: 'mis_d_coins_100', title: 'Collect 100 coins in games', type: 'daily', target: 100, current: 0, rewardCoins: 100, rewardDiamonds: 1, claimed: false },
  { id: 'mis_d_play_3', title: 'Play 3 game matches', type: 'daily', target: 3, current: 0, rewardCoins: 100, rewardDiamonds: 1, claimed: false },

  { id: 'mis_w_chop_3000', title: 'Chop 3,000 blocks this week', type: 'weekly', target: 3000, current: 0, rewardCoins: 600, rewardDiamonds: 5, claimed: false },
  { id: 'mis_w_score_1000', title: 'Reach 1,000 high score', type: 'weekly', target: 1000, current: 0, rewardCoins: 500, rewardDiamonds: 4, claimed: false },
  { id: 'mis_w_chests_3', title: 'Open 3 shop chests', type: 'weekly', target: 3, current: 0, rewardCoins: 400, rewardDiamonds: 3, claimed: false },
  { id: 'mis_w_gold_2000', title: 'Collect 2,000 coins in games', type: 'weekly', target: 2000, current: 0, rewardCoins: 600, rewardDiamonds: 6, claimed: false },

  { id: 'mis_l_chop_10k', title: 'Chop 10,000 blocks total', type: 'legendary', target: 10000, current: 0, rewardCoins: 2000, rewardDiamonds: 20, claimed: false },
  { id: 'mis_l_combo_80', title: 'Reach an 80x Combo', type: 'legendary', target: 80, current: 0, rewardCoins: 1500, rewardDiamonds: 15, claimed: false },
  { id: 'mis_l_level_20', title: 'Achieve Player Level 20', type: 'legendary', target: 20, current: 1, rewardCoins: 2500, rewardDiamonds: 25, claimed: false },
];

const SEED_LEADERBOARD: LeaderboardEntry[] = [];

// Cookie helper functions
export const setCookie = (name: string, value: string, days = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

export const getCookie = (name: string): string | null => {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export interface CloudRegistryEntry {
  username: string;
  passcode: string;
  userProfile: UserProfile;
  shop: ShopItem[];
  achievements: Achievement[];
  missions: GameMission[];
  settings: any;
  telemetry: any[];
}

class LocalStorageDB {
  private prefix = 'infinite_chop_';
  private syncTimeout: any = null;
  private currentSyncPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.initDatabase();
    this.fetchAndStoreLocation();
  }

  public async isUsernameRegistered(username: string): Promise<boolean> {
    const cleanName = username.trim();
    if (!cleanName) return false;
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanName)
      .maybeSingle();
    return !!data;
  }

  public async registerUser(username: string, passcode: string): Promise<{ success: boolean; error?: string }> {
    const cleanName = username.trim();
    if (cleanName.toLowerCase() === ADMIN_CONFIG.username.toLowerCase()) {
      if (passcode !== ADMIN_CONFIG.passcode) {
        return { success: false, error: 'Incorrect admin passcode. Access denied.' };
      }
    }

    const isTaken = await this.isUsernameRegistered(cleanName);
    if (isTaken) {
      return { success: false, error: 'Username is already taken! Choose another.' };
    }

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: `${cleanName.toLowerCase()}@infinitechop.com`,
      password: passcode
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Registration failed.' };
    }

    const defaultUser: UserProfile = {
      username: cleanName,
      isGuest: false,
      isBanned: false,
      level: 1,
      xp: 0,
      xpNeeded: 100,
      highScore: 0,
      maxCombo: 0,
      coins: 100,
      diamonds: 0,
      tickets: 0,
      equippedCharacter: 'char_lumberjack',
      equippedWeapon: 'weap_axe_wood',
      equippedTrail: 'trail_none',
      equippedTitle: 'title_none',
      equippedBadge: 'Chop Icon',
      equippedFrame: 'Standard',
      lastDailyClaim: null,
      stats: {
        totalChops: 0,
        totalChestsOpened: 0,
        gamesPlayed: 0,
        totalCoinsEarned: 100,
        totalDiamondsEarned: 0,
        timePlayed: 0,
        worldRuns: { 'Pine Forest': 0 }
      },
      hasPremiumPass: false,
      claimedFreeTiers: [],
      claimedPremiumTiers: []
    };

    const defaultSettings = {
      sfxVolume: 0.6,
      musicVolume: 0.4,
      masterVolume: 0.5,
      muted: false,
      graphics: 'high',
      keyLeft: 'ArrowLeft',
      keyRight: 'ArrowRight',
      keyLeftAlt: 'a',
      keyRightAlt: 'd',
      characterStyle: 'pixel',
    };

    const defaultTelemetry = [
      { timestamp: new Date().toISOString(), type: 'system', message: `Registered profile: ${cleanName}` }
    ];

    const { error: insertError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: cleanName,
      is_banned: false,
      level: 1,
      xp: 0,
      xp_needed: 100,
      highscore: 0,
      max_combo: 0,
      coins: 100,
      diamonds: 0,
      tickets: 0,
      equipped_character: 'char_lumberjack',
      equipped_weapon: 'weap_axe_wood',
      equipped_trail: 'trail_none',
      equipped_title: 'title_none',
      equipped_badge: 'Chop Icon',
      equipped_frame: 'Standard',
      last_daily_claim: null,
      has_premium_pass: false,
      claimed_free_tiers: [],
      claimed_premium_tiers: [],
      stats_data: defaultUser.stats,
      shop_data: DEFAULT_SHOP_ITEMS,
      achievements_data: DEFAULT_ACHIEVEMENTS,
      missions_data: DEFAULT_MISSIONS,
      settings_data: defaultSettings,
      telemetry_data: defaultTelemetry
    });

    if (insertError) {
      console.error('Error inserting profile:', insertError);
      return { success: false, error: insertError.message };
    }

    localStorage.setItem(this.key('user'), JSON.stringify(defaultUser));
    localStorage.setItem(this.key('last_synced_coins'), defaultUser.coins.toString());
    localStorage.setItem(this.key('last_synced_diamonds'), defaultUser.diamonds.toString());
    localStorage.setItem(this.key('last_synced_tickets'), (defaultUser.tickets || 0).toString());
    localStorage.setItem(this.key('shop'), JSON.stringify(DEFAULT_SHOP_ITEMS));
    localStorage.setItem(this.key('achievements'), JSON.stringify(DEFAULT_ACHIEVEMENTS));
    localStorage.setItem(this.key('missions'), JSON.stringify(DEFAULT_MISSIONS));
    localStorage.setItem(this.key('settings'), JSON.stringify(defaultSettings));
    localStorage.setItem(this.key('telemetry'), JSON.stringify(defaultTelemetry));

    setCookie('infinite_chop_username', cleanName, 30);
    localStorage.setItem('infinite_chop_logged_username', cleanName);
    sessionStorage.setItem('infinite_chop_logged_username', cleanName);
    localStorage.setItem('infinite_chop_logged_passcode', passcode);
    sessionStorage.setItem('infinite_chop_logged_passcode', passcode);

    this.logTelemetry('auth', `User registered successfully: ${cleanName}`);
    return { success: true };
  }

  public async loginUser(username: string, passcode: string): Promise<{ success: boolean; error?: string }> {
    const cleanName = username.trim();
    if (cleanName.toLowerCase() === ADMIN_CONFIG.username.toLowerCase()) {
      if (passcode !== ADMIN_CONFIG.passcode) {
        return { success: false, error: 'Incorrect admin passcode. Access denied.' };
      }
    }

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: `${cleanName.toLowerCase()}@infinitechop.com`,
      password: passcode
    });

    if (signInError) {
      return { success: false, error: signInError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { success: false, error: profileError?.message || 'Profile record not found.' };
    }

    if (profile.is_banned) {
      return { success: false, error: 'This account has been banned due to security violations.' };
    }

    const userProfile: UserProfile = {
      username: profile.username,
      isGuest: false,
      isBanned: profile.is_banned,
      level: profile.level,
      xp: profile.xp,
      xpNeeded: profile.xp_needed,
      highScore: profile.highscore,
      maxCombo: profile.max_combo,
      coins: profile.coins,
      diamonds: profile.diamonds,
      tickets: profile.tickets || 0,
      equippedCharacter: profile.equipped_character,
      equippedWeapon: profile.equipped_weapon,
      equippedTrail: profile.equipped_trail,
      equippedTitle: profile.equipped_title,
      equippedBadge: profile.equipped_badge || 'Chop Icon',
      equippedFrame: profile.equipped_frame || 'Standard',
      lastDailyClaim: profile.last_daily_claim,
      hasPremiumPass: profile.has_premium_pass,
      claimedFreeTiers: profile.claimed_free_tiers || [],
      claimedPremiumTiers: profile.claimed_premium_tiers || [],
      stats: profile.stats_data || {
        totalChops: 0,
        totalChestsOpened: 0,
        gamesPlayed: 0,
        totalCoinsEarned: profile.coins,
        totalDiamondsEarned: profile.diamonds,
        timePlayed: 0,
        worldRuns: { 'Pine Forest': 0 }
      }
    };

    localStorage.setItem(this.key('user'), JSON.stringify(userProfile));
    localStorage.setItem(this.key('last_synced_coins'), profile.coins.toString());
    localStorage.setItem(this.key('last_synced_diamonds'), profile.diamonds.toString());
    localStorage.setItem(this.key('last_synced_tickets'), (profile.tickets || 0).toString());
    localStorage.setItem('infinite_chop_last_pushed_coins', profile.coins.toString());
    localStorage.setItem('infinite_chop_last_pushed_diamonds', profile.diamonds.toString());
    localStorage.setItem('infinite_chop_last_pushed_tickets', (profile.tickets || 0).toString());
    if (profile.shop_data) localStorage.setItem(this.key('shop'), JSON.stringify(profile.shop_data));
    if (profile.achievements_data) localStorage.setItem(this.key('achievements'), JSON.stringify(profile.achievements_data));
    if (profile.missions_data) localStorage.setItem(this.key('missions'), JSON.stringify(profile.missions_data));
    if (profile.settings_data) localStorage.setItem(this.key('settings'), JSON.stringify(profile.settings_data));
    if (profile.telemetry_data) localStorage.setItem(this.key('telemetry'), JSON.stringify(profile.telemetry_data));

    setCookie('infinite_chop_username', cleanName, 30);
    localStorage.setItem('infinite_chop_logged_username', cleanName);
    sessionStorage.setItem('infinite_chop_logged_username', cleanName);
    localStorage.setItem('infinite_chop_logged_passcode', passcode);
    sessionStorage.setItem('infinite_chop_logged_passcode', passcode);

    this.logTelemetry('auth', `User logged in successfully: ${cleanName}`);
    return { success: true };
  }

  public logoutUser() {
    const user = this.getUser();
    this.logTelemetry('auth', `User logged out: ${user.username}`);

    deleteCookie('infinite_chop_username');
    localStorage.removeItem('infinite_chop_logged_username');
    sessionStorage.removeItem('infinite_chop_logged_username');
    localStorage.removeItem('infinite_chop_logged_passcode');
    sessionStorage.removeItem('infinite_chop_logged_passcode');

    supabase.auth.signOut().catch(err => console.error("Error signing out from Supabase:", err));

    const defaultUser: UserProfile = {
      username: 'WoodChopper_' + Math.floor(1000 + Math.random() * 9000),
      isGuest: true,
      isBanned: false,
      level: 1,
      xp: 0,
      xpNeeded: 100,
      highScore: 0,
      maxCombo: 0,
      coins: 100,
      diamonds: 0,
      equippedCharacter: 'char_lumberjack',
      equippedWeapon: 'weap_axe_wood',
      equippedTrail: 'trail_none',
      equippedTitle: 'title_none',
      equippedBadge: 'Chop Icon',
      equippedFrame: 'Standard',
      lastDailyClaim: null,
      stats: {
        totalChops: 0,
        totalChestsOpened: 0,
        gamesPlayed: 0,
        totalCoinsEarned: 100,
        totalDiamondsEarned: 0,
        timePlayed: 0,
        worldRuns: { 'Pine Forest': 0 }
      },
      hasPremiumPass: false,
      claimedFreeTiers: [],
      claimedPremiumTiers: []
    };

    localStorage.setItem(this.key('user'), JSON.stringify(defaultUser));
    localStorage.setItem(this.key('shop'), JSON.stringify(DEFAULT_SHOP_ITEMS));
    localStorage.setItem(this.key('achievements'), JSON.stringify(DEFAULT_ACHIEVEMENTS));
    localStorage.setItem(this.key('missions'), JSON.stringify(DEFAULT_MISSIONS));
  }

  public syncActiveProfileToCloud(oldUsername?: string, force = false): Promise<void> {
    const user = this.getUser();
    if (user.isGuest) return Promise.resolve();

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    if (force) {
      this.currentSyncPromise = this.currentSyncPromise
        .then(() => this.doSyncActiveProfileToCloud(oldUsername))
        .catch((err) => {
          console.error("Sync error:", err);
        });
      return this.currentSyncPromise;
    }

    return new Promise<void>((resolve) => {
      this.syncTimeout = setTimeout(() => {
        this.currentSyncPromise = this.currentSyncPromise
          .then(() => this.doSyncActiveProfileToCloud(oldUsername))
          .then(resolve)
          .catch((err) => {
            console.error("Sync error:", err);
            resolve();
          });
      }, 150);
    });
  }

  private async doSyncActiveProfileToCloud(oldUsername?: string) {
    const user = this.getUser();
    if (user.isGuest) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;

    localStorage.setItem('infinite_chop_sync_in_progress', 'true');

    try {
      // Fetch latest profile from DB to check for admin injections/modifications
      const { data: dbProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('coins, diamonds, tickets, is_banned')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!fetchError && !dbProfile) {
        // User was deleted from DB, logout immediately!
        this.logoutUser();
        localStorage.setItem('infinite_chop_sync_in_progress', 'false');
        window.location.reload();
        return;
      }

      if (dbProfile) {
        // Check if user has been banned by admin
        if (dbProfile.is_banned && !user.isBanned) {
          user.isBanned = true;
          localStorage.setItem(this.key('user'), JSON.stringify(user));
          this.logTelemetry('sync', `User has been banned by administrator.`);
          return; // Stop sync
        }

        // Check for coin, diamond, ticket changes from admin
        const dbCoins = dbProfile.coins ?? 0;
        const dbDiamonds = dbProfile.diamonds ?? 0;
        const dbTickets = dbProfile.tickets ?? 0;

        const lastSyncedCoins = Number(localStorage.getItem(this.key('last_synced_coins')) ?? user.coins);
        const lastSyncedDiamonds = Number(localStorage.getItem(this.key('last_synced_diamonds')) ?? user.diamonds);
        const lastSyncedTickets = Number(localStorage.getItem(this.key('last_synced_tickets')) ?? (user.tickets || 0));

        const coinDelta = dbCoins - lastSyncedCoins;
        const diamondDelta = dbDiamonds - lastSyncedDiamonds;
        const ticketDelta = dbTickets - lastSyncedTickets;

        let merged = false;
        if (coinDelta !== 0) {
          user.coins = Math.max(0, user.coins + coinDelta);
          user.stats.totalCoinsEarned = Math.max(0, (user.stats.totalCoinsEarned || 0) + coinDelta);
          merged = true;
        }
        if (diamondDelta !== 0) {
          user.diamonds = Math.max(0, user.diamonds + diamondDelta);
          user.stats.totalDiamondsEarned = Math.max(0, (user.stats.totalDiamondsEarned || 0) + diamondDelta);
          merged = true;
        }
        if (ticketDelta !== 0) {
          user.tickets = Math.max(0, (user.tickets || 0) + ticketDelta);
          merged = true;
        }

        if (merged) {
          localStorage.setItem(this.key('user'), JSON.stringify(user));
          this.logTelemetry('sync', `Admin adjustments detected and merged: Coins(${coinDelta}), Diamonds(${diamondDelta}), Tickets(${ticketDelta})`);
        }
      }

      const updates = {
        username: user.username,
        highscore: user.highScore,
        max_combo: user.maxCombo,
        coins: user.coins,
        diamonds: user.diamonds,
        tickets: user.tickets || 0,
        level: user.level,
        xp: user.xp,
        xp_needed: user.xpNeeded,
        equipped_character: user.equippedCharacter,
        equipped_weapon: user.equippedWeapon,
        equipped_trail: user.equippedTrail,
        equipped_title: user.equippedTitle,
        equipped_badge: user.equippedBadge,
        equipped_frame: user.equippedFrame,
        last_daily_claim: user.lastDailyClaim,
        has_premium_pass: user.hasPremiumPass,
        claimed_free_tiers: user.claimedFreeTiers || [],
        claimed_premium_tiers: user.claimedPremiumTiers || [],
        stats_data: user.stats,
        shop_data: this.getShop(),
        achievements_data: this.getAchievements(),
        missions_data: this.getMissions(),
        settings_data: this.getSettings(),
        telemetry_data: this.getTelemetry()
      };

      localStorage.setItem('infinite_chop_last_pushed_coins', updates.coins.toString());
      localStorage.setItem('infinite_chop_last_pushed_diamonds', updates.diamonds.toString());
      localStorage.setItem('infinite_chop_last_pushed_tickets', updates.tickets.toString());

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) {
        console.error('Error syncing profile to Supabase:', error);
      } else {
        localStorage.setItem(this.key('last_synced_coins'), user.coins.toString());
        localStorage.setItem(this.key('last_synced_diamonds'), user.diamonds.toString());
        localStorage.setItem(this.key('last_synced_tickets'), (user.tickets || 0).toString());
        localStorage.setItem('infinite_chop_last_pushed_coins', user.coins.toString());
        localStorage.setItem('infinite_chop_last_pushed_diamonds', user.diamonds.toString());
        localStorage.setItem('infinite_chop_last_pushed_tickets', (user.tickets || 0).toString());
        this.logTelemetry('sync', `Successfully synced game state to cloud.`);
      }
    } finally {
      localStorage.setItem('infinite_chop_sync_in_progress', 'false');
    }
  }

  public async restoreSessionFromCloud(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && !profile) {
        // User was deleted from DB, logout immediately!
        this.logoutUser();
        return false;
      }

      if (profile) {
        const userProfile: UserProfile = {
          username: profile.username,
          isGuest: false,
          isBanned: profile.is_banned,
          level: profile.level,
          xp: profile.xp,
          xpNeeded: profile.xp_needed,
          highScore: profile.highscore,
          maxCombo: profile.max_combo,
          coins: profile.coins,
          diamonds: profile.diamonds,
          tickets: profile.tickets || 0,
          equippedCharacter: profile.equipped_character,
          equippedWeapon: profile.equipped_weapon,
          equippedTrail: profile.equipped_trail,
          equippedTitle: profile.equipped_title,
          equippedBadge: profile.equipped_badge || 'Chop Icon',
          equippedFrame: profile.equipped_frame || 'Standard',
          lastDailyClaim: profile.last_daily_claim,
          hasPremiumPass: profile.has_premium_pass,
          claimedFreeTiers: profile.claimed_free_tiers || [],
          claimedPremiumTiers: profile.claimed_premium_tiers || [],
          stats: profile.stats_data || {
            totalChops: 0,
            totalChestsOpened: 0,
            gamesPlayed: 0,
            totalCoinsEarned: profile.coins,
            totalDiamondsEarned: profile.diamonds,
            timePlayed: 0,
            worldRuns: { 'Pine Forest': 0 }
          }
        };

        localStorage.setItem(this.key('user'), JSON.stringify(userProfile));
        localStorage.setItem(this.key('last_synced_coins'), profile.coins.toString());
        localStorage.setItem(this.key('last_synced_diamonds'), profile.diamonds.toString());
        localStorage.setItem(this.key('last_synced_tickets'), (profile.tickets || 0).toString());
        localStorage.setItem('infinite_chop_last_pushed_coins', profile.coins.toString());
        localStorage.setItem('infinite_chop_last_pushed_diamonds', profile.diamonds.toString());
        localStorage.setItem('infinite_chop_last_pushed_tickets', (profile.tickets || 0).toString());
        if (profile.shop_data) localStorage.setItem(this.key('shop'), JSON.stringify(profile.shop_data));
        if (profile.achievements_data) localStorage.setItem(this.key('achievements'), JSON.stringify(profile.achievements_data));
        if (profile.missions_data) localStorage.setItem(this.key('missions'), JSON.stringify(profile.missions_data));
        if (profile.settings_data) localStorage.setItem(this.key('settings'), JSON.stringify(profile.settings_data));
        if (profile.telemetry_data) localStorage.setItem(this.key('telemetry'), JSON.stringify(profile.telemetry_data));

        localStorage.setItem('infinite_chop_logged_username', profile.username);
        sessionStorage.setItem('infinite_chop_logged_username', profile.username);
        setCookie('infinite_chop_username', profile.username, 30);
        return true;
      }
    }
    return false;
  }

  private initDatabase() {
    // Supabase Reset Sweep to clear out legacy mock registries & test data
    const hasSupabaseReset = localStorage.getItem('infinite_chop_supabase_reset_v1') || sessionStorage.getItem('infinite_chop_supabase_reset_v1');
    if (!hasSupabaseReset) {
      localStorage.removeItem('infinite_chop_cloud_registry');
      sessionStorage.removeItem('infinite_chop_cloud_registry');
      localStorage.removeItem(this.key('user'));
      localStorage.removeItem(this.key('shop'));
      localStorage.removeItem(this.key('achievements'));
      localStorage.removeItem(this.key('missions'));
      localStorage.removeItem(this.key('leaderboard'));
      localStorage.removeItem(this.key('settings'));
      localStorage.removeItem(this.key('telemetry'));
      localStorage.removeItem('infinite_chop_logged_username');
      sessionStorage.removeItem('infinite_chop_logged_username');
      localStorage.removeItem('infinite_chop_logged_passcode');
      sessionStorage.removeItem('infinite_chop_logged_passcode');
      deleteCookie('infinite_chop_username');

      localStorage.setItem('infinite_chop_supabase_reset_v1', 'true');
      sessionStorage.setItem('infinite_chop_supabase_reset_v1', 'true');
    }

    // Sync logged username/passcode from sessionStorage fallback if localStorage was wiped on reload
    let savedName = getCookie('infinite_chop_username') || localStorage.getItem('infinite_chop_logged_username');
    if (!savedName) {
      savedName = sessionStorage.getItem('infinite_chop_logged_username');
      if (savedName) {
        localStorage.setItem('infinite_chop_logged_username', savedName);
        setCookie('infinite_chop_username', savedName, 30);
      }
    }

    // Check if db already initialized
    if (!localStorage.getItem(this.key('user'))) {
      const defaultUser: UserProfile = {
        username: 'WoodChopper_' + Math.floor(1000 + Math.random() * 9000),
        isGuest: true,
        isBanned: false,
        level: 1,
        xp: 0,
        xpNeeded: 100,
        highScore: 0,
        maxCombo: 0,
        coins: 100,
        diamonds: 0,
        tickets: 0,
        equippedCharacter: 'char_lumberjack',
        equippedWeapon: 'weap_axe_wood',
        equippedTrail: 'trail_none',
        equippedTitle: 'title_none',
        equippedBadge: 'Chop Icon',
        equippedFrame: 'Standard',
        lastDailyClaim: null,
        stats: {
          totalChops: 0,
          totalChestsOpened: 0,
          gamesPlayed: 0,
          totalCoinsEarned: 100,
          totalDiamondsEarned: 0,
          timePlayed: 0,
          worldRuns: { 'Pine Forest': 0 }
        },
        hasPremiumPass: false,
        claimedFreeTiers: [],
        claimedPremiumTiers: []
      };
      
      localStorage.setItem(this.key('user'), JSON.stringify(defaultUser));
      localStorage.setItem(this.key('shop'), JSON.stringify(DEFAULT_SHOP_ITEMS));
      localStorage.setItem(this.key('achievements'), JSON.stringify(DEFAULT_ACHIEVEMENTS));
      localStorage.setItem(this.key('missions'), JSON.stringify(DEFAULT_MISSIONS));
      localStorage.setItem(this.key('settings'), JSON.stringify({
        sfxVolume: 0.6,
        musicVolume: 0.4,
        masterVolume: 0.5,
        muted: false,
        graphics: 'high',
        keyLeft: 'ArrowLeft',
        keyRight: 'ArrowRight',
        keyLeftAlt: 'a',
        keyRightAlt: 'd',
        characterStyle: 'pixel',
      }));
      localStorage.setItem(this.key('telemetry'), JSON.stringify([
        { timestamp: new Date().toISOString(), type: 'system', message: 'Database initialized successfully.' }
      ]));
    }
  }

  private key(name: string): string {
    return this.prefix + name;
  }

  // --- Getters ---

  public getUser(): UserProfile {
    return JSON.parse(localStorage.getItem(this.key('user'))!);
  }

  public getShop(): ShopItem[] {
    const raw = localStorage.getItem(this.key('shop'));
    if (!raw) return DEFAULT_SHOP_ITEMS;
    try {
      const stored = JSON.parse(raw) as ShopItem[];
      let changed = false;
      const merged = stored.map(item => {
        const defItem = DEFAULT_SHOP_ITEMS.find(def => def.id === item.id);
        if (defItem) {
          if (item.name !== defItem.name || item.description !== defItem.description) {
            item.name = defItem.name;
            item.description = defItem.description;
            changed = true;
          }
        }
        return item;
      });
      DEFAULT_SHOP_ITEMS.forEach(defItem => {
        if (!merged.some(item => item.id === defItem.id)) {
          merged.push(defItem);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(this.key('shop'), JSON.stringify(merged));
      }
      return merged;
    } catch (e) {
      return DEFAULT_SHOP_ITEMS;
    }
  }

  public getAchievements(): Achievement[] {
    return JSON.parse(localStorage.getItem(this.key('achievements'))!);
  }

  public checkAndRegenerateDailyMissions() {
    const today = new Date().toDateString();
    const lastRegen = localStorage.getItem(this.key('last_missions_regen'));
    
    if (lastRegen !== today) {
      this.regenerateDailyMissions();
      localStorage.setItem(this.key('last_missions_regen'), today);
    }
  }

  public regenerateDailyMissions() {
    const maps = ['Pine Forest', 'Metro Heights', 'Glacial Spires', 'Vector Core', 'Magma Core', 'Autumn Canopy', 'Sand Dune Oasis', 'Haunted Graveyard', 'Space Station', 'Toxic Wasteland', 'Steampunk Workshop', 'Candy Land'];
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    
    const chopTarget = Math.floor(150 + Math.random() * 250); // 150 to 400
    const comboTarget = Math.floor(15 + Math.random() * 35);  // 15 to 50
    const coinTarget = Math.floor(50 + Math.random() * 150);  // 50 to 200
    const playTarget = Math.floor(2 + Math.random() * 3);     // 2 to 5

    const dailyMissions: GameMission[] = [
      {
        id: `mis_d_chop_${chopTarget}`,
        title: `Chop ${chopTarget} blocks on ${randomMap}`,
        type: 'daily',
        target: chopTarget,
        current: 0,
        rewardCoins: Math.floor(100 + Math.random() * 100),
        rewardDiamonds: Math.random() < 0.5 ? 1 : 2,
        claimed: false,
        requiredMap: randomMap
      },
      {
        id: `mis_d_combo_${comboTarget}`,
        title: `Get a ${comboTarget} combo multiplier`,
        type: 'daily',
        target: comboTarget,
        current: 0,
        rewardCoins: Math.floor(80 + Math.random() * 120),
        rewardDiamonds: Math.random() < 0.3 ? 1 : 2,
        claimed: false
      },
      {
        id: `mis_d_coins_${coinTarget}`,
        title: `Collect ${coinTarget} coins in single or multiple games`,
        type: 'daily',
        target: coinTarget,
        current: 0,
        rewardCoins: Math.floor(100 + Math.random() * 100),
        rewardDiamonds: Math.random() < 0.5 ? 1 : 2,
        claimed: false
      },
      {
        id: `mis_d_play_${playTarget}`,
        title: `Play ${playTarget} game matches on any sector`,
        type: 'daily',
        target: playTarget,
        current: 0,
        rewardCoins: Math.floor(70 + Math.random() * 80),
        rewardDiamonds: 1,
        claimed: false
      }
    ];

    const currentMissions = JSON.parse(localStorage.getItem(this.key('missions')) || '[]');
    const weeklyMissions = currentMissions.filter((m: any) => m.type === 'weekly');
    const finalWeeklyMissions = weeklyMissions.length > 0 ? weeklyMissions : [
      { id: 'mis_w_chop_3000', title: 'Chop 3,000 blocks this week', type: 'weekly', target: 3000, current: 0, rewardCoins: 600, rewardDiamonds: 5, claimed: false },
      { id: 'mis_w_score_1000', title: 'Reach 1,000 high score', type: 'weekly', target: 1000, current: 0, rewardCoins: 500, rewardDiamonds: 4, claimed: false },
      { id: 'mis_w_chests_3', title: 'Open 3 shop chests', type: 'weekly', target: 3, current: 0, rewardCoins: 400, rewardDiamonds: 3, claimed: false },
      { id: 'mis_w_gold_2000', title: 'Collect 2,000 coins in games', type: 'weekly', target: 2000, current: 0, rewardCoins: 600, rewardDiamonds: 6, claimed: false },
    ];

    const legendaryMissions = currentMissions.filter((m: any) => m.type === 'legendary');
    const finalLegendaryMissions = legendaryMissions.length > 0 ? legendaryMissions : [
      { id: 'mis_l_chop_10k', title: 'Chop 10,000 blocks total', type: 'legendary', target: 10000, current: 0, rewardCoins: 2000, rewardDiamonds: 20, claimed: false },
      { id: 'mis_l_combo_80', title: 'Reach an 80x Combo', type: 'legendary', target: 80, current: 0, rewardCoins: 1500, rewardDiamonds: 15, claimed: false },
      { id: 'mis_l_level_20', title: 'Achieve Player Level 20', type: 'legendary', target: 20, current: 1, rewardCoins: 2500, rewardDiamonds: 25, claimed: false },
    ];

    const allMissions = [...dailyMissions, ...finalWeeklyMissions, ...finalLegendaryMissions];
    localStorage.setItem(this.key('missions'), JSON.stringify(allMissions));
  }

  public getMissions(): GameMission[] {
    this.checkAndRegenerateDailyMissions();
    return JSON.parse(localStorage.getItem(this.key('missions'))!);
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, highscore, max_combo, coins, equipped_character, equipped_title, equipped_frame, stats_data, is_banned')
      .eq('is_banned', false)
      .order('highscore', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    const indianCities = [
      'Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 
      'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Ahmedabad', 
      'Jaipur', 'Lucknow', 'Indore', 'Bhopal', 'Nagpur', 
      'Chandigarh', 'Kochi', 'Coimbatore', 'Surat', 'Patna'
    ];

    return (data || []).map(p => {
      const stats = p.stats_data || {};
      const totalCoinsEarned = stats.totalCoinsEarned || p.coins || 0;
      
      let city = 'Mumbai';
      let countryCode = 'IN';

      if (stats.location && stats.location.city && stats.location.countryCode) {
        city = stats.location.city;
        countryCode = stats.location.countryCode;
      } else {
        const charCodeSum = p.username.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        city = indianCities[charCodeSum % indianCities.length];
        countryCode = 'IN';
      }

      return {
        username: p.username,
        country: countryCode,
        score: p.highscore || 0,
        maxCombo: p.max_combo || 0,
        coins: totalCoinsEarned,
        avatar: p.equipped_character || 'char_lumberjack',
        title: p.equipped_title || 'Chop Cadet',
        frame: p.equipped_frame || 'Standard',
        city: city
      };
    });
  }

  public getSettings() {
    const raw = localStorage.getItem(this.key('settings'));
    if (!raw) {
      return {
        sfxVolume: 0.6,
        musicVolume: 0.4,
        masterVolume: 0.5,
        muted: false,
        graphics: 'high',
        keyLeft: 'ArrowLeft',
        keyRight: 'ArrowRight',
        keyLeftAlt: 'a',
        keyRightAlt: 'd',
        characterStyle: 'pixel'
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed.characterStyle) {
      parsed.characterStyle = 'pixel';
    }
    return parsed;
  }

  public getTelemetry(): any[] {
    return JSON.parse(localStorage.getItem(this.key('telemetry')) || '[]');
  }

  // --- Setters ---

  public saveUser(user: UserProfile) {
    localStorage.setItem(this.key('user'), JSON.stringify(user));
    this.syncActiveProfileToCloud();
  }

  public saveShop(shop: ShopItem[]) {
    localStorage.setItem(this.key('shop'), JSON.stringify(shop));
    this.syncActiveProfileToCloud();
  }

  public saveAchievements(ach: Achievement[]) {
    localStorage.setItem(this.key('achievements'), JSON.stringify(ach));
    this.syncActiveProfileToCloud();
  }

  public saveMissions(mis: GameMission[]) {
    localStorage.setItem(this.key('missions'), JSON.stringify(mis));
    this.syncActiveProfileToCloud();
  }

  public saveLeaderboard(leader: LeaderboardEntry[]) {
    localStorage.setItem(this.key('leaderboard'), JSON.stringify(leader));
  }

  public saveSettings(settings: any) {
    localStorage.setItem(this.key('settings'), JSON.stringify(settings));
    this.syncActiveProfileToCloud();
  }

  public logTelemetry(type: string, message: string) {
    const logs = this.getTelemetry();
    logs.unshift({ timestamp: new Date().toISOString(), type, message });
    if (logs.length > 100) logs.pop(); // keep last 100
    localStorage.setItem(this.key('telemetry'), JSON.stringify(logs));
  }

  // --- Profile Actions ---

  public linkAccount(email: string, username: string, passcode?: string) {
    if (username.toLowerCase() === ADMIN_CONFIG.username.toLowerCase() && passcode !== ADMIN_CONFIG.passcode) {
      throw new Error('Unauthorized admin account linkage.');
    }
    const user = this.getUser();
    const oldName = user.username;
    user.isGuest = false;
    user.email = email;
    user.username = username;
    this.saveUser(user);
    this.logTelemetry('auth', `Account linked for user: ${username} (${email})`);
    this.syncPlayerToLeaderboard(oldName);
  }

  public updateUsername(newUsername: string, passcode?: string) {
    if (newUsername.toLowerCase() === ADMIN_CONFIG.username.toLowerCase() && passcode !== ADMIN_CONFIG.passcode) {
      throw new Error('Unauthorized admin username change.');
    }
    const user = this.getUser();
    const oldName = user.username;
    user.username = newUsername;
    this.saveUser(user);
    this.logTelemetry('profile', `Username changed from ${oldName} to ${newUsername}`);
    this.syncPlayerToLeaderboard(oldName);
  }

  public async isUsernameTaken(username: string): Promise<boolean> {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.some(entry => entry.username.toLowerCase() === username.toLowerCase());
  }

  public registerUserProfile(username: string, passcode?: string) {
    if (username.toLowerCase() === ADMIN_CONFIG.username.toLowerCase() && passcode !== ADMIN_CONFIG.passcode) {
      throw new Error('Unauthorized admin registration.');
    }
    const user = this.getUser();
    const oldName = user.username;
    user.username = username;
    user.isGuest = false;
    this.saveUser(user);
    this.logTelemetry('auth', `New user registered: ${username}`);
    this.syncPlayerToLeaderboard(oldName);
  }

  // --- Game Submission Transaction ---

  public submitGameSession(score: number, maxCombo: number, coinsEarned: number, diamondsEarned: number, worldName: string, timeSpentSeconds: number, ticketsEarned: number = 0) {
    const user = this.getUser();
    
    if (user.isBanned) {
      this.logTelemetry('cheat', `Banned user ${user.username} attempted score submission of ${score}`);
      return { success: false, reason: 'Banned' };
    }

    // Basic anti-cheat: verify score vs combo and ticks
    // If score is 1000 but time spent is 2 seconds, flag it!
    const chopsPerSecond = score / Math.max(1, timeSpentSeconds);
    if (score > 100 && chopsPerSecond > 15) {
      user.isBanned = true;
      this.saveUser(user);
      this.logTelemetry('cheat', `Auto-ban: User ${user.username} flagged for speed-hacking (${chopsPerSecond.toFixed(1)} chops/s).`);
      return { success: false, banned: true, reason: 'Speedhack detected' };
    }

    // 1. Update stats
    user.stats.gamesPlayed += 1;
    user.stats.totalChops += score;
    user.stats.totalCoinsEarned += coinsEarned;
    user.stats.totalDiamondsEarned += diamondsEarned;
    user.stats.timePlayed += timeSpentSeconds;
    
    if (!user.stats.worldRuns[worldName]) {
      user.stats.worldRuns[worldName] = 0;
    }
    user.stats.worldRuns[worldName] += 1;

    user.coins += coinsEarned;
    user.diamonds += diamondsEarned;
    user.tickets = (user.tickets || 0) + ticketsEarned;

    // 2. High Score / Combo
    let newHighScore = false;
    if (score > user.highScore) {
      user.highScore = score;
      newHighScore = true;
    }
    if (maxCombo > user.maxCombo) {
      user.maxCombo = maxCombo;
    }

    // Track daily and weekly scores
    const dateObj = new Date();
    const startOfYear = new Date(dateObj.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const oneJan = new Date(dateObj.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((Math.floor((dateObj.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)) + oneJan.getDay() + 1) / 7);
    const todayKey = `${dateObj.getFullYear()}-${dayOfYear}`;
    const weekKey = `${dateObj.getFullYear()}-${weekNumber}`;

    if (!user.stats.dailyScores || user.stats.lastDailyKey !== todayKey) {
      user.stats.dailyScores = { score: 0, coins: 0, combo: 0 };
      user.stats.lastDailyKey = todayKey;
    }
    if (!user.stats.weeklyScores || user.stats.lastWeeklyKey !== weekKey) {
      user.stats.weeklyScores = { score: 0, coins: 0, combo: 0 };
      user.stats.lastWeeklyKey = weekKey;
    }

    if (score > user.stats.dailyScores.score) user.stats.dailyScores.score = score;
    if (coinsEarned > user.stats.dailyScores.coins) user.stats.dailyScores.coins = coinsEarned;
    if (maxCombo > user.stats.dailyScores.combo) user.stats.dailyScores.combo = maxCombo;

    if (score > user.stats.weeklyScores.score) user.stats.weeklyScores.score = score;
    if (coinsEarned > user.stats.weeklyScores.coins) user.stats.weeklyScores.coins = coinsEarned;
    if (maxCombo > user.stats.weeklyScores.combo) user.stats.weeklyScores.combo = maxCombo;

    // 3. XP Leveling (1 chop = 1 XP, survival time boosts XP)
    const xpEarned = score + Math.floor(timeSpentSeconds * 2);
    user.xp += xpEarned;
    let levelsGained = 0;
    while (user.xp >= user.xpNeeded) {
      user.xp -= user.xpNeeded;
      user.level += 1;
      levelsGained += 1;
      user.xpNeeded = Math.floor(user.xpNeeded * 1.5); // level progression curve
    }

    this.saveUser(user);
    this.logTelemetry('game', `Submitted match on ${worldName}. Score: ${score}, Coins: ${coinsEarned}, XP +${xpEarned}.`);

    // 4. Update Achievements Progress
    this.updateAchievementProgress('chops', user.stats.totalChops);
    this.updateAchievementProgress('combo', user.maxCombo);
    this.updateAchievementProgress('coins', user.stats.totalCoinsEarned);
    this.updateAchievementProgress('level', user.level);
    this.updateAchievementProgress('worlds', Object.keys(user.stats.worldRuns).length);

    // 5. Update Missions Progress
    const activeMissions = this.getMissions();
    activeMissions.forEach(m => {
      if (m.claimed) return;
      if (m.type === 'daily') {
        if (m.id.startsWith('mis_d_chop')) {
          if (!m.requiredMap || m.requiredMap === worldName) {
            m.current = Math.min(m.target, m.current + score);
          }
        }
        else if (m.id.startsWith('mis_d_combo')) {
          m.current = Math.min(m.target, Math.max(m.current, maxCombo));
        }
        else if (m.id.startsWith('mis_d_coins')) {
          m.current = Math.min(m.target, m.current + coinsEarned);
        }
        else if (m.id.startsWith('mis_d_play')) {
          m.current = Math.min(m.target, m.current + 1);
        }
      } else if (m.type === 'weekly') {
        if (m.id === 'mis_w_chop_3000') {
          m.current = Math.min(m.target, m.current + score);
        } else if (m.id === 'mis_w_score_1000') {
          m.current = Math.min(m.target, Math.max(m.current, score));
        } else if (m.id === 'mis_w_gold_2000') {
          m.current = Math.min(m.target, m.current + coinsEarned);
        }
      } else if (m.type === 'legendary') {
        if (m.id === 'mis_l_chop_10k') {
          m.current = Math.min(m.target, user.stats.totalChops);
        } else if (m.id === 'mis_l_combo_80') {
          m.current = Math.min(m.target, Math.max(m.current, maxCombo));
        } else if (m.id === 'mis_l_level_20') {
          m.current = Math.min(m.target, user.level);
        }
      }
    });
    this.saveMissions(activeMissions);

    // 6. Sync to leaderboards
    this.syncPlayerToLeaderboard();

    return {
      success: true,
      newHighScore,
      levelsGained,
      xpEarned,
      currentLevel: user.level,
      currentXp: user.xp,
      xpNeeded: user.xpNeeded
    };
  }

  // --- Shop Purchase Actions ---

  public purchaseShopItem(itemId: string): { success: boolean; reason?: string } {
    const user = this.getUser();
    const shop = this.getShop();
    const item = shop.find(i => i.id === itemId);

    if (!item) return { success: false, reason: 'Item not found' };
    if (item.unlocked) return { success: false, reason: 'Already unlocked' };

    // Check cost
    if (item.currency === 'coins') {
      if (user.coins < item.cost) return { success: false, reason: 'Not enough coins' };
      user.coins -= item.cost;
    } else {
      if (user.diamonds < item.cost) return { success: false, reason: 'Not enough diamonds' };
      user.diamonds -= item.cost;
    }

    // Unlock item
    item.unlocked = true;
    this.saveShop(shop);
    this.saveUser(user);
    this.logTelemetry('shop', `Purchased ${item.name} for ${item.cost} ${item.currency}.`);
    this.syncActiveProfileToCloud();
    
    return { success: true };
  }

  public equipItem(itemId: string, itemType: 'character' | 'weapon' | 'trail' | 'title'): boolean {
    const shop = this.getShop();
    const item = shop.find(i => i.id === itemId);
    if (!item || !item.unlocked) return false;

    const user = this.getUser();
    if (itemType === 'character') user.equippedCharacter = itemId;
    else if (itemType === 'weapon') user.equippedWeapon = itemId;
    else if (itemType === 'trail') user.equippedTrail = itemId;
    else if (itemType === 'title') user.equippedTitle = item.name;
    
    this.saveUser(user);
    this.logTelemetry('inventory', `Equipped ${item.name} in ${itemType} slot.`);
    this.syncPlayerToLeaderboard();
    return true;
  }

  public equipProfileDetails(badge: string, frame: string) {
    const user = this.getUser();
    user.equippedBadge = badge;
    user.equippedFrame = frame;
    this.saveUser(user);
    this.logTelemetry('profile', `Equipped badge: ${badge}, frame: ${frame}`);
    this.syncPlayerToLeaderboard();
  }

  public openChest(chestType: 'mystery' | 'treasure' | 'epic'): { success: boolean; rewardType?: string; rewardAmount?: number; rewardItem?: ShopItem; bonusTicket?: boolean; reason?: string } {
    const user = this.getUser();
    let cost = 150;
    if (chestType === 'treasure') cost = 500;
    if (chestType === 'epic') cost = 1500;

    if (user.coins < cost) return { success: false, reason: 'Not enough coins' };
    
    user.coins -= cost;
    user.stats.totalChestsOpened += 1;
    this.updateAchievementProgress('chests', user.stats.totalChestsOpened);
    this.updateMissionProgress('mis_w_chests_3', 1);

    const rand = Math.random();
    
    if (chestType === 'mystery') {
      // 10% tickets, 75% coins, 15% diamonds
      if (rand < 0.10) {
        user.tickets = (user.tickets || 0) + 1;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened Mystery Chest: earned 1 Revive Ticket.`);
        this.syncActiveProfileToCloud();
        return { success: true, rewardType: 'tickets', rewardAmount: 1 };
      } else if (rand < 0.85) {
        const coins = Math.floor(50 + Math.random() * 250);
        user.coins += coins;
        user.stats.totalCoinsEarned += coins;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened Mystery Chest: earned ${coins} coins.`);
        this.syncActiveProfileToCloud();
        return { success: true, rewardType: 'coins', rewardAmount: coins };
      } else {
        const diamonds = Math.floor(1 + Math.random() * 4);
        user.diamonds += diamonds;
        user.stats.totalDiamondsEarned += diamonds;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened Mystery Chest: earned ${diamonds} diamonds.`);
        this.syncActiveProfileToCloud();
        return { success: true, rewardType: 'diamonds', rewardAmount: diamonds };
      }
    } else {
      const bonusTicket = Math.random() < 0.15;
      if (bonusTicket) {
        user.tickets = (user.tickets || 0) + 1;
      }

      // Unlocks cosmetic or premium items
      const shop = this.getShop();
      const lockedItems = shop.filter(item => !item.unlocked && item.id !== 'char_lumberjack' && item.id !== 'weap_axe_wood');
      
      let rewardItem: ShopItem | null = null;
      if (lockedItems.length > 0) {
        // Filter by chest weight
        let pool = lockedItems;
        if (chestType === 'epic') {
          pool = lockedItems.filter(item => item.rarity === 'epic' || item.rarity === 'legendary');
          if (pool.length === 0) pool = lockedItems; // fallback
        }
        rewardItem = pool[Math.floor(Math.random() * pool.length)];
        rewardItem.unlocked = true;
        this.saveShop(shop);
      }

      if (rewardItem) {
        this.saveUser(user);
        this.logTelemetry('chest', `Opened ${chestType} chest: unlocked ${rewardItem.name}${bonusTicket ? ' + Bonus Revive Ticket' : ''}.`);
        this.syncActiveProfileToCloud();
        return { success: true, rewardType: 'item', rewardItem, bonusTicket };
      } else {
        // Fallback if all items unlocked
        const refundCoins = chestType === 'treasure' ? 600 : 1800;
        user.coins += refundCoins;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened ${chestType} chest: all items unlocked! Refunded ${refundCoins} coins${bonusTicket ? ' + Bonus Revive Ticket' : ''}.`);
        this.syncActiveProfileToCloud();
        return { success: true, rewardType: 'coins', rewardAmount: refundCoins, bonusTicket };
      }
    }
  }

  // --- Daily Claim Reward ---

  public claimDailyReward(): { success: boolean; coins?: number; diamonds?: number; reason?: string } {
    const user = this.getUser();
    const now = new Date();
    
    if (user.lastDailyClaim) {
      const lastClaimDate = new Date(user.lastDailyClaim);
      const isSameDay = lastClaimDate.getUTCDate() === now.getUTCDate() &&
                        lastClaimDate.getUTCMonth() === now.getUTCMonth() &&
                        lastClaimDate.getUTCFullYear() === now.getUTCFullYear();
      if (isSameDay) return { success: false, reason: 'Already claimed today!' };
    }

    // Reward formula: Level * 100 coins + 2 diamonds
    const coins = user.level * 100;
    const diamonds = 2;
    
    user.coins += coins;
    user.diamonds += diamonds;
    user.stats.totalCoinsEarned += coins;
    user.stats.totalDiamondsEarned += diamonds;
    user.lastDailyClaim = now.toISOString();

    this.saveUser(user);
    this.logTelemetry('daily', `Claimed daily reward: +${coins} coins, +${diamonds} diamonds.`);
    this.syncActiveProfileToCloud();
    return { success: true, coins, diamonds };
  }

  // --- Missions Claims ---

  public claimMissionReward(missionId: string): { success: boolean; coins?: number; diamonds?: number; reason?: string } {
    const missions = this.getMissions();
    const mission = missions.find(m => m.id === missionId);

    if (!mission) return { success: false, reason: 'Mission not found' };
    if (mission.claimed) return { success: false, reason: 'Already claimed' };
    if (mission.current < mission.target) return { success: false, reason: 'Mission not completed yet' };

    const user = this.getUser();
    user.coins += mission.rewardCoins;
    user.diamonds += mission.rewardDiamonds;
    user.stats.totalCoinsEarned += mission.rewardCoins;
    user.stats.totalDiamondsEarned += mission.rewardDiamonds;

    mission.claimed = true;
    
    this.saveMissions(missions);
    this.saveUser(user);
    this.logTelemetry('mission', `Claimed reward for mission "${mission.title}": +${mission.rewardCoins} coins, +${mission.rewardDiamonds} diamonds.`);
    this.syncActiveProfileToCloud();

    return { success: true, coins: mission.rewardCoins, diamonds: mission.rewardDiamonds };
  }

  // --- Helper state increments ---

  private updateAchievementProgress(category: 'chops' | 'combo' | 'coins' | 'chests' | 'level' | 'worlds', newValue: number) {
    const achievements = this.getAchievements();
    let updated = false;

    achievements.forEach(ach => {
      if (ach.category === category && !ach.unlocked) {
        ach.current = newValue;
        if (ach.current >= ach.target) {
          ach.unlocked = true;
          ach.unlockedAt = new Date().toISOString();
          
          // Auto reward
          const user = this.getUser();
          user.coins += ach.rewardCoins;
          user.diamonds += ach.rewardDiamonds;
          user.stats.totalCoinsEarned += ach.rewardCoins;
          user.stats.totalDiamondsEarned += ach.rewardDiamonds;
          this.saveUser(user);

          this.logTelemetry('achievement', `Unlocked Achievement "${ach.title}"! Reward: +${ach.rewardCoins} coins, +${ach.rewardDiamonds} diamonds.`);
          updated = true;
        }
      }
    });

    if (updated) this.saveAchievements(achievements);
  }

  private updateMissionProgress(missionId: string, progressValue: number) {
    const missions = this.getMissions();
    const mission = missions.find(m => {
      if (m.id === missionId) return true;
      if (missionId === 'mis_d_play_3' && m.id.startsWith('mis_d_play')) return true;
      return false;
    });

    if (mission && !mission.claimed) {
      if (mission.id.startsWith('mis_d_play') || mission.id === 'mis_w_chests_3' || mission.id.startsWith('mis_d_chop') || mission.id.startsWith('mis_d_coins')) {
        // Incremental missions
        mission.current = Math.min(mission.target, mission.current + progressValue);
      } else if (mission.id.startsWith('mis_d_combo') || mission.id === 'mis_w_score_1000') {
        // High watermark missions
        mission.current = Math.min(mission.target, Math.max(mission.current, progressValue));
      } else {
        // General cumulative
        mission.current = Math.min(mission.target, mission.current + progressValue);
      }
      this.saveMissions(missions);
    }
  }

  private syncPlayerToLeaderboard(oldUsername?: string) {
    this.syncActiveProfileToCloud(oldUsername);
  }

  // --- Admin Methods ---

  public async getAllPlayers(): Promise<{ username: string; level: number; coins: number; diamonds: number; isBanned: boolean }[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, level, coins, diamonds, is_banned')
      .order('username', { ascending: true });

    if (error) {
      console.error('Error fetching all players for admin:', error);
      return [];
    }

    return (data || []).map(p => ({
      username: p.username,
      level: p.level || 1,
      coins: p.coins || 0,
      diamonds: p.diamonds || 0,
      isBanned: p.is_banned || false
    }));
  }

  public async getAdminStats() {
    const leaderboard = await this.getLeaderboard();
    const user = this.getUser();
    
    // Aggregate telemetry data for metrics
    const totalUsers = leaderboard.length;
    const activePlayersToday = leaderboard.length;
    const totalRevenueMock = leaderboard.reduce((acc, entry) => acc + (entry.coins * 0.005), 0);

    return {
      totalRegistrations: totalUsers,
      activeToday: activePlayersToday,
      totalRevenue: totalRevenueMock,
      telemetryLogs: this.getTelemetry(),
      playerBanned: user.isBanned,
    };
  }

  public async adminBanUser(targetUsername: string, ban: boolean): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: ban })
      .eq('username', targetUsername);

    if (error) {
      console.error('Error banning user:', error);
      return { success: false, error: error.message };
    }

    this.logTelemetry('admin', `Admin ${ban ? 'BANNED' : 'UNBANNED'} player ${targetUsername}`);
    
    // If the banned user is the active user, update local cache too
    const activeUser = this.getUser();
    if (activeUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      activeUser.isBanned = ban;
      localStorage.setItem(this.key('user'), JSON.stringify(activeUser));
    }

    return { success: true };
  }

  public async adminGrantCurrency(targetUsername: string, type: 'coins' | 'diamonds' | 'tickets', amount: number): Promise<{ success: boolean; error?: string }> {
    // 1. Fetch current profile values
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('coins, diamonds, tickets, stats_data')
      .eq('username', targetUsername)
      .maybeSingle();

    if (fetchError || !profile) {
      return { success: false, error: fetchError?.message || 'Player not found.' };
    }

    const currentCoins = profile.coins || 0;
    const currentDiamonds = profile.diamonds || 0;
    const currentTickets = profile.tickets || 0;
    const stats = profile.stats_data || {};
    
    let updates: any = {};
    if (type === 'coins') {
      updates.coins = currentCoins + amount;
      stats.totalCoinsEarned = (stats.totalCoinsEarned || 0) + amount;
      updates.stats_data = stats;
    } else if (type === 'diamonds') {
      updates.diamonds = currentDiamonds + amount;
      stats.totalDiamondsEarned = (stats.totalDiamondsEarned || 0) + amount;
      updates.stats_data = stats;
    } else {
      updates.tickets = currentTickets + amount;
    }

    // 2. Perform database update
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('username', targetUsername);

    if (updateError) {
      console.error('Error updating player currency:', updateError);
      return { success: false, error: updateError.message };
    }

    this.logTelemetry('admin', `Admin GRANTED ${amount} ${type} to player ${targetUsername}`);

    // If target is active user, update local cache
    const activeUser = this.getUser();
    if (activeUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      if (type === 'coins') {
        activeUser.coins = updates.coins;
        activeUser.stats.totalCoinsEarned = stats.totalCoinsEarned;
      } else if (type === 'diamonds') {
        activeUser.diamonds = updates.diamonds;
        activeUser.stats.totalDiamondsEarned = stats.totalDiamondsEarned;
      } else {
        activeUser.tickets = updates.tickets;
      }
      localStorage.setItem(this.key('user'), JSON.stringify(activeUser));
      localStorage.setItem(this.key('last_synced_coins'), activeUser.coins.toString());
      localStorage.setItem(this.key('last_synced_diamonds'), activeUser.diamonds.toString());
      localStorage.setItem(this.key('last_synced_tickets'), (activeUser.tickets || 0).toString());
    }

    return { success: true };
  }

  public async adminResetPlayerData(targetUsername: string): Promise<{ success: boolean; error?: string }> {
    const defaultStats = {
      totalChops: 0,
      totalChestsOpened: 0,
      gamesPlayed: 0,
      totalCoinsEarned: 100,
      totalDiamondsEarned: 0,
      timePlayed: 0,
      worldRuns: { 'Pine Forest': 0 }
    };

    const updates = {
      highscore: 0,
      max_combo: 0,
      coins: 100,
      diamonds: 0,
      tickets: 0,
      level: 1,
      xp: 0,
      xp_needed: 100,
      equipped_character: 'char_lumberjack',
      equipped_weapon: 'weap_axe_wood',
      equipped_trail: 'trail_none',
      equipped_title: 'title_none',
      equipped_badge: 'Chop Icon',
      equipped_frame: 'Standard',
      last_daily_claim: null,
      has_premium_pass: false,
      claimed_free_tiers: [],
      claimed_premium_tiers: [],
      stats_data: defaultStats,
      shop_data: DEFAULT_SHOP_ITEMS,
      achievements_data: DEFAULT_ACHIEVEMENTS,
      missions_data: DEFAULT_MISSIONS
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('username', targetUsername);

    if (error) {
      console.error('Error resetting player data:', error);
      return { success: false, error: error.message };
    }

    this.logTelemetry('admin', `Admin RESET stats and inventory for player ${targetUsername}`);

    // If target is active user, update local cache
    const activeUser = this.getUser();
    if (activeUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      const userProfile: UserProfile = {
        username: activeUser.username,
        isGuest: false,
        isBanned: activeUser.isBanned,
        level: 1,
        xp: 0,
        xpNeeded: 100,
        highScore: 0,
        maxCombo: 0,
        coins: 100,
        diamonds: 0,
        tickets: 0,
        equippedCharacter: 'char_lumberjack',
        equippedWeapon: 'weap_axe_wood',
        equippedTrail: 'trail_none',
        equippedTitle: 'title_none',
        equippedBadge: 'Chop Icon',
        equippedFrame: 'Standard',
        lastDailyClaim: null,
        stats: defaultStats,
        hasPremiumPass: false,
        claimedFreeTiers: [],
        claimedPremiumTiers: []
      };
      localStorage.setItem(this.key('user'), JSON.stringify(userProfile));
      localStorage.setItem(this.key('shop'), JSON.stringify(DEFAULT_SHOP_ITEMS));
      localStorage.setItem(this.key('achievements'), JSON.stringify(DEFAULT_ACHIEVEMENTS));
      localStorage.setItem(this.key('missions'), JSON.stringify(DEFAULT_MISSIONS));
    }

    return { success: true };
  }

  public async adminDeleteUserAccount(targetUsername: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.rpc('delete_user_by_admin', { target_username: targetUsername });

    if (error) {
      console.error('Error deleting player account:', error);
      return { success: false, error: error.message };
    }

    this.logTelemetry('admin', `Admin DELETED account completely for player ${targetUsername}`);

    // If target is active user, log out the current user session
    const activeUser = this.getUser();
    if (activeUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      this.logoutUser();
    }

    return { success: true };
  }

  public adminResetAllData() {
    localStorage.removeItem(this.key('user'));
    localStorage.removeItem(this.key('shop'));
    localStorage.removeItem(this.key('achievements'));
    localStorage.removeItem(this.key('missions'));
    localStorage.removeItem(this.key('leaderboard'));
    localStorage.removeItem(this.key('settings'));
    localStorage.removeItem(this.key('telemetry'));
    this.initDatabase();
    this.logTelemetry('admin', `Admin RESET all local user and database data to default seed values.`);
  }

  public syncToCloud(): { success: boolean; timestamp?: string; error?: string } {
    const user = this.getUser();
    if (user.username !== ADMIN_CONFIG.username) {
      return { success: false, error: 'Unauthorized: Only the admin can backup to cloud.' };
    }
    const shop = this.getShop();
    const ach = this.getAchievements();
    const mis = this.getMissions();
    const settings = this.getSettings();
    const tele = this.getTelemetry();

    const backup = { user, shop, ach, mis, settings, tele };
    localStorage.setItem(this.key('cloud_sync_backup'), JSON.stringify(backup));
    
    const timeStr = new Date().toLocaleString();
    this.logTelemetry('sync', `Backed up profile, inventory, settings, and achievements to simulated cloud.`);
    return { success: true, timestamp: timeStr };
  }

  public loadFromCloudBackup(): { success: boolean; error?: string } {
    const user = this.getUser();
    if (user.username !== ADMIN_CONFIG.username) {
      return { success: false, error: 'Unauthorized: Only the admin can restore from cloud.' };
    }
    const backupStr = localStorage.getItem(this.key('cloud_sync_backup'));
    if (!backupStr) {
      return { success: false, error: 'No cloud backups found on the server!' };
    }

    try {
      const backup = JSON.parse(backupStr);
      localStorage.setItem(this.key('user'), JSON.stringify(backup.user));
      localStorage.setItem(this.key('shop'), JSON.stringify(backup.shop));
      localStorage.setItem(this.key('achievements'), JSON.stringify(backup.ach));
      localStorage.setItem(this.key('missions'), JSON.stringify(backup.mis));
      localStorage.setItem(this.key('settings'), JSON.stringify(backup.settings));
      localStorage.setItem(this.key('telemetry'), JSON.stringify(backup.tele));

      this.logTelemetry('sync', `Restored profile, inventory, settings, and achievements from simulated cloud backup.`);
      this.syncPlayerToLeaderboard();
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Corrupt backup data!' };
    }
  }

  public buyPremiumPass(): { success: boolean; error?: string } {
    const user = this.getUser();
    if (user.hasPremiumPass) {
      return { success: false, error: 'Premium Track is already activated!' };
    }
    if (user.diamonds < 20) {
      return { success: false, error: 'Not enough diamonds! Earn them by playing or completing daily missions.' };
    }
    user.diamonds -= 20;
    user.hasPremiumPass = true;
    this.saveUser(user);
    this.logTelemetry('shop', 'Unlocked Season Pass Premium track.');
    this.syncActiveProfileToCloud();
    return { success: true };
  }

  public claimTierReward(tier: number, track: 'free' | 'premium'): { success: boolean; error?: string } {
    const user = this.getUser();
    if (user.level < tier) {
      return { success: false, error: `Required level ${tier} not reached!` };
    }

    if (track === 'free') {
      user.claimedFreeTiers = user.claimedFreeTiers || [];
      if (user.claimedFreeTiers.includes(tier)) {
        return { success: false, error: 'Reward already claimed!' };
      }
      this.grantRewardByTier(tier, 'free', user);
      user.claimedFreeTiers.push(tier);
    } else {
      if (!user.hasPremiumPass) {
        return { success: false, error: 'Premium track is not unlocked!' };
      }
      user.claimedPremiumTiers = user.claimedPremiumTiers || [];
      if (user.claimedPremiumTiers.includes(tier)) {
        return { success: false, error: 'Reward already claimed!' };
      }
      this.grantRewardByTier(tier, 'premium', user);
      user.claimedPremiumTiers.push(tier);
    }

    this.saveUser(user);
    this.syncActiveProfileToCloud();
    return { success: true };
  }

  private grantRewardByTier(tier: number, track: 'free' | 'premium', user: UserProfile) {
    if (track === 'free') {
      switch (tier) {
        case 1:
          user.coins += 200;
          user.stats.totalCoinsEarned += 200;
          break;
        case 2:
          user.coins += 400;
          user.stats.totalCoinsEarned += 400;
          break;
        case 3:
          this.unlockCosmetic('weap_axe_golden');
          break;
        case 4:
          this.unlockCosmetic('trail_dust');
          break;
        case 5:
          user.tickets = (user.tickets || 0) + 2;
          break;
        case 6:
          this.unlockCosmetic('title_combo');
          break;
        case 7:
          user.coins += 1500;
          user.stats.totalCoinsEarned += 1500;
          break;
        case 8:
          this.unlockCosmetic('char_knight');
          break;
      }
    } else {
      switch (tier) {
        case 1:
          user.diamonds += 5;
          user.stats.totalDiamondsEarned += 5;
          break;
        case 2:
          this.unlockCosmetic('title_cyber');
          break;
        case 3:
          this.unlockCosmetic('char_viking');
          break;
        case 4:
          user.tickets = (user.tickets || 0) + 5;
          break;
        case 5:
          this.unlockCosmetic('weap_axe_fire');
          break;
        case 6:
          this.unlockCosmetic('trail_spark');
          break;
        case 7:
          this.unlockCosmetic('weap_blade');
          break;
        case 8:
          this.unlockCosmetic('char_robot');
          break;
      }
    }
  }

  private unlockCosmetic(itemId: string) {
    const shop = this.getShop();
    const item = shop.find(i => i.id === itemId);
    if (item) {
      item.unlocked = true;
      this.saveShop(shop);
      this.logTelemetry('reward', `Unlocked cosmetic: ${item.name} via Season Pass.`);
    }
  }

  public useReviveTicket(amount: number = 1): { success: boolean; ticketsLeft?: number; error?: string } {
    const user = this.getUser();
    if (!user.tickets || user.tickets < amount) {
      return { success: false, error: 'Not enough tickets available' };
    }
    user.tickets -= amount;
    this.saveUser(user);
    this.logTelemetry('game', `Used ${amount} Revive Ticket(s).`);
    this.syncActiveProfileToCloud();
    return { success: true, ticketsLeft: user.tickets };
  }

  public async fetchAndStoreLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const city = data.city || 'Mumbai';
        const countryCode = data.country_code || 'IN';
        const countryName = data.country_name || 'India';

        const user = this.getUser();
        if (user && user.stats) {
          const currentLoc = (user.stats as any).location || {};
          if (currentLoc.city !== city || currentLoc.countryCode !== countryCode) {
            (user.stats as any).location = { city, countryCode, countryName };
            this.saveUser(user);
            this.syncActiveProfileToCloud(undefined, true);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching geo IP location:", e);
      const user = this.getUser();
      if (user && user.stats && !(user.stats as any).location) {
        (user.stats as any).location = { city: 'Mumbai', countryCode: 'IN', countryName: 'India' };
        this.saveUser(user);
      }
    }
  }
}

export const db = new LocalStorageDB();
export default db;
