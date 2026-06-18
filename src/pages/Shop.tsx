import React, { useState } from 'react';
import { ShoppingBag, Star, RefreshCw, Key } from 'lucide-react';
import { db, ShopItem, UserProfile } from '../utils/LocalStorageDB';
import { sound } from '../utils/AudioEngine';

interface ShopProps {
  user: UserProfile;
  shopItems: ShopItem[];
  onPurchaseComplete: () => void;
}

export const Shop: React.FC<ShopProps> = ({
  user,
  shopItems,
  onPurchaseComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'weapon' | 'trail' | 'title' | 'chests' | 'season_pass'>('character');
  
  // Chest animation state
  const [openingChest, setOpeningChest] = useState<string | null>(null);
  const [chestReward, setChestReward] = useState<{ type: string; amount?: number; item?: ShopItem } | null>(null);
  const [wiggleClass, setWiggleClass] = useState(false);

  const filteredItems = shopItems.filter(item => item.type === activeTab);

  const handleAction = (item: ShopItem) => {
    if (item.unlocked) {
      // Equip action
      const success = db.equipItem(item.id, item.type as any);
      if (success) {
        onPurchaseComplete();
      }
    } else {
      // Buy action
      const confirmBuy = window.confirm(`Unlock ${item.name} for ${item.cost} ${item.currency}?`);
      if (confirmBuy) {
        const res = db.purchaseShopItem(item.id);
        if (res.success) {
          sound.playChest();
          alert(`${item.name} unlocked and added to inventory!`);
          db.equipItem(item.id, item.type as any);
          onPurchaseComplete();
        } else {
          alert(`Failed to purchase: ${res.reason}`);
        }
      }
    }
  };

  const handleOpenChest = (chestType: 'mystery' | 'treasure' | 'epic') => {
    let cost = chestType === 'mystery' ? 150 : (chestType === 'treasure' ? 500 : 1500);
    if (user.coins < cost) {
      alert("Not enough coins to buy this chest!");
      return;
    }

    // Start opening animation
    setOpeningChest(chestType);
    setChestReward(null);
    setWiggleClass(true);

    // Play wiggle audio
    sound.playChop('hammer');

    setTimeout(() => {
      setWiggleClass(false);
      // Execute local DB chest opening
      const result = db.openChest(chestType);
      
      if (result.success) {
        if (result.rewardType === 'item') {
          setChestReward({ type: 'item', item: result.rewardItem });
        } else {
          setChestReward({ type: result.rewardType || 'coins', amount: result.rewardAmount });
        }
        onPurchaseComplete();
      } else {
        alert(`Failed to open chest: ${result.reason}`);
        setOpeningChest(null);
      }
    }, 1200); // 1.2s wiggle and opening delay
  };

  const isEquipped = (item: ShopItem) => {
    if (item.type === 'character') return user.equippedCharacter === item.id;
    if (item.type === 'weapon') return user.equippedWeapon === item.id;
    if (item.type === 'trail') return user.equippedTrail === item.id;
    if (item.type === 'title') return user.equippedTitle === item.name;
    return false;
  };

  const handleBuyPremiumPass = () => {
    if (user.diamonds < 20) {
      alert("Not enough diamonds! Earn them by playing or completing daily missions.");
      return;
    }
    
    // Deduct gems via admin/direct hook
    db.adminGrantCurrency('diamonds', -20);
    db.logTelemetry('shop', 'Unlocked Season Pass Premium track.');
    alert("Season Pass Premium Track Activated!");
    onPurchaseComplete();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Tab Selectors */}
      <div className="tab-headers">
        <button className={`tab-btn ${activeTab === 'character' ? 'active' : ''}`} onClick={() => setActiveTab('character')}>Heroes</button>
        <button className={`tab-btn ${activeTab === 'weapon' ? 'active' : ''}`} onClick={() => setActiveTab('weapon')}>Weapons</button>
        <button className={`tab-btn ${activeTab === 'trail' ? 'active' : ''}`} onClick={() => setActiveTab('trail')}>Trails</button>
        <button className={`tab-btn ${activeTab === 'title' ? 'active' : ''}`} onClick={() => setActiveTab('title')}>Titles</button>
        <button className={`tab-btn ${activeTab === 'chests' ? 'active' : ''}`} onClick={() => setActiveTab('chests')}>Chests</button>
        <button className={`tab-btn ${activeTab === 'season_pass' ? 'active' : ''}`} onClick={() => setActiveTab('season_pass')}>Season Pass</button>
      </div>

      {/* Grid for standard Shop items (unlocked items) */}
      {['character', 'weapon', 'trail', 'title'].includes(activeTab) && (
        <div className="grid-3">
          {filteredItems.map(item => {
            const equipped = isEquipped(item);
            
            // Custom item previews (visual color boxes)
            let boxColor = '#242a38';
            if (item.type === 'weapon') {
              if (item.id === 'weap_axe_golden') boxColor = '#FFD700';
              else if (item.id === 'weap_axe_fire') boxColor = '#FF4500';
              else if (item.id === 'weap_laser') boxColor = '#00FFFF';
              else if (item.id === 'weap_blade') boxColor = '#FF00FF';
            }

            return (
              <div 
                key={item.id} 
                className="game-card" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: equipped ? '1px solid var(--neon-cyan)' : '1px solid var(--panel-border)',
                  background: equipped ? 'linear-gradient(180deg, rgba(0, 240, 255, 0.02) 0%, transparent 100%)' : 'var(--panel-bg)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>{item.name}</h3>
                      <span className={`rarity-tag rarity-${item.rarity}`} style={{ marginTop: '4px', display: 'inline-block' }}>{item.rarity}</span>
                    </div>
                    
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Character/Weapon Preview Frame */}
                  <div style={{
                    width: '100%',
                    height: '100px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    {item.type === 'character' ? (
                      <span style={{ fontSize: '2rem' }}>
                        {item.id === 'char_lumberjack' ? '🪓' : (item.id === 'char_viking' ? '🛡️' : (item.id === 'char_knight' ? '⚔️' : (item.id === 'char_samurai' ? '🥷' : (item.id === 'char_wizard' ? '🧙' : (item.id === 'char_alien' ? '👽' : '🤖')))))}
                      </span>
                    ) : item.type === 'weapon' ? (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: boxColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '0.8rem' }}>
                        W
                      </div>
                    ) : item.type === 'trail' ? (
                      <span style={{ fontSize: '1.5rem' }}>✨ {item.name.split(' ')[0]}</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-retro)', color: 'var(--neon-yellow)' }}>🏆 {item.name}</span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>{item.description}</p>
                </div>

                <button 
                  className={equipped ? 'neon-btn-cyan' : (item.unlocked ? 'neon-btn' : 'neon-btn-magenta')}
                  style={{ width: '100%', pointerEvents: equipped ? 'none' : 'auto', textShadow: 'none', background: equipped ? 'var(--neon-cyan)' : 'transparent', color: equipped ? '#000' : '' }}
                  onClick={() => handleAction(item)}
                >
                  {equipped ? 'EQUIPPED' : (item.unlocked ? 'EQUIP' : `BUY: ${item.cost} ${item.currency === 'coins' ? 'Coins' : 'Gems'}`)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Category: CHESTS */}
      {activeTab === 'chests' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Animated opening modal */}
          {openingChest && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div 
                style={{
                  fontSize: '6rem',
                  marginBottom: '20px',
                  transition: 'transform 0.1s ease',
                  transform: wiggleClass ? 'rotate(10deg) scale(1.1)' : 'rotate(0deg)',
                  animation: wiggleClass ? 'bounceSlow 0.2s infinite' : ''
                }}
              >
                🎁
              </div>
              
              <h2 className="retro-title" style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--neon-yellow)' }}>
                {chestReward ? 'OPENED!' : `UNLOCKING ${openingChest.toUpperCase()} CHEST...`}
              </h2>

              {chestReward && (
                <div style={{ textAlign: 'center', animation: 'bounceSlow 2s infinite' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '14px' }}>
                    {chestReward.type === 'coins' && `+🪙 ${chestReward.amount}`}
                    {chestReward.type === 'diamonds' && `+💎 ${chestReward.amount}`}
                    {chestReward.type === 'item' && `Unlocked ${chestReward.item?.name}!`}
                  </div>
                  {chestReward.item && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{chestReward.item.description}</p>
                  )}
                  <button className="neon-btn-cyan" onClick={() => setOpeningChest(null)}>
                    CLAIM REWARD
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chest listings */}
          <div className="grid-3" style={{ width: '100%' }}>
            {/* Mystery Box */}
            <div className="game-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📦</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px' }}>Mystery Box</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Contains coins or small diamond drops. Great value starting option.
                </p>
              </div>
              <button className="neon-btn" style={{ width: '100%' }} onClick={() => handleOpenChest('mystery')}>
                BUY: 🪙 150
              </button>
            </div>

            {/* Treasure Chest */}
            <div className="game-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--neon-cyan)' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎁</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px' }}>Treasure Chest</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Unlocks a random locked weapon, character, or trail. Refunds coins if all owned.
                </p>
              </div>
              <button className="neon-btn-cyan" style={{ width: '100%' }} onClick={() => handleOpenChest('treasure')}>
                BUY: 🪙 500
              </button>
            </div>

            {/* Epic Chest */}
            <div className="game-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--neon-magenta)' }}>
              <div>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>👑</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px' }}>Epic Chest</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Guarantees a rare or legendary cosmetic + massive diamonds. Ultimate tier.
                </p>
              </div>
              <button className="neon-btn-magenta" style={{ width: '100%' }} onClick={() => handleOpenChest('epic')}>
                BUY: 🪙 1500
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category: SEASON PASS */}
      {activeTab === 'season_pass' && (
        <div className="game-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-yellow)' }}>SEASON 1: TIMBER VOYAGE</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Level up your profile to unlock tiers. Claims are automatic!</p>
            </div>
            
            <button 
              className="neon-btn-magenta"
              style={{ padding: '10px 20px' }}
              onClick={handleBuyPremiumPass}
            >
              UNLOCK PREMIUM TRACK: 💎 20
            </button>
          </div>

          {/* Render tiers (1 to 8) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(tier => {
              const unlocked = user.level >= tier;
              return (
                <div 
                  key={tier}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: unlocked ? 'rgba(0,240,255,0.02)' : 'rgba(255,255,255,0.01)',
                    border: unlocked ? '1px solid rgba(0,240,255,0.1)' : '1px solid var(--panel-border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      fontFamily: 'var(--font-retro)',
                      fontSize: '0.8rem',
                      color: unlocked ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '10px',
                      borderRadius: '4px',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      T{tier}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 'bold', color: unlocked ? 'white' : 'var(--text-secondary)' }}>
                        Tier {tier} Reward
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Requires Profile Level {tier}. Status: {unlocked ? 'Unlocked' : 'Locked'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                      <span style={{ display: 'block', color: 'var(--neon-green)' }}>Free: 🪙 {tier * 100}</span>
                      <span style={{ display: 'block', color: 'var(--neon-magenta)' }}>Premium: 💎 {tier}</span>
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
