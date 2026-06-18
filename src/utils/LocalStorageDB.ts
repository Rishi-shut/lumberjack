// Local Storage Database & Game State Service for Infinite Chop
// Emulates a backend server using LocalStorage, including seeding, transactions, and admin controls.

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
  equippedCharacter: string;
  equippedWeapon: string;
  equippedTrail: string;
  equippedTitle: string;
  equippedBadge: string;
  equippedFrame: string;
  lastDailyClaim: string | null; // ISO string
  stats: {
    totalChops: number;
    totalChestsOpened: number;
    gamesPlayed: number;
    totalCoinsEarned: number;
    totalDiamondsEarned: number;
    timePlayed: number; // in seconds
    worldRuns: Record<string, number>;
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
  type: 'daily' | 'weekly';
  target: number;
  current: number;
  rewardCoins: number;
  rewardDiamonds: number;
  claimed: boolean;
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

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Characters
  { id: 'char_lumberjack', name: 'Lumberjack', description: 'Just a regular guy who loves wood.', type: 'character', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'char_viking', name: 'Viking Olaf', description: 'Chops trunks with Norse fury.', type: 'character', cost: 600, currency: 'coins', unlocked: false, rarity: 'common' },
  { id: 'char_knight', name: 'Sir Galahad', description: 'Armor is heavy, but his swing is true.', type: 'character', cost: 1200, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_samurai', name: 'Kenshin', description: 'Slices blocks with katana precision.', type: 'character', cost: 2000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'char_wizard', name: 'Gandalf', description: 'Chops trees with fireballs and magic.', type: 'character', cost: 3500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_ninja', name: 'Cyber Ninja', description: 'Synthesized movements. Light-speed cuts.', type: 'character', cost: 5000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'char_alien', name: 'Zorgon', description: 'An alien lumberjack from Sector 9.', type: 'character', cost: 15, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'char_robot', name: 'Mecha Chop', description: 'Iron limbs fueled by steam power.', type: 'character', cost: 40, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Weapons
  { id: 'weap_axe_wood', name: 'Steel Axe', description: 'Your trusty iron companion.', type: 'weapon', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'weap_axe_golden', name: 'Golden Axe', description: 'Shines bright, chips soft.', type: 'weapon', cost: 1000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'weap_hammer', name: 'Mjolnir Jr.', description: 'Crush blocks instead of cutting them.', type: 'weapon', cost: 2000, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'weap_axe_fire', name: 'Magma Cleaver', description: 'Heated edge that cauterizes trunks.', type: 'weapon', cost: 3000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_chainsaw', name: 'Lumbermatic-3000', description: 'Vroom vroom! Automatic wood grinding.', type: 'weapon', cost: 4500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'weap_laser', name: 'Plasma Cutter', description: 'Energy beam that slices effortlessly.', type: 'weapon', cost: 20, currency: 'diamonds', unlocked: false, rarity: 'legendary' },
  { id: 'weap_blade', name: 'Cyber Saber', description: 'An elegant weapon from a neon age.', type: 'weapon', cost: 50, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

  // Trails
  { id: 'trail_none', name: 'No Trail', description: 'Simple chop motion.', type: 'trail', cost: 0, currency: 'coins', unlocked: true, rarity: 'common' },
  { id: 'trail_dust', name: 'Wood Chips', description: 'A shower of splinters and leaves.', type: 'trail', cost: 400, currency: 'coins', unlocked: false, rarity: 'common' },
  { id: 'trail_spark', name: 'Electric Spark', description: 'Neon lightning trails.', type: 'trail', cost: 1200, currency: 'coins', unlocked: false, rarity: 'rare' },
  { id: 'trail_fire', name: 'Fire Flame', description: 'Leaves a smoking flame behind.', type: 'trail', cost: 2500, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'trail_rainbow', name: 'Rainbow Ribbon', description: 'A vibrant spectrum of colors.', type: 'trail', cost: 15, currency: 'diamonds', unlocked: false, rarity: 'legendary' },

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
  { id: 'world_cyber', name: 'Neon Grid', description: 'Chop down central server cores in cyberspace.', type: 'world', cost: 3000, currency: 'coins', unlocked: false, rarity: 'epic' },
  { id: 'world_volcano', name: 'Magma Core', description: 'Chop volcanic magma crystals beside lava.', type: 'world', cost: 5000, currency: 'coins', unlocked: false, rarity: 'legendary' },
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
];

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { username: 'LumberKing_99', country: 'US', score: 1450, maxCombo: 98, coins: 4500, avatar: 'char_viking', title: 'Log Slayer', frame: 'Neon Glow' },
  { username: 'CyberSlicer', country: 'JP', score: 1220, maxCombo: 84, coins: 3820, avatar: 'char_ninja', title: 'Netrunner', frame: 'Neon Glow' },
  { username: 'OlafChops', country: 'NO', score: 980, maxCombo: 72, coins: 2900, avatar: 'char_viking', title: 'Timber Titan', frame: 'Frozen Crystal' },
  { username: 'SamuraiWood', country: 'KR', score: 850, maxCombo: 68, coins: 2100, avatar: 'char_samurai', title: 'Combo Master', frame: 'Standard' },
  { username: 'ForestGump', country: 'CA', score: 710, maxCombo: 55, coins: 1840, avatar: 'char_lumberjack', title: 'Timber Titan', frame: 'Standard' },
  { username: 'YetiChop', country: 'RU', score: 620, maxCombo: 49, coins: 1400, avatar: 'char_lumberjack', title: 'Chop Cadet', frame: 'Frozen Crystal' },
  { username: 'LaserNinja', country: 'DE', score: 550, maxCombo: 40, coins: 1100, avatar: 'char_ninja', title: 'Chop Cadet', frame: 'Standard' },
  { username: 'CocoNut', country: 'BR', score: 480, maxCombo: 35, coins: 920, avatar: 'char_pirate', title: 'Chop Cadet', frame: 'Standard' },
  { username: 'Valkyrie_9', country: 'SE', score: 420, maxCombo: 31, coins: 810, avatar: 'char_viking', title: 'Chop Cadet', frame: 'Standard' },
  { username: 'MinerMax', country: 'AU', score: 350, maxCombo: 28, coins: 640, avatar: 'char_lumberjack', title: 'Chop Cadet', frame: 'Standard' },
];

class LocalStorageDB {
  private prefix = 'infinite_chop_';

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
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
        coins: 100, // starting coins
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
        }
      };
      
      localStorage.setItem(this.key('user'), JSON.stringify(defaultUser));
      localStorage.setItem(this.key('shop'), JSON.stringify(DEFAULT_SHOP_ITEMS));
      localStorage.setItem(this.key('achievements'), JSON.stringify(DEFAULT_ACHIEVEMENTS));
      localStorage.setItem(this.key('missions'), JSON.stringify(DEFAULT_MISSIONS));
      localStorage.setItem(this.key('leaderboard'), JSON.stringify(SEED_LEADERBOARD));
      localStorage.setItem(this.key('settings'), JSON.stringify({
        sfxVolume: 0.6,
        musicVolume: 0.4,
        masterVolume: 0.5,
        muted: false,
        graphics: 'high', // low, medium, high
        keyLeft: 'ArrowLeft',
        keyRight: 'ArrowRight',
        keyLeftAlt: 'a',
        keyRightAlt: 'd',
      }));
      // Telemetry Logs
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
    return JSON.parse(localStorage.getItem(this.key('shop'))!);
  }

  public getAchievements(): Achievement[] {
    return JSON.parse(localStorage.getItem(this.key('achievements'))!);
  }

  public getMissions(): GameMission[] {
    return JSON.parse(localStorage.getItem(this.key('missions'))!);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return JSON.parse(localStorage.getItem(this.key('leaderboard'))!);
  }

  public getSettings() {
    return JSON.parse(localStorage.getItem(this.key('settings'))!);
  }

  public getTelemetry(): any[] {
    return JSON.parse(localStorage.getItem(this.key('telemetry')) || '[]');
  }

  // --- Setters ---

  public saveUser(user: UserProfile) {
    localStorage.setItem(this.key('user'), JSON.stringify(user));
  }

  public saveShop(shop: ShopItem[]) {
    localStorage.setItem(this.key('shop'), JSON.stringify(shop));
  }

  public saveAchievements(ach: Achievement[]) {
    localStorage.setItem(this.key('achievements'), JSON.stringify(ach));
  }

  public saveMissions(mis: GameMission[]) {
    localStorage.setItem(this.key('missions'), JSON.stringify(mis));
  }

  public saveLeaderboard(leader: LeaderboardEntry[]) {
    localStorage.setItem(this.key('leaderboard'), JSON.stringify(leader));
  }

  public saveSettings(settings: any) {
    localStorage.setItem(this.key('settings'), JSON.stringify(settings));
  }

  public logTelemetry(type: string, message: string) {
    const logs = this.getTelemetry();
    logs.unshift({ timestamp: new Date().toISOString(), type, message });
    if (logs.length > 100) logs.pop(); // keep last 100
    localStorage.setItem(this.key('telemetry'), JSON.stringify(logs));
  }

  // --- Profile Actions ---

  public linkAccount(email: string, username: string) {
    const user = this.getUser();
    user.isGuest = false;
    user.email = email;
    user.username = username;
    this.saveUser(user);
    this.logTelemetry('auth', `Account linked for user: ${username} (${email})`);
    this.syncPlayerToLeaderboard();
  }

  public updateUsername(newUsername: string) {
    const user = this.getUser();
    const oldName = user.username;
    user.username = newUsername;
    this.saveUser(user);
    this.logTelemetry('profile', `Username changed from ${oldName} to ${newUsername}`);
    this.syncPlayerToLeaderboard();
  }

  // --- Game Submission Transaction ---

  public submitGameSession(score: number, maxCombo: number, coinsEarned: number, diamondsEarned: number, worldName: string, timeSpentSeconds: number) {
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

    // 2. High Score / Combo
    let newHighScore = false;
    if (score > user.highScore) {
      user.highScore = score;
      newHighScore = true;
    }
    if (maxCombo > user.maxCombo) {
      user.maxCombo = maxCombo;
    }

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
    this.updateMissionProgress('mis_d_chop_300', score);
    this.updateMissionProgress('mis_d_combo_30', maxCombo);
    this.updateMissionProgress('mis_d_coins_100', coinsEarned);
    this.updateMissionProgress('mis_d_play_3', 1);

    this.updateMissionProgress('mis_w_chop_3000', score);
    this.updateMissionProgress('mis_w_score_1000', score);
    this.updateMissionProgress('mis_w_gold_2000', coinsEarned);

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

  public openChest(chestType: 'mystery' | 'treasure' | 'epic'): { success: boolean; rewardType?: string; rewardAmount?: number; rewardItem?: ShopItem; reason?: string } {
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
      // Small coins or diamonds
      if (rand < 0.85) {
        const coins = Math.floor(50 + Math.random() * 250);
        user.coins += coins;
        user.stats.totalCoinsEarned += coins;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened Mystery Chest: earned ${coins} coins.`);
        return { success: true, rewardType: 'coins', rewardAmount: coins };
      } else {
        const diamonds = Math.floor(1 + Math.random() * 4);
        user.diamonds += diamonds;
        user.stats.totalDiamondsEarned += diamonds;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened Mystery Chest: earned ${diamonds} diamonds.`);
        return { success: true, rewardType: 'diamonds', rewardAmount: diamonds };
      }
    } else {
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
        this.logTelemetry('chest', `Opened ${chestType} chest: unlocked ${rewardItem.name}.`);
        return { success: true, rewardType: 'item', rewardItem };
      } else {
        // Fallback if all items unlocked
        const refundCoins = chestType === 'treasure' ? 600 : 1800;
        user.coins += refundCoins;
        this.saveUser(user);
        this.logTelemetry('chest', `Opened ${chestType} chest: all items unlocked! Refunded ${refundCoins} coins.`);
        return { success: true, rewardType: 'coins', rewardAmount: refundCoins };
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
    const mission = missions.find(m => m.id === missionId);
    if (mission && !mission.claimed) {
      if (mission.id === 'mis_d_play_3' || mission.id === 'mis_w_chests_3') {
        // Incremental missions
        mission.current = Math.min(mission.target, mission.current + progressValue);
      } else if (mission.id === 'mis_d_combo_30' || mission.id === 'mis_w_score_1000') {
        // High watermark missions
        mission.current = Math.min(mission.target, Math.max(mission.current, progressValue));
      } else {
        // General cumulative
        mission.current = Math.min(mission.target, mission.current + progressValue);
      }
      this.saveMissions(missions);
    }
  }

  private syncPlayerToLeaderboard() {
    const user = this.getUser();
    const leaderboard = this.getLeaderboard();

    // Find if player already in leaderboard
    const idx = leaderboard.findIndex(entry => entry.username === user.username);
    const playerEntry: LeaderboardEntry = {
      username: user.username,
      country: 'US', // default profile country
      score: user.highScore,
      maxCombo: user.maxCombo,
      coins: user.stats.totalCoinsEarned,
      avatar: user.equippedCharacter,
      title: user.equippedTitle,
      frame: user.equippedFrame
    };

    if (idx >= 0) {
      leaderboard[idx] = playerEntry;
    } else {
      leaderboard.push(playerEntry);
    }

    // Re-sort leaderboard by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    this.saveLeaderboard(leaderboard);
  }

  // --- Admin Methods ---

  public getAdminStats() {
    const leaderboard = this.getLeaderboard();
    const user = this.getUser();
    
    // Aggregate telemetry data for metrics
    const totalUsers = leaderboard.length + 3; // fake some extra counts
    const activePlayersToday = Math.ceil(totalUsers * 0.7);
    const totalRevenueMock = leaderboard.reduce((acc, entry) => acc + (entry.coins * 0.005), 0) + 42.5;

    return {
      totalRegistrations: totalUsers,
      activeToday: activePlayersToday,
      totalRevenue: totalRevenueMock,
      telemetryLogs: this.getTelemetry(),
      playerBanned: user.isBanned,
    };
  }

  public adminBanUser(ban: boolean) {
    const user = this.getUser();
    user.isBanned = ban;
    this.saveUser(user);
    this.logTelemetry('admin', `Admin ${ban ? 'BANNED' : 'UNBANNED'} player ${user.username}`);
  }

  public adminGrantCurrency(type: 'coins' | 'diamonds', amount: number) {
    const user = this.getUser();
    if (type === 'coins') {
      user.coins += amount;
      user.stats.totalCoinsEarned += amount;
    } else {
      user.diamonds += amount;
      user.stats.totalDiamondsEarned += amount;
    }
    this.saveUser(user);
    this.logTelemetry('admin', `Admin GRANTED ${amount} ${type} to ${user.username}`);
    this.syncPlayerToLeaderboard();
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
}

export const db = new LocalStorageDB();
export default db;
