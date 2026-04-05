import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useUser } from './_app';
import { parsePaintStyle } from '../lib/namePaint';

const TABS = [
  { key: 'name_paint', label: 'Name Paints', emoji: '🎨' },
  { key: 'banner', label: 'Banners', emoji: '🏳️' },
  { key: 'skin', label: 'Game Skins', emoji: '🎮' },
  { key: 'badge', label: 'Badges', emoji: '⭐' },
  { key: 'frame', label: 'Profile Frames', emoji: '🖼️' },
];

const EQUIPPED_KEYS = {
  name_paint: 'equipped_name_paint',
  banner: 'equipped_banner',
  skin: 'equipped_skin',
  badge: 'equipped_badge',
  frame: 'equipped_frame',
};

export default function InventoryPage() {
  const { playerId, playerStats, username } = useUser();
  const [activeTab, setActiveTab] = useState('name_paint');
  const [items, setItems] = useState(null);
  const [equipped, setEquipped] = useState({});
  const [acting, setActing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState(null);
  const [previewId, setPreviewId] = useState(null); // cosmetic_id being hovered for preview
  // Wait for session to hydrate from localStorage before deciding logged-out state
  const [sessionChecked, setSessionChecked] = useState(false);
  useEffect(() => { setSessionChecked(true); }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!playerId) { setLoading(false); return; }
    fetch(`/api/inventory?playerId=${encodeURIComponent(playerId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setItems(d.items);
          setEquipped(d.equipped);
          if (d.debug) setDebugMsg(d.debug);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId, sessionChecked]);

  const handleEquip = async (cosmeticId, type, currentlyEquipped) => {
    setActing(cosmeticId);
    try {
      const action = currentlyEquipped ? 'unequip' : 'equip';
      const res = await fetch('/api/inventory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cosmeticId, type, action }),
      });
      if (res.ok) {
        setEquipped(prev => ({
          ...prev,
          [EQUIPPED_KEYS[type]]: currentlyEquipped ? null : cosmeticId,
        }));
      }
    } catch {}
    setActing(null);
  };

  const tabItems = items?.filter(i => i.type === activeTab) || [];
  const equippedId = equipped[EQUIPPED_KEYS[activeTab]];
  const tezBucks = playerStats?.tez_bucks || 0;

  // For name paint preview: resolve the css_value of whichever paint is being previewed/equipped
  const previewItem = previewId
    ? tabItems.find(i => i.cosmetic_id === previewId)
    : tabItems.find(i => i.cosmetic_id === equippedId);
  const previewCss = previewItem?.css_value || null;
  const previewStyle = parsePaintStyle(previewCss);

  if (!sessionChecked || (!playerId && loading)) {
    return (
      <Layout title="Inventory — TEZ Games">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
          Loading...
        </div>
      </Layout>
    );
  }

  if (!playerId) {
    return (
      <Layout title="Inventory — TEZ Games">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎒</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            No inventory yet
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
            Claim a username to start collecting cosmetics.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inventory — TEZ Games">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 32, fontWeight: 700,
            background: 'linear-gradient(135deg, #fde047, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>
            🎒 My Inventory
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 10, padding: '6px 14px',
            background: 'rgba(251,191,36,0.07)',
          }}>
            <span style={{ fontSize: 15 }}>💰</span>
            <span style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700,
              color: '#fbbf24',
            }}>
              {tezBucks.toLocaleString()} TB
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 24,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPreviewId(null); }}
              style={{
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                border: activeTab === tab.key
                  ? '1px solid rgba(124,58,237,0.6)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === tab.key
                  ? 'rgba(124,58,237,0.2)'
                  : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.key ? '#c084fc' : 'rgba(255,255,255,0.5)',
                fontWeight: 700, fontSize: 13,
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Debug banner */}
        {debugMsg && (
          <div style={{
            marginBottom: 16, padding: '10px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#f87171',
          }}>
            ⚠ DB error: {debugMsg}
          </div>
        )}

        {/* Name Paint Preview Panel */}
        {activeTab === 'name_paint' && !loading && tabItems.length > 0 && (
          <div style={{
            marginBottom: 24, padding: '18px 24px',
            background: 'rgba(124,58,237,0.07)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 8,
              }}>
                {previewId ? 'Preview' : equippedId ? 'Currently Equipped' : 'Preview'}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 26, fontWeight: 700,
                  ...(previewStyle || { color: 'rgba(255,255,255,0.5)' }),
                }}
              >
                {username || 'YourName'}
              </span>
            </div>
            {previewItem && (
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 12,
                color: 'rgba(255,255,255,0.4)', textAlign: 'right',
              }}>
                <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{previewItem.name}</div>
                {previewItem.rarity && (
                  <div style={{ color: rarityColor(previewItem.rarity) }}>{previewItem.rarity}</div>
                )}
              </div>
            )}
            {!previewItem && (
              <div style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 12,
                color: 'rgba(255,255,255,0.25)',
              }}>
                Hover a paint to preview
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontFamily: "'Nunito', sans-serif" }}>
            Loading...
          </div>
        ) : tabItems.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>
              {TABS.find(t => t.key === activeTab)?.emoji}
            </div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 18,
              color: 'rgba(255,255,255,0.4)', marginBottom: 8,
            }}>
              No items yet
            </div>
            <div style={{
              fontFamily: "'Nunito', sans-serif", fontSize: 13,
              color: 'rgba(255,255,255,0.25)',
            }}>
              Check back when the shop opens!
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 14,
          }}>
            {tabItems.map(item => {
              const isEquipped = equipped[EQUIPPED_KEYS[activeTab]] === item.cosmetic_id;
              const isActing = acting === item.cosmetic_id;
              const paintStyle = activeTab === 'name_paint' ? parsePaintStyle(item.css_value) : null;
              return (
                <div
                  key={item.cosmetic_id}
                  onMouseEnter={() => activeTab === 'name_paint' && setPreviewId(item.cosmetic_id)}
                  onMouseLeave={() => activeTab === 'name_paint' && setPreviewId(null)}
                  style={{
                    background: isEquipped
                      ? 'rgba(74,222,128,0.06)'
                      : 'rgba(255,255,255,0.03)',
                    border: isEquipped
                      ? '1px solid rgba(74,222,128,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '16px 12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.2s',
                    cursor: 'default',
                    position: 'relative',
                  }}
                >
                  {isEquipped && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      fontSize: 10, fontWeight: 700, color: '#4ade80',
                      background: 'rgba(74,222,128,0.15)',
                      border: '1px solid rgba(74,222,128,0.3)',
                      borderRadius: 6, padding: '2px 6px',
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                      Equipped
                    </span>
                  )}

                  {/* Name paint preview or default icon */}
                  {activeTab === 'name_paint' ? (
                    <div style={{
                      height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 18, fontWeight: 700,
                        ...(paintStyle || { color: 'rgba(255,255,255,0.6)' }),
                      }}>
                        {username || 'Player'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 36 }}>{item.icon || '✨'}</div>
                  )}

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2,
                    }}>
                      {item.name}
                    </div>
                    {item.rarity && (
                      <div style={{
                        fontSize: 11, fontWeight: 600,
                        color: rarityColor(item.rarity),
                        fontFamily: "'Nunito', sans-serif",
                      }}>
                        {item.rarity}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleEquip(item.cosmetic_id, item.type, isEquipped)}
                    disabled={isActing}
                    style={{
                      width: '100%', padding: '7px 0', borderRadius: 8, cursor: isActing ? 'not-allowed' : 'pointer',
                      border: isEquipped
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid rgba(124,58,237,0.4)',
                      background: isEquipped
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(124,58,237,0.15)',
                      color: isEquipped ? '#f87171' : '#c084fc',
                      fontWeight: 700, fontSize: 12,
                      fontFamily: "'Nunito', sans-serif",
                      opacity: isActing ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isActing ? '...' : isEquipped ? 'Unequip' : 'Equip'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function rarityColor(rarity) {
  const map = {
    Common: '#9ca3af',
    Uncommon: '#4ade80',
    Rare: '#60a5fa',
    Epic: '#a855f7',
    Legendary: '#f97316',
  };
  return map[rarity] || '#9ca3af';
}
