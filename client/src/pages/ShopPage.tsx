import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../stores/game.store";
import type { ShopItemId } from "../shared/api/types";
import GameFrame from "../components/GameFrame";

// 타입 재정의 (스토어에서 가져옴)
import type { ShopItem } from "../stores/game.store";

function formatGold(n: number) {
  return `${n}G`;
}

export default function ShopPage() {
  const navigate = useNavigate();

  const gameData = useGameStore((s) => s.gameData);
  const userId = useGameStore((s) => s.userId);
  const buyItem = useGameStore((s) => s.buyItem);
  const shopItems = useGameStore((s) => s.shopItems);
  const isMetadataLoading = useGameStore((s) => s.isMetadataLoading);

  const stage = gameData?.currentTurn ?? 1;
  const hp = gameData?.hp ?? 0;
  const maxHp = gameData?.maxHp ?? 100;
  const gold = gameData?.gold ?? 0;
  const potions = gameData?.potions ?? 0;
  const ownedWeapons = gameData?.inventory ?? [];

  const [cart, setCart] = useState<{ id: ShopItemId; qty: number }[]>([]);
  const [notice, setNotice] = useState<string>("");
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameData || !userId) navigate('/');
  }, [gameData, userId, navigate]);

  // 장바구니 총액 계산
  const cartTotal = useMemo(() => {
    return cart.reduce((total, entry) => {
      const item = shopItems.find((it) => it.id === entry.id);
      if (!item) return total;

      // 🧪 포션은 10G 고정, 무기는 정적 가격 사용
      const unitPrice = item.id === "POTION" ? 10 : item.cost;
      return total + unitPrice * entry.qty;
    }, 0);
  }, [cart, shopItems]);

  const cartCount = useMemo(() => cart.reduce((a, b) => a + b.qty, 0), [cart]);

  const isWeapon = (item: ShopItem) => item.id !== "POTION";
  const isOwnedWeapon = (item: ShopItem) => isWeapon(item) && ownedWeapons.includes(item.weaponId!);

  const addToCart = (item: ShopItem) => {
    setNotice("");
    if (isWeapon(item)) {
      if (isOwnedWeapon(item)) {
        setNotice("이미 보유 중인 무기입니다.");
        return;
      }
      if (cart.some((c) => c.id === item.id)) {
        setNotice("무기 종류는 하나만 선택할 수 있습니다.");
        return;
      }
    }
    setCart((prev) => {
      const found = prev.find((c) => c.id === item.id);
      if (found) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id: item.id, qty: 1 }];
    });
  };

  const removeFromCart = (id: ShopItemId) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const onCheckout = async () => {
    if (cart.length === 0) return;
    if (cartTotal > gold) {
      setNotice("금화가 부족합니다!");
      return;
    }

    try {
      for (const entry of cart) {
        for (let i = 0; i < entry.qty; i++) {
          await buyItem(userId!, entry.id);
        }
      }
      setCart([]);
      setNotice("구매를 완료했습니다!");
    } catch (e) {
      setNotice("구매 도중 오류가 발생했습니다.");
    }
  };

  const onLeave = async () => {
    await useGameStore.getState().leaveShop(userId!);
    navigate("/turn");
  };

  if (isMetadataLoading) {
    return (
      <GameFrame bg="/lobby.png">
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 1 }}>상점 데이터를 불러오는 중...</div>
        </div>
      </GameFrame>
    );
  }

  return (
    <GameFrame bg="/lobby.png">
      <div style={styles.container}>
        {/* 상단 스탯 바 */}
        <div style={styles.topStats}>
          <div style={styles.statGroup}>
            <div style={styles.statItem}>❤️ <span style={{ color: '#ff5f5f' }}>{hp}</span> / {maxHp}</div>
            <div style={styles.statItem}>💰 <span style={{ color: '#ffd43b' }}>{gold}</span></div>
            <div style={styles.statItem}>🧪 <span style={{ color: '#4ade80' }}>{potions}</span></div>
          </div>
          <div style={styles.stageTitle}>STAGE {stage} : 신비한 상점</div>
          <button style={styles.leaveBtn} onClick={onLeave}>나가기</button>
        </div>

        <div style={styles.content}>
          <div style={styles.leftPane}>
            <div style={styles.grid}>
              {shopItems.map((item) => {
                const owned = isOwnedWeapon(item);
                const inCart = cart.some((c) => c.id === item.id);
                const isHover = hoverId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.card,
                      ...(owned ? styles.cardOwned : {}),
                      ...(isHover ? styles.cardHover : {}),
                    }}
                    onMouseEnter={() => setHoverId(item.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => !owned && addToCart(item)}
                  >
                    <div style={styles.cardIconBox}>
                      <img src={item.img} alt={item.title} style={styles.cardImg} draggable={false} />
                    </div>
                    <div style={styles.cardInfo}>
                      <div style={styles.cardTitleLine}>
                        <div style={styles.cardTitle}>{item.title}</div>
                        {owned && <div style={styles.ownedBadge}>보유</div>}
                      </div>
                      <div style={styles.cardEffect}>{item.effectText}</div>
                      <div style={styles.cardPrice}>{formatGold(item.cost)}</div>
                    </div>
                    {!owned && (
                      <div style={{
                        ...styles.addIndicator,
                        opacity: isHover ? 1 : 0,
                        transform: isHover ? 'translateY(0)' : 'translateY(4px)'
                      }}>
                        {inCart ? "장바구니 추가됨" : "클릭하여 담기"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.rightPane}>
            <div style={styles.cartBox}>
              <div style={styles.cartHeader}>장바구니 ({cartCount})</div>
              <div style={styles.cartList}>
                {cart.length === 0 ? (
                  <div style={styles.emptyCart}>선택된 아이템이 없습니다.</div>
                ) : (
                  cart.map((c) => {
                    const item = shopItems.find((it) => it.id === c.id);
                    return (
                      <div key={c.id} style={styles.cartItem}>
                        <div style={{ flex: 1 }}>
                          <div style={styles.cartItemTitle}>{item?.title} {c.qty > 1 && <span style={{ color: '#888' }}>x{c.qty}</span>}</div>
                          <div style={styles.cartItemPrice}>{formatGold((item?.cost || 0) * c.qty)}</div>
                        </div>
                        <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); removeFromCart(c.id); }}>×</button>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={styles.cartFooter}>
                <div style={styles.totalRow}>
                  <span>합계</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: cartTotal > gold ? "#ff4d4d" : "#ffd43b" }}>{formatGold(cartTotal)}</span>
                </div>
                {notice && <div style={{ ...styles.notice, color: notice.includes("부족") ? "#ff4d4d" : "#4ade80" }}>{notice}</div>}
                <button
                  style={{
                    ...styles.checkoutBtn,
                    opacity: cart.length === 0 || cartTotal > gold ? 0.5 : 1,
                    cursor: cart.length === 0 || cartTotal > gold ? 'not-allowed' : 'pointer',
                  }}
                  onClick={onCheckout}
                  disabled={cart.length === 0 || cartTotal > gold}
                >
                  구매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameFrame>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { padding: "30px 40px", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", color: "#fff" },
  topStats: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, zIndex: 10 },
  statGroup: { display: "flex", gap: 15, background: "rgba(0,0,0,0.55)", padding: "10px 22px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" },
  statItem: { fontSize: 18, fontWeight: 900, letterSpacing: 0.5 },
  stageTitle: { fontSize: 32, fontWeight: 950, letterSpacing: 1, textShadow: "0 4px 14px rgba(0,0,0,0.7)" },
  leaveBtn: { padding: "10px 26px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" },
  content: { flex: 1, display: "flex", gap: 30, minHeight: 0 },
  leftPane: { flex: 2.5, overflowY: "auto", paddingRight: 10 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, paddingBottom: 20 },
  card: { background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.45) 100%)", borderRadius: 22, padding: 24, border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(20px)", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", display: "flex", flexDirection: "column", gap: 15 },
  cardHover: { transform: "translateY(-6px)", borderColor: "rgba(255,255,255,0.45)", background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.55) 100%)", boxShadow: "0 22px 50px rgba(0,0,0,0.45)" },
  cardOwned: { opacity: 0.55, cursor: "default", background: "rgba(0,0,0,0.5)" },
  cardIconBox: { width: 84, height: 84, background: "rgba(0,0,0,0.4)", borderRadius: 18, display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid rgba(255,255,255,0.12)" },
  cardImg: { width: 64, height: 64, objectFit: "contain" },
  cardInfo: { display: "flex", flexDirection: "column", gap: 4 },
  cardTitleLine: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 24, fontWeight: 950 },
  ownedBadge: { fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.25)", borderRadius: 8, fontWeight: 800 },
  cardEffect: { fontSize: 15, color: "#ffd43b", fontWeight: 750 },
  cardPrice: { fontSize: 16, opacity: 0.65, fontWeight: 800, marginTop: 4 },
  addIndicator: { position: "absolute", bottom: 18, right: 24, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", transition: "all 0.3s ease" },
  rightPane: { flex: 1 },
  cartBox: { height: "100%", background: "rgba(0,0,0,0.5)", borderRadius: 26, border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(35px)", display: "flex", flexDirection: "column", padding: 26, boxSizing: "border-box" },
  cartHeader: { fontSize: 22, fontWeight: 950, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: 16 },
  cartList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
  emptyCart: { textAlign: "center", marginTop: 120, color: "rgba(255,255,255,0.35)", fontSize: 15, fontWeight: 700 },
  cartItem: { background: "rgba(255,255,255,0.06)", padding: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  cartItemTitle: { fontSize: 16, fontWeight: 850 },
  cartItemPrice: { fontSize: 14, color: "#ffd43b", fontWeight: 750 },
  removeBtn: { background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 8, display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontSize: 20 },
  cartFooter: { marginTop: 22, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 22 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  notice: { fontSize: 14, textAlign: "center", marginBottom: 18, minHeight: 18, fontWeight: 800 },
  checkoutBtn: { width: "100%", height: 58, borderRadius: 18, border: "none", background: "#ffd43b", color: "#000", fontSize: 20, fontWeight: 950, transition: "all 0.3s ease" },
};
