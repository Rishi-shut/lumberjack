import React, { useState } from 'react';
import { ShoppingBag, Star, RefreshCw, Key, Award, Shield } from 'lucide-react';
import { db, ShopItem, UserProfile, getCharacterEmoji } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';
import geminiBananaImg from '../assets/gemini_banana.png';

interface ShopProps {
  user: UserProfile;
  shopItems: ShopItem[];
  onPurchaseComplete: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const Shop: React.FC<ShopProps> = ({
  user,
  shopItems,
  onPurchaseComplete,
  showAlert,
  showConfirm
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'weapon' | 'trail' | 'title' | 'chests' | 'season_pass'>('character');
  
  // Chest animation state
  const [openingChest, setOpeningChest] = useState<string | null>(null);
  const [chestReward, setChestReward] = useState<{ type: string; amount?: number; item?: ShopItem; bonusTicket?: boolean } | null>(null);
  const [wiggleClass, setWiggleClass] = useState(false);

  const filteredItems = shopItems.filter(item => item.type === activeTab);

  const handleAction = (item: ShopItem) => {
    if (item.unlocked) {
      const success = db.equipItem(item.id, item.type as any);
      if (success) {
        onPurchaseComplete();
      }
    } else {
      showConfirm(
        'Purchase Item',
        `Unlock ${item.name} for ${item.cost} ${item.currency === 'coins' ? 'Coins' : 'Gems'}?`,
        () => {
          const res = db.purchaseShopItem(item.id);
          if (res.success) {
            sound.playChest();
            showAlert('Unlock Success', `${item.name} unlocked and added to inventory!`);
            db.equipItem(item.id, item.type as any);
            onPurchaseComplete();
          } else {
            showAlert('Purchase Failed', `Failed to purchase: ${res.reason}`);
          }
        }
      );
    }
  };

  const handleOpenChest = (chestType: 'mystery' | 'treasure' | 'epic') => {
    let cost = chestType === 'mystery' ? 150 : (chestType === 'treasure' ? 500 : 1500);
    if (user.coins < cost) {
      showAlert('No Funds', 'Not enough coins to buy this chest!');
      return;
    }

    setOpeningChest(chestType);
    setChestReward(null);
    setWiggleClass(true);

    sound.playChop('hammer');

    setTimeout(() => {
      setWiggleClass(false);
      const result = db.openChest(chestType);
      
      if (result.success) {
        if (result.rewardType === 'item') {
          setChestReward({ type: 'item', item: result.rewardItem, bonusTicket: result.bonusTicket });
        } else {
          setChestReward({ type: result.rewardType || 'coins', amount: result.rewardAmount, bonusTicket: result.bonusTicket });
        }
        onPurchaseComplete();
      } else {
        showAlert('Chest Error', `Failed to open chest: ${result.reason}`);
        setOpeningChest(null);
      }
    }, 1200);
  };

  const isEquipped = (item: ShopItem) => {
    if (item.type === 'character') return user.equippedCharacter === item.id;
    if (item.type === 'weapon') return user.equippedWeapon === item.id;
    if (item.type === 'trail') return user.equippedTrail === item.id;
    if (item.type === 'title') return user.equippedTitle === item.name;
    return false;
  };

  const handleBuyPremiumPass = () => {
    const result = db.buyPremiumPass();
    if (result.success) {
      showAlert('Season Pass Activated', 'Season Pass Premium Track Activated!');
      onPurchaseComplete();
    } else {
      showAlert('Error', result.error || 'Failed to buy Premium Pass.');
    }
  };

  const handleClaimTier = (tier: number, track: 'free' | 'premium') => {
    const result = db.claimTierReward(tier, track);
    if (result.success) {
      showAlert('Reward Claimed!', 'Your reward has been added to your inventory.');
      onPurchaseComplete();
    } else {
      showAlert('Error', result.error || 'Failed to claim reward.');
    }
  };

  const getTierRewardDetails = (tier: number, track: 'free' | 'premium') => {
    if (track === 'free') {
      switch (tier) {
        case 1: return { name: '200 Coins', icon: '🪙' };
        case 2: return { name: '400 Coins', icon: '🪙' };
        case 3: return { name: 'Golden Axe', icon: '🪓' };
        case 4: return { name: 'Dust Trail', icon: '✨' };
        case 5: return { name: '2 Revive Tickets', icon: '🎫' };
        case 6: return { name: 'Combo Master Title', icon: '🏷️' };
        case 7: return { name: '1500 Coins', icon: '🪙' };
        case 8: return { name: 'Knight Character', icon: '🛡️' };
        default: return { name: 'Coins', icon: '🪙' };
      }
    } else {
      switch (tier) {
        case 1: return { name: '5 Diamonds', icon: '💎' };
        case 2: return { name: 'Cyber Master Title', icon: '🏷️' };
        case 3: return { name: 'Viking Character', icon: '🪓' };
        case 4: return { name: '5 Revive Tickets', icon: '🎫' };
        case 5: return { name: 'Fire Axe', icon: '🔥' };
        case 6: return { name: 'Spark Trail', icon: '⚡' };
        case 7: return { name: 'Blade Weapon', icon: '🗡️' };
        case 8: return { name: 'Robot Character', icon: '🤖' };
        default: return { name: 'Diamonds', icon: '💎' };
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 12px' }}>
      
      {/* Aldrich's Merchant Header */}
      <div 
        className="material-wood" 
        style={{
          padding: '24px 28px',
          marginBottom: '32px',
          background: 'linear-gradient(180deg, var(--panel-bg) 0%, var(--bg-color) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>🧙‍♂️</span>
          <div>
            <h2 className="retro-title" style={{ fontSize: '1.15rem', margin: 0, color: 'var(--neon-yellow)' }}>
              ALDRICH'S TRADE DECK
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0' }}>
              "Fine woodcrafting gear for the seasoned wanderer."
            </p>
          </div>
        </div>

        {/* Player Treasury pocket bags */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="material-leather" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-yellow)', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <span>🪙</span>
            <span>{user.coins.toLocaleString()}</span>
          </div>
          <div className="material-leather" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <span>💎</span>
            <span>{user.diamonds}</span>
          </div>
        </div>
      </div>

      {/* Shop Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '3px solid var(--panel-border)', paddingBottom: '10px', marginBottom: '32px' }}>
        {(['character', 'weapon', 'trail', 'title', 'chests', 'season_pass'] as const).map(tab => {
          const isActive = activeTab === tab;
          const label = tab === 'character' ? 'Heroes' :
                        tab === 'weapon' ? 'Weapons' :
                        tab === 'trail' ? 'Trails' :
                        tab === 'title' ? 'Titles' :
                        tab === 'chests' ? 'Chests' : 'Season Pass';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={isActive ? 'neon-btn-yellow' : 'neon-btn'}
              style={{
                padding: '10px 18px',
                fontSize: '0.75rem',
                borderWidth: '2px',
                borderRadius: '6px',
                boxShadow: 'none',
                transform: isActive ? 'translateY(2px)' : 'none'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Item Catalog Grid */}
      {['character', 'weapon', 'trail', 'title'].includes(activeTab) && (
        <div className="grid-3">
          {filteredItems.map(item => {
            const equipped = isEquipped(item);
            
            let boxColor = 'var(--bg-color)';
            if (item.type === 'weapon') {
              if (item.id === 'weap_axe_golden') boxColor = '#fef08a';
              else if (item.id === 'weap_axe_fire') boxColor = '#fca5a5';
              else if (item.id === 'weap_laser') boxColor = '#bae6fd';
              else if (item.id === 'weap_blade') boxColor = '#fbcfe8';
              else if (item.id === 'weap_broadaxe') boxColor = '#cbd5e1';
              else if (item.id === 'weap_scythe') boxColor = '#e2e8f0';
              else if (item.id === 'weap_candy_cane') boxColor = '#fecdd3';
              else if (item.id === 'weap_energy_halberd') boxColor = '#ddd6fe';
            }

            return (
              <div 
                key={item.id} 
                className="material-wood" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  background: equipped ? 'linear-gradient(180deg, var(--panel-bg) 0%, rgba(14, 165, 233, 0.08) 100%)' : 'var(--panel-bg)',
                  borderColor: equipped ? 'var(--neon-cyan)' : 'var(--panel-border)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 className="retro-title" style={{ fontSize: '0.88rem', margin: 0, textShadow: 'none', color: 'var(--text-primary)' }}>
                        {item.name}
                      </h3>
                      <span className={`rarity-tag rarity-${item.rarity}`} style={{ marginTop: '6px', display: 'inline-block', fontSize: '8px', padding: '2px 6px' }}>
                        {item.rarity}
                      </span>
                    </div>
                    
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Character/Weapon Preview Showcase Frame */}
                  <div style={{
                    width: '100%',
                    height: '110px',
                    background: 'var(--bg-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '1px solid var(--panel-border)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {/* Gemini Banana Watermark Background */}
                    <img 
                      src={geminiBananaImg} 
                      alt="Gemini Banana" 
                      style={{ 
                        position: 'absolute', 
                        width: '75px', 
                        height: '75px', 
                        opacity: 0.15, 
                        objectFit: 'contain',
                        pointerEvents: 'none'
                      }} 
                    />

                    {item.type === 'character' ? (
                      <span style={{ fontSize: '2.8rem', zIndex: 2 }} className="character-breath">
                        {getCharacterEmoji(item.id)}
                      </span>
                    ) : item.type === 'weapon' ? (
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        backgroundColor: boxColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 'bold', 
                        color: '#fff', 
                        fontSize: '1.2rem',
                        border: '2px solid #fff',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                        zIndex: 2
                      }}>
                        {item.id === 'weap_axe_wood' ? '🪵' : 
                         item.id === 'weap_axe_golden' ? '🪙' :
                         item.id === 'weap_axe_fire' ? '🔥' :
                         item.id === 'weap_chainsaw' ? '⚙️' :
                         item.id === 'weap_laser' ? '⚡' : '🪓'}
                      </div>
                    ) : item.type === 'trail' ? (
                      <span style={{ fontSize: '1.8rem', zIndex: 2 }} className="character-breath">✨ {item.name.split(' ')[0]}</span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)', zIndex: 2 }}>🏆 {item.name}</span>
                    )}
                  </div>

                  {/* Modern Separator */}
                  <div style={{ height: '1px', background: 'var(--panel-border)', margin: '0 -20px 14px' }} />

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '20px' }}>
                    {item.description}
                  </p>
                </div>

                {/* Pricing & Equip triggers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!item.unlocked && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px dashed var(--panel-border)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-retro)',
                      color: item.currency === 'coins' ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
                      alignSelf: 'center'
                    }}>
                      {item.currency === 'coins' ? '🪙' : '💎'} {item.cost}
                    </div>
                  )}
                  
                  <button 
                    className={equipped ? 'neon-btn-cyan' : (item.unlocked ? 'neon-btn' : 'neon-btn-magenta')}
                    style={{ width: '100%', pointerEvents: equipped ? 'none' : 'auto', fontSize: '0.75rem', padding: '10px' }}
                    onClick={() => handleAction(item)}
                  >
                    {equipped ? 'EQUIPPED' : (item.unlocked ? 'EQUIP' : 'UNLOCK CONTRACT')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category: CHESTS */}
      {activeTab === 'chests' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Animated chest opening dialog overlay */}
          {openingChest && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(12, 8, 6, 0.95)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(12px)',
              padding: '24px'
            }}>
              <div className="material-wood" style={{ padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
                <div 
                  className="character-breath"
                  style={{
                    fontSize: '6rem',
                    marginBottom: '20px',
                    display: 'inline-block',
                    animationDuration: wiggleClass ? '0.2s' : '2s'
                  }}
                >
                  {openingChest === 'epic' ? '👑' : (openingChest === 'treasure' ? '🎁' : '📦')}
                </div>
                
                <h2 className="retro-title" style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--neon-yellow)' }}>
                  {chestReward ? 'CHEST OPENED!' : `UNLOCKING ${openingChest.toUpperCase()}...`}
                </h2>

                {chestReward && (
                  <div style={{ margin: '20px 0' }}>
                    <div className="material-paper" style={{ padding: '20px', borderRadius: '8px', marginBottom: '24px', color: 'var(--text-primary)' }}>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-retro)', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>REWARD UNLOCKED</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-retro)' }}>
                        {chestReward.type === 'coins' && `🪙 +${chestReward.amount}`}
                        {chestReward.type === 'diamonds' && `💎 +${chestReward.amount}`}
                        {chestReward.type === 'tickets' && `🎫 +${chestReward.amount}`}
                        {chestReward.type === 'item' && `${chestReward.item?.name}`}
                      </div>
                      {chestReward.item && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '6px', fontStyle: 'italic' }}>
                          "{chestReward.item.description}"
                        </p>
                      )}
                      {chestReward.bonusTicket && (
                        <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--neon-magenta)', fontFamily: 'var(--font-retro)' }}>
                          🎉 BONUS: +1 Revive Ticket 🎫
                        </div>
                      )}
                    </div>
                    
                    <button className="neon-btn-cyan" style={{ padding: '12px 36px' }} onClick={() => setOpeningChest(null)}>
                      COLLECT LOOT
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chest listings */}
          <div className="grid-3" style={{ width: '100%' }}>
            
            {/* Mystery Box */}
            <div className="material-wood" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))' }}>📦</div>
                <h3 className="retro-title" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textShadow: 'none' }}>Mystery Box</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', margin: '8px 0 20px' }}>
                  Contains coins or small diamond drops. Great value starting option.
                </p>
              </div>
              <button className="neon-btn" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => handleOpenChest('mystery')}>
                OPEN: 🪙 150
              </button>
            </div>

            {/* Treasure Chest */}
            <div className="material-wood" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', borderColor: 'var(--neon-cyan)' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))' }}>🎁</div>
                <h3 className="retro-title" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textShadow: 'none' }}>Treasure Chest</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', margin: '8px 0 20px' }}>
                  Unlocks a random locked weapon, character, or trail. Refunds coins if all owned.
                </p>
              </div>
              <button className="neon-btn-cyan" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => handleOpenChest('treasure')}>
                OPEN: 🪙 500
              </button>
            </div>

            {/* Epic Chest */}
            <div className="material-wood" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', borderColor: 'var(--neon-magenta)' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))' }}>👑</div>
                <h3 className="retro-title" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textShadow: 'none' }}>Epic Chest</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', margin: '8px 0 20px' }}>
                  Guarantees a rare or legendary cosmetic + massive diamonds. Ultimate tier.
                </p>
              </div>
              <button className="neon-btn-magenta" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => handleOpenChest('epic')}>
                OPEN: 🪙 1500
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category: SEASON PASS */}
      {activeTab === 'season_pass' && (
        <div className="material-wood" style={{ padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--panel-border)', paddingBottom: '20px', marginBottom: '30px', gap: '16px' }}>
            <div>
              <h2 className="retro-title" style={{ fontSize: '1.15rem', color: 'var(--neon-yellow)' }}>SEASON 1: TIMBER VOYAGE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                Chop trunks to earn profile XP and level up! Current Level: <span style={{ color: 'var(--neon-yellow)', fontWeight: 'bold' }}>{user.level}</span>
              </p>
            </div>
            
            {user.hasPremiumPass ? (
              <div 
                className="rarity-tag rarity-legendary"
                style={{ padding: '10px 20px', fontSize: '0.75rem', border: '2px solid var(--neon-yellow)', animation: 'pulseNeon 1.5s infinite' }}
              >
                👑 PREMIUM TRACK ACTIVE
              </div>
            ) : (
              <button 
                className="neon-btn-magenta"
                style={{ padding: '10px 20px', fontSize: '0.75rem' }}
                onClick={handleBuyPremiumPass}
              >
                ACTIVATE PREMIUM: 💎 20
              </button>
            )}
          </div>

          {/* Render tiers (1 to 8) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(tier => {
              const unlocked = user.level >= tier;
              
              const freeReward = getTierRewardDetails(tier, 'free');
              const premiumReward = getTierRewardDetails(tier, 'premium');
              
              const isFreeClaimed = user.claimedFreeTiers?.includes(tier);
              const isPremiumClaimed = user.claimedPremiumTiers?.includes(tier);

              return (
                <div 
                  key={tier}
                  className="material-wood"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                    background: unlocked ? 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.6) 100%)' : 'var(--panel-bg)',
                    borderColor: unlocked ? 'var(--neon-green)' : 'var(--panel-border)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    gap: '12px'
                  }}
                >
                  {/* Top Tier Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        fontFamily: 'var(--font-retro)',
                        fontSize: '0.8rem',
                        color: unlocked ? 'var(--neon-green)' : 'var(--text-secondary)',
                        background: 'rgba(0,0,0,0.2)',
                        border: '2px solid var(--panel-border)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                      }}>
                        TIER {tier}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: unlocked ? 'var(--neon-green)' : 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>
                        {unlocked ? '🔓 UNLOCKED' : `🔒 LOCKED (Requires Lv. ${tier})`}
                      </span>
                    </div>
                  </div>

                  {/* Tracks Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                    
                    {/* Free Track Card */}
                    <div 
                      style={{ 
                        background: 'rgba(0, 0, 0, 0.2)', 
                        border: '1.5px solid var(--panel-border)', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        minHeight: '100px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>FREE TRACK REWARD</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ fontSize: '1.6rem' }}>{freeReward.icon}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{freeReward.name}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        {isFreeClaimed ? (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-retro)' }}>✓ CLAIMED</div>
                        ) : unlocked ? (
                          <button 
                            className="neon-btn-green" 
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px' }}
                            onClick={() => handleClaimTier(tier, 'free')}
                          >
                            CLAIM FREE
                          </button>
                        ) : (
                          <button 
                            className="retro-btn" 
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px', opacity: 0.5, cursor: 'not-allowed' }}
                            disabled
                          >
                            LOCKED
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Premium Track Card */}
                    <div 
                      style={{ 
                        background: user.hasPremiumPass ? 'rgba(217, 119, 6, 0.05)' : 'rgba(0,0,0,0.15)', 
                        border: user.hasPremiumPass ? '1.5px solid var(--neon-yellow)' : '1.5px solid var(--panel-border)', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        minHeight: '100px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.62rem', color: user.hasPremiumPass ? 'var(--neon-yellow)' : 'var(--text-secondary)', fontFamily: 'var(--font-retro)' }}>👑 PREMIUM REWARD</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ fontSize: '1.6rem' }}>{premiumReward.icon}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{premiumReward.name}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        {!user.hasPremiumPass ? (
                          <button 
                            className="retro-btn" 
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px', color: 'var(--neon-yellow)', borderColor: 'var(--neon-yellow)', opacity: 0.8 }}
                            onClick={handleBuyPremiumPass}
                          >
                            GET PREMIUM PASS
                          </button>
                        ) : isPremiumClaimed ? (
                          <div style={{ color: 'var(--neon-yellow)', fontSize: '0.7rem', fontFamily: 'var(--font-retro)' }}>✓ CLAIMED</div>
                        ) : unlocked ? (
                          <button 
                            className="neon-btn-magenta" 
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px' }}
                            onClick={() => handleClaimTier(tier, 'premium')}
                          >
                            CLAIM PREMIUM
                          </button>
                        ) : (
                          <button 
                            className="retro-btn" 
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.68rem', borderRadius: '4px', opacity: 0.5, cursor: 'not-allowed' }}
                            disabled
                          >
                            LOCKED
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
