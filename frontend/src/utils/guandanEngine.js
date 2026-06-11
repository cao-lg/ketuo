// ============================================================
// 掼蛋游戏引擎 - 完整复刻版
// 完整规则 + 智能 AI
// ============================================================

// ---------- 导入高级 AI 模块 ----------
import { AdvancedAI, DIFFICULTY_CONFIG } from './advancedAI.js';

// ---------- 基础常量 ----------
export const SUITS = ['S', 'H', 'C', 'D'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export const SUIT_NAMES = { 'S': '黑桃', 'H': '红桃', 'C': '梅花', 'D': '方块' };

export const RANK_NAMES = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  'B': '小王', 'R': '大王'
};

export const PATTERN_NAMES = {
  'Single': '单张',
  'Pair': '对子',
  'Trips': '三条',
  'FullHouse': '三带二',
  'Straight': '顺子',
  'TwoTrips': '连对',
  'Plate': '钢板',
  'Bomb': '炸弹',
  'StraightFlush': '同花顺',
  'FourKings': '天王炸',
  'PASS': '过牌'
};

// ---------- 牌操作 ----------
export function createDeck() {
  const deck = [];
  for (let d = 0; d < 2; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(suit + rank);
      }
    }
    deck.push('SB');
    deck.push('HR');
  }
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < deck.length; i++) {
    hands[i % 4].push(deck[i]);
  }
  return hands.map(h => sortHand(h));
}

export function getCardSuit(card) {
  if (card === 'SB' || card === 'HR') return null;
  return card[0];
}
export function getCardRank(card) {
  if (card === 'SB') return 'B';
  if (card === 'HR') return 'R';
  return card.slice(1);
}
export function isJoker(card) { return card === 'SB' || card === 'HR'; }
export function isSmallJoker(card) { return card === 'SB'; }
export function isRedJoker(card) { return card === 'HR'; }

// 计算牌面值（不含级牌概念，用于生成顺子/连对时的"原始值"）
// 2=2, 3=3, ... T=10, J=11, Q=12, K=13, A=14, 小王=15, 大王=16
function getCardFaceValue(card) {
  if (card === 'HR') return 16;
  if (card === 'SB') return 15;
  const rank = getCardRank(card);
  const map = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9,
                'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
  return map[rank] || 0;
}

// 计算牌的当前大小（考虑级牌）
// 大王17, 小王16, 红桃级牌15, 其它级牌14, 其它按面值
export function getCardValue(card, currentRank) {
  if (card === 'HR') return 17;
  if (card === 'SB') return 16;
  const rank = getCardRank(card);
  const suit = getCardSuit(card);
  if (rank === currentRank && suit === 'H') return 15;
  if (rank === currentRank) return 14;
  return getCardFaceValue(card);
}

export function sortHand(hand) {
  return [...hand].sort((a, b) => {
    const va = getCardValue(a, '2');
    const vb = getCardValue(b, '2');
    if (va !== vb) return va - vb;
    const suitOrder = { 'S': 1, 'H': 2, 'C': 3, 'D': 4 };
    const sa = getCardSuit(a) || 'S';
    const sb = getCardSuit(b) || 'S';
    return suitOrder[sa] - suitOrder[sb];
  });
}

// 判断是否是红桃万能牌 (红桃级牌可以代替任意牌)
function isHeartsJoker(card, currentRank) {
  const suit = getCardSuit(card);
  const rank = getCardRank(card);
  return suit === 'H' && rank === currentRank;
}

// 使用万能牌检查顺子
function checkStraightWithJokers(values, heartsCount, currentRank) {
  const sortedVals = [...values].sort((a, b) => a - b);
  const uniqueVals = [...new Set(sortedVals)];
  
  // 尝试用万能牌填补空缺
  let missing = 0;
  for (let i = 1; i < uniqueVals.length; i++) {
    const gap = uniqueVals[i] - uniqueVals[i - 1] - 1;
    missing += gap;
  }
  
  return missing <= heartsCount;
}

// 使用万能牌检查对子
function checkPairWithJokers(counts, heartsCount) {
  const countValues = Object.values(counts).sort((a, b) => b - a);
  if (countValues[0] === 2) return true;
  if (countValues[0] === 1 && heartsCount >= 1) return true;
  return false;
}

// 使用万能牌检查三条
function checkTripsWithJokers(counts, heartsCount) {
  const countValues = Object.values(counts).sort((a, b) => b - a);
  if (countValues[0] === 3) return true;
  if (countValues[0] === 2 && heartsCount >= 1) return true;
  if (countValues[0] === 1 && heartsCount >= 2) return true;
  return false;
}

// ============================================================
// 牌型识别
// ============================================================
export function identifyPattern(cards, currentRank) {
  if (!cards || cards.length === 0) return null;

  const sorted = [...cards].sort((a, b) => getCardValue(a, currentRank) - getCardValue(b, currentRank));
  const hasJoker = sorted.some(isJoker);
  const hasHeartsJoker = sorted.some(c => isHeartsJoker(c, currentRank));
  const heartsCount = sorted.filter(c => isHeartsJoker(c, currentRank)).length;
  
  // 提取非万能牌的面值用于判断
  const nonHeartsCards = sorted.filter(c => !isHeartsJoker(c, currentRank));
  const values = nonHeartsCards.map(c => getCardFaceValue(c));
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const uniqueVals = Object.keys(counts).map(v => parseInt(v)).sort((a, b) => a - b);
  const countValues = Object.values(counts).sort((a, b) => b - a);

  // 天王炸 - 4个大小王
  if (cards.length === 4 && sorted.every(isJoker)) {
    return { type: 'FourKings', rank: 100, cards: sorted };
  }

  // 炸弹 - N张同点 (N>=4)
  if (cards.length >= 4 && !hasJoker) {
    if (uniqueVals.length === 1) {
      return { type: 'Bomb', rank: values[0], cards: sorted, size: cards.length };
    }
  }

  // 单张
  if (cards.length === 1) {
    return { type: 'Single', rank: getCardValue(cards[0], currentRank), cards: sorted };
  }

  // 对子 (支持红桃万能牌)
  if (cards.length === 2 && !hasJoker) {
    if (uniqueVals.length === 1 || (hasHeartsJoker && uniqueVals.length === 1)) {
      const baseCard = nonHeartsCards.length > 0 ? nonHeartsCards[0] : cards[0];
      return { type: 'Pair', rank: getCardValue(baseCard, currentRank), cards: sorted };
    }
    // 单张+红桃万能牌
    if (hasHeartsJoker && nonHeartsCards.length === 1) {
      return { type: 'Pair', rank: getCardValue(nonHeartsCards[0], currentRank), cards: sorted };
    }
  }
  // 双王对子
  if (cards.length === 2 && sorted.every(isJoker)) {
    return { type: 'Pair', rank: 16, cards: sorted };
  }

  // 三条 (支持红桃万能牌)
  if (cards.length === 3 && !hasJoker) {
    // 纯三条
    if (uniqueVals.length === 1 && !hasHeartsJoker) {
      return { type: 'Trips', rank: getCardValue(cards[0], currentRank), cards: sorted };
    }
    // 两条+红桃万能牌
    if (hasHeartsJoker && countValues[0] === 2 && heartsCount >= 1) {
      const baseCard = nonHeartsCards.find(c => getCardFaceValue(c) === parseInt(Object.keys(counts).find(k => counts[k] === 2)));
      return { type: 'Trips', rank: getCardValue(baseCard, currentRank), cards: sorted };
    }
    // 单张+两张红桃万能牌
    if (hasHeartsJoker && countValues[0] === 1 && heartsCount >= 2) {
      return { type: 'Trips', rank: getCardValue(nonHeartsCards[0], currentRank), cards: sorted };
    }
  }

  // 三带二
  if (cards.length === 5 && !hasJoker) {
    if (countValues[0] === 3 && countValues[1] === 2) {
      const tripVal = parseInt(Object.keys(counts).find(k => counts[k] === 3));
      return { type: 'FullHouse', rank: tripVal, cards: sorted };
    }
  }

  // 顺子 (5张连续单张, 不含王)
  if (cards.length === 5 && !hasJoker) {
    // 纯顺子
    if (!hasHeartsJoker && uniqueVals.length === 5) {
      const sortedU = uniqueVals.slice();
      let isStraight = true;
      for (let i = 1; i < sortedU.length; i++) {
        if (sortedU[i] - sortedU[i-1] !== 1) { isStraight = false; break; }
      }
      if (isStraight && sortedU[sortedU.length - 1] <= 14) {
        const suits = sorted.map(c => getCardSuit(c));
        const uniqueSuits = [...new Set(suits)];
        if (uniqueSuits.length === 1) {
          return { type: 'StraightFlush', rank: sortedU[0], cards: sorted };
        }
        return { type: 'Straight', rank: sortedU[0], cards: sorted };
      }
    }
    
    // 支持红桃万能牌的顺子
    if (hasHeartsJoker && uniqueVals.length + heartsCount >= 5) {
      // 尝试用万能牌填补空缺形成顺子
      const sortedU = uniqueVals.slice();
      let gaps = 0;
      for (let i = 1; i < sortedU.length; i++) {
        gaps += sortedU[i] - sortedU[i-1] - 1;
      }
      
      if (gaps <= heartsCount && sortedU[sortedU.length - 1] <= 14) {
        // 确定顺子的起始值
        let startVal = sortedU[0];
        // 如果第一张牌前有空缺，万能牌可以填补
        if (sortedU.length + heartsCount === 5) {
          // 万能牌可以延伸顺子
        }
        
        const suits = sorted.map(c => getCardSuit(c));
        const uniqueSuits = [...new Set(suits.filter(s => s))];
        
        // 带万能牌的顺子不算同花顺
        return { type: 'Straight', rank: startVal, cards: sorted };
      }
    }
  }

  // 连对 (3组连续对子 = 6张, 不含王)
  if (cards.length === 6 && !hasJoker) {
    if (uniqueVals.length === 3 && Object.values(counts).every(c => c === 2)) {
      let isConsecutive = true;
      for (let i = 1; i < uniqueVals.length; i++) {
        if (uniqueVals[i] - uniqueVals[i-1] !== 1) { isConsecutive = false; break; }
      }
      if (isConsecutive && uniqueVals[uniqueVals.length - 1] <= 14) {
        return { type: 'TwoTrips', rank: uniqueVals[0], cards: sorted };
      }
    }
  }

  // 钢板 (2组连续三条 = 6张, 不含王)
  if (cards.length === 6 && !hasJoker) {
    if (uniqueVals.length === 2 && Object.values(counts).every(c => c === 3)) {
      let isConsecutive = true;
      for (let i = 1; i < uniqueVals.length; i++) {
        if (uniqueVals[i] - uniqueVals[i-1] !== 1) { isConsecutive = false; break; }
      }
      if (isConsecutive && uniqueVals[uniqueVals.length - 1] <= 14) {
        return { type: 'Plate', rank: uniqueVals[0], cards: sorted };
      }
    }
  }

  return null;
}

// ============================================================
// 牌型比较
// ============================================================
export function compareActions(newAction, oldAction) {
  if (!oldAction) return true;
  if (!newAction) return false;
  if (oldAction.type === 'PASS') return true;
  if (newAction.type === 'PASS') return false;

  // 天王炸 - 最大
  if (newAction.type === 'FourKings') return oldAction.type !== 'FourKings';
  if (oldAction.type === 'FourKings') return false;

  // 同花顺 - 比普通炸弹大, 比天王炸小
  if (newAction.type === 'StraightFlush') {
    if (oldAction.type === 'FourKings') return false;
    if (oldAction.type === 'StraightFlush') return newAction.rank > oldAction.rank;
    if (oldAction.type === 'Bomb') return true;
    return true; // 可以压任意非炸弹牌型
  }
  if (oldAction.type === 'StraightFlush') {
    if (newAction.type === 'FourKings') return true;
    if (newAction.type === 'StraightFlush') return newAction.rank > oldAction.rank;
    return false;
  }

  // 普通炸弹
  if (newAction.type === 'Bomb') {
    if (oldAction.type === 'Bomb') {
      if (newAction.size !== oldAction.size) return newAction.size > oldAction.size;
      return newAction.rank > oldAction.rank;
    }
    // 炸弹压非炸弹
    return newAction.size >= 4;
  }
  if (oldAction.type === 'Bomb') return false; // 非炸弹不能压炸弹

  // 普通牌型 - 必须类型相同, 张数相同
  if (newAction.type !== oldAction.type) return false;

  return newAction.rank > oldAction.rank;
}

// ============================================================
// 生成所有合法出牌
// ============================================================

// 工具: 从手牌构建 值 -> [牌] 的映射
function buildValueMap(hand, currentRank) {
  const map = {};
  for (const card of hand) {
    if (isJoker(card)) continue; // 王牌单独处理
    const val = getCardFaceValue(card);
    if (!map[val]) map[val] = [];
    map[val].push(card);
  }
  return map;
}

// 找出 N 张连续递增的值
function findConsecutiveValues(sortedUniqueVals, length) {
  const results = [];
  for (let i = 0; i <= sortedUniqueVals.length - length; i++) {
    let ok = true;
    for (let j = 1; j < length; j++) {
      if (sortedUniqueVals[i + j] - sortedUniqueVals[i + j - 1] !== 1) { ok = false; break; }
    }
    if (ok) {
      const seq = [];
      for (let j = 0; j < length; j++) seq.push(sortedUniqueVals[i + j]);
      // 不能超过 A(14)
      if (seq[seq.length - 1] <= 14) results.push(seq);
    }
  }
  return results;
}

export function getLegalActions(hand, lastAction, currentRank) {
  const actions = [];
  const valueMap = buildValueMap(hand, currentRank);
  const sortedVals = Object.keys(valueMap).map(v => parseInt(v)).sort((a, b) => a - b);
  const jokers = hand.filter(isJoker);
  const sortedHand = [...hand].sort((a, b) => getCardValue(a, currentRank) - getCardValue(b, currentRank));

  // ---------- 生成单张 (考虑当前级牌的实际大小) ----------
  const seenSingleRanks = new Set();
  for (const card of sortedHand) {
    const rank = getCardValue(card, currentRank);
    if (!seenSingleRanks.has(rank)) {
      seenSingleRanks.add(rank);
      const act = { type: 'Single', rank: rank, cards: [card] };
      if (!lastAction || compareActions(act, lastAction)) actions.push(act);
    }
  }

  // ---------- 生成对子 ----------
  // 普通对子
  for (const val of sortedVals) {
    if (valueMap[val].length >= 2) {
      const twoCards = valueMap[val].slice(0, 2);
      const act = { type: 'Pair', rank: getCardValue(twoCards[0], currentRank), cards: twoCards };
      if (!lastAction || compareActions(act, lastAction)) actions.push(act);
    }
  }
  // 对王
  if (jokers.length >= 2) {
    const act = { type: 'Pair', rank: 16, cards: jokers.slice(0, 2) };
    if (!lastAction || compareActions(act, lastAction)) actions.push(act);
  }

  // ---------- 生成三条 ----------
  for (const val of sortedVals) {
    if (valueMap[val].length >= 3) {
      const threeCards = valueMap[val].slice(0, 3);
      const act = { type: 'Trips', rank: getCardValue(threeCards[0], currentRank), cards: threeCards };
      if (!lastAction || compareActions(act, lastAction)) actions.push(act);
    }
  }

  // ---------- 生成三带二 ----------
  for (const tripVal of sortedVals) {
    if (valueMap[tripVal].length >= 3) {
      const tripCards = valueMap[tripVal].slice(0, 3);
      for (const pairVal of sortedVals) {
        if (pairVal === tripVal) continue;
        if (valueMap[pairVal].length >= 2) {
          const fiveCards = [...tripCards, ...valueMap[pairVal].slice(0, 2)];
          const act = { type: 'FullHouse', rank: tripVal, cards: fiveCards };
          if (!lastAction || compareActions(act, lastAction)) {
            actions.push(act);
            break; // 每个三条只需要一个带对
          }
        }
      }
    }
  }

  // ---------- 生成顺子 (5张连续单张) ----------
  const singleVals = sortedVals.filter(v => valueMap[v].length >= 1);
  const straightSeqs = findConsecutiveValues(singleVals, 5);
  for (const seq of straightSeqs) {
    const fiveCards = seq.map(v => valueMap[v][0]);
    // 检查花色是否多样 (非同花顺) - 其实同花顺应该单独识别
    const suits = fiveCards.map(c => getCardSuit(c));
    const uniqueSuits = [...new Set(suits)];
    if (uniqueSuits.length === 1) continue; // 这是同花顺，留给下面生成
    const act = { type: 'Straight', rank: seq[0], cards: fiveCards };
    if (!lastAction || compareActions(act, lastAction)) actions.push(act);
  }

  // ---------- 生成同花顺 (5张连续同花色) ----------
  // 按花色分组, 再找顺子
  const suitGroups = { 'S': [], 'H': [], 'C': [], 'D': [] };
  for (const card of sortedHand) {
    if (isJoker(card)) continue;
    const s = getCardSuit(card);
    if (s) suitGroups[s].push(card);
  }
  for (const suit of Object.keys(suitGroups)) {
    if (suitGroups[suit].length < 5) continue;
    const vals = [...new Set(suitGroups[suit].map(c => getCardFaceValue(c)))].sort((a, b) => a - b);
    const seqs = findConsecutiveValues(vals, 5);
    for (const seq of seqs) {
      const fiveCards = [];
      for (const v of seq) {
        const found = suitGroups[suit].find(c => getCardFaceValue(c) === v);
        if (found) fiveCards.push(found);
      }
      if (fiveCards.length === 5) {
        const act = { type: 'StraightFlush', rank: seq[0], cards: fiveCards };
        if (!lastAction || compareActions(act, lastAction)) actions.push(act);
      }
    }
  }

  // ---------- 生成连对 (3组连续对子 = 6张) ----------
  const pairVals = sortedVals.filter(v => valueMap[v].length >= 2);
  const twoTripSeqs = findConsecutiveValues(pairVals, 3);
  for (const seq of twoTripSeqs) {
    const sixCards = [];
    for (const v of seq) sixCards.push(...valueMap[v].slice(0, 2));
    const act = { type: 'TwoTrips', rank: seq[0], cards: sixCards };
    if (!lastAction || compareActions(act, lastAction)) actions.push(act);
  }

  // ---------- 生成钢板 (2组连续三条 = 6张) ----------
  const tripVals = sortedVals.filter(v => valueMap[v].length >= 3);
  const plateSeqs = findConsecutiveValues(tripVals, 2);
  for (const seq of plateSeqs) {
    const sixCards = [];
    for (const v of seq) sixCards.push(...valueMap[v].slice(0, 3));
    const act = { type: 'Plate', rank: seq[0], cards: sixCards };
    if (!lastAction || compareActions(act, lastAction)) actions.push(act);
  }

  // ---------- 生成炸弹 (4张及以上同点) ----------
  for (const val of sortedVals) {
    const len = valueMap[val].length;
    if (len >= 4) {
      // 4张, 5张... 分别是不同大小的炸弹
      for (let size = 4; size <= len; size++) {
        const bombCards = valueMap[val].slice(0, size);
        // 炸弹的rank使用原始面值，不考虑级牌（级牌影响单张大小但不影响炸弹大小）
        const act = { type: 'Bomb', rank: val, cards: bombCards, size: size };
        if (!lastAction || compareActions(act, lastAction)) actions.push(act);
      }
    }
  }

  // ---------- 天王炸 ----------
  if (jokers.length >= 4) {
    const act = { type: 'FourKings', rank: 100, cards: jokers.slice(0, 4) };
    if (!lastAction || compareActions(act, lastAction)) actions.push(act);
  }

  // 最后加 PASS
  actions.push({ type: 'PASS', rank: 0, cards: [] });
  return actions;
}

// ============================================================
// 智能 AI 出牌
// ============================================================
// 牌型优先级(用于决定首攻出什么小牌): 越小的牌越优先出
// 出牌策略:
//   - 首攻: 优先出小单张; 或者最小的对子/三条; 不主动出顺子/炸弹
//   - 压牌: 优先压同类型最小牌; 没同类型用炸弹; 不轻易炸
//   - 剩牌少时: 考虑冲牌, 尽快出完
//   - 不浪费大炸弹/王牌
//   - 队友领先(队友是最近出牌者)时可以PASS

// 全局 AI 实例缓存
const aiInstances = {};

// 初始化高级 AI 的工具函数
import { setToolFunctions as setAIToolFunctions } from './advancedAI.js';

export function initializeAI() {
  setAIToolFunctions(getLegalActions, compareActions);
}

export function aiChooseAction(hand, lastAction, currentRank, isFirst, mySeat, lastActionSeat, handsCount, difficulty = 'medium') {
  // 获取或创建 AI 实例
  if (!aiInstances[mySeat]) {
    aiInstances[mySeat] = new AdvancedAI(mySeat, difficulty);
  } else {
    aiInstances[mySeat].setDifficulty(difficulty);
  }
  
  const ai = aiInstances[mySeat];
  
  // 调用高级 AI
  const action = ai.chooseAction(hand, lastAction, currentRank, isFirst, lastActionSeat, handsCount);
  
  // 更新记牌器
  if (action.type !== 'PASS' && action.cards.length > 0) {
    ai.updateTracker(mySeat, action.cards);
  }
  
  return action;
}

// 重置所有 AI 实例
export function resetAI() {
  Object.keys(aiInstances).forEach(seat => {
    aiInstances[seat].reset();
  });
}

// 导出难度配置
export { DIFFICULTY_CONFIG };

// ============================================================
// 游戏状态管理
// ============================================================
export class GameState {
  constructor() { this.reset(); }

  reset() {
    this.phase = 'idle';
    this.hands = [[], [], [], []];
    this.currentSeat = 0;
    this.roundStartSeat = 0;
    this.lastAction = null;
    this.lastActionSeat = -1;
    this.currentRank = '2';
    this.teamRanks = [2, 2, 2, 2];
    this.heartsCount = [0, 0, 0, 0];
    this.playArea = [null, null, null, null];
    this.playedCards = [[], [], [], []];
    this.history = [];
    this.passCount = 0;
    this.finishOrder = [];
    this.gameRound = 1;
    this.team0Score = 0;
    this.team1Score = 0;
    this.winner = -1;
    this.messages = [];
    // 进贡/还贡相关
    this.tributeShip = [];
    this.backShip = [];
    this.antiTribute = false;
    this.antiTributePlayers = [];
  }

  startNewGame() {
    // 保存上一局的进贡信息（如果有）
    const pendingTribute = this.tributeShip.length > 0 ? [...this.tributeShip] : [];
    const pendingBack = this.backShip.length > 0 ? [...this.backShip] : [];
    const hasAntiTribute = this.antiTribute;

    // 保存当前级别（不重置 teamRanks 和 currentRank）
    const savedRank = this.currentRank;
    const savedTeamRanks = [...this.teamRanks];
    const savedScores = [this.team0Score, this.team1Score];
    const savedGameRound = this.gameRound;
    const firstPlaceFromLastGame = this.finishOrder.length > 0 ? this.finishOrder[0] : -1;

    this.phase = 'idle';
    this.hands = [[], [], [], []];
    this.currentSeat = 0;
    this.roundStartSeat = 0;
    this.lastAction = null;
    this.lastActionSeat = -1;
    this.heartsCount = [0, 0, 0, 0];
    this.playArea = [null, null, null, null];
    this.playedCards = [[], [], [], []];
    this.history = [];
    this.passCount = 0;
    this.finishOrder = [];
    this.team0Score = savedScores[0];
    this.team1Score = savedScores[1];
    this.winner = -1;
    this.messages = [];
    this.tributeShip = [];
    this.backShip = [];
    this.antiTribute = false;
    this.antiTributePlayers = [];

    // 恢复当前级别
    this.currentRank = savedRank;
    this.teamRanks = savedTeamRanks;
    // 如果是第一局（没有进贡信息），保持 gameRound = 1，否则递增
    if (pendingTribute.length > 0 || hasAntiTribute) {
      this.gameRound = savedGameRound + 1;
    } else {
      this.gameRound = savedGameRound;
    }

    const deck = shuffleDeck(createDeck());
    this.hands = dealCards(deck);

    // 执行进贡/还贡（非第一局）
    if (pendingTribute.length > 0 && !hasAntiTribute) {
      this.performTribute(pendingTribute, pendingBack);
    }

    this.phase = 'play';
    // 第一局随机出牌；之后由上局头游或其对家出牌
    if (pendingTribute.length > 0 && !hasAntiTribute && firstPlaceFromLastGame >= 0) {
      // 进贡后，由获得进贡的一方（头游）先出牌
      // 在掼蛋中，进贡结束后，接受进贡的玩家（上局头游）先出牌
      // 但由于我们是自动进贡，由上局的第一名先出牌
      this.currentSeat = firstPlaceFromLastGame;
    } else if (hasAntiTribute && firstPlaceFromLastGame >= 0) {
      // 抗贡后，由抗贡方先出牌
      this.currentSeat = firstPlaceFromLastGame;
    } else {
      // 第一局随机
      this.currentSeat = Math.floor(Math.random() * 4);
    }
    this.roundStartSeat = this.currentSeat;
    this.lastAction = null;
    this.lastActionSeat = -1;
  }

  // 执行进贡和还贡
  performTribute(tributePairs, backPairs) {
    this.messages = [];

    // 1. 进贡：输家给赢家最大的牌（非级牌、非王）
    for (const [fromSeat, toSeat] of tributePairs) {
      const maxCard = this.getMaxCard(fromSeat);
      if (maxCard) {
        const fromIdx = this.hands[fromSeat].indexOf(maxCard);
        if (fromIdx !== -1) {
          this.hands[fromSeat].splice(fromIdx, 1);
          this.hands[toSeat].push(maxCard);
          this.messages.push(`玩家${fromSeat}进贡 ${maxCard} 给玩家${toSeat}`);
        }
      }
    }

    // 2. 还贡：赢家给输家一张小于等于10的牌
    for (const [fromSeat, toSeat] of backPairs) {
      const smallCard = this.getLessThanTenCard(fromSeat);
      if (smallCard) {
        const fromIdx = this.hands[fromSeat].indexOf(smallCard);
        if (fromIdx !== -1) {
          this.hands[fromSeat].splice(fromIdx, 1);
          this.hands[toSeat].push(smallCard);
          this.messages.push(`玩家${fromSeat}还贡 ${smallCard} 给玩家${toSeat}`);
        }
      }
    }
  }

  canPlayCards(seat, cards) {
    if (seat !== this.currentSeat) return false;
    const pattern = identifyPattern(cards, this.currentRank);
    if (!pattern) return false;
    if (!this.lastAction || this.lastAction.type === 'PASS') return true;
    return compareActions(pattern, this.lastAction);
  }

  playCards(seat, cards) {
    if (!this.canPlayCards(seat, cards)) return false;

    const pattern = identifyPattern(cards, this.currentRank);
    this.playArea[seat] = pattern;
    this.playedCards[seat] = cards;
    this.lastAction = pattern;
    this.lastActionSeat = seat;

    for (const card of cards) {
      const idx = this.hands[seat].indexOf(card);
      if (idx !== -1) this.hands[seat].splice(idx, 1);
    }

    this.passCount = 0;

    if (this.hands[seat].length === 0) {
      if (!this.finishOrder.includes(seat)) this.finishOrder.push(seat);
      // 只有当 episode_over() 返回 true 时，或者所有4人都已完成，才结束游戏
      // episode_over: 最后一名玩家的对家是否已在完成顺序中
      if ((this.finishOrder.length >= 3 && this.episodeOver()) || this.finishOrder.length === 4) {
        // 确保finishOrder包含所有4个玩家（如果还没包含）
        while (this.finishOrder.length < 4) {
          for (let i = 0; i < 4; i++) {
            if (!this.finishOrder.includes(i)) { this.finishOrder.push(i); break; }
          }
          break; // 只循环一次
        }
        this.endGame();
        return true;
      }
    }

    this.currentSeat = (this.currentSeat + 1) % 4;
    this.ensureNextPlayerHasCards();
    return true;
  }

  pass(seat) {
    if (seat !== this.currentSeat) return false;
    this.passCount++;
    this.playArea[seat] = null;
    this.playedCards[seat] = [];

    if (this.passCount >= 3) {
      // 三个玩家都不要 - 检查是否触发队友接风规则
      const lastPlayer = this.lastActionSeat;
      const lastPlayerFinished = lastPlayer >= 0 && this.hands[lastPlayer].length === 0;

      this.lastAction = null;
      this.lastActionSeat = -1;
      this.passCount = 0;

      if (lastPlayerFinished) {
        // 上一个出牌的玩家已经出完牌 - 队友接风规则
        const teammateSeat = (lastPlayer + 2) % 4;
        if (this.hands[teammateSeat].length > 0) {
          // 队友还有牌，由队友获得自由出牌权
          this.currentSeat = teammateSeat;
        } else {
          // 队友也已经出完牌，找下一个有牌的玩家
          this.currentSeat = this.findNextPlayerWithCards(lastPlayer);
        }
      } else {
        // 正常情况：找下一个有牌的玩家
        this.currentSeat = this.findNextPlayerWithCards(this.currentSeat);
      }
    } else {
      this.currentSeat = (this.currentSeat + 1) % 4;
      this.ensureNextPlayerHasCards();
    }
    return true;
  }

  findNextPlayerWithCards(startSeat) {
    for (let i = 1; i <= 4; i++) {
      const seat = (startSeat + i) % 4;
      if (this.hands[seat].length > 0) return seat;
    }
    return startSeat;
  }

  ensureNextPlayerHasCards() {
    let guard = 0;
    while (this.hands[this.currentSeat].length === 0 && this.finishOrder.length < 4 && guard < 8) {
      this.currentSeat = (this.currentSeat + 1) % 4;
      guard++;
    }
  }

  // 检查游戏是否应该结束
  // 条件1: 3人出完牌
  // 条件2: 对家两人都出完（队伍已经赢了）
  episodeOver() {
    if (this.finishOrder.length >= 3) return true;

    // 检查对家是否都出完了
    const team0 = [0, 2]; // 红队
    const team1 = [1, 3]; // 蓝队
    const team0Done = team0.every(p => this.finishOrder.includes(p));
    const team1Done = team1.every(p => this.finishOrder.includes(p));
    return team0Done || team1Done;
  }

  endGame() {
    const firstPlace = this.finishOrder[0];
    const secondPlace = this.finishOrder[1];
    const thirdPlace = this.finishOrder[2];
    const fourthPlace = this.finishOrder[3];

    const firstTeam = firstPlace % 2;
    const secondTeam = secondPlace % 2;

    let rankIncrease = 0;
    let tributeShip = [];
    let backShip = [];

    if (firstTeam === secondTeam) {
      rankIncrease = 3;
      this.winner = firstTeam;
      tributeShip = [[fourthPlace, secondPlace], [thirdPlace, firstPlace]];
      backShip = [[firstPlace, thirdPlace], [secondPlace, fourthPlace]];
    } else if ((firstPlace + 2) % 4 === thirdPlace) {
      rankIncrease = 2;
      this.winner = firstTeam;
      tributeShip = [[fourthPlace, firstPlace]];
      backShip = [[firstPlace, fourthPlace]];
    } else {
      rankIncrease = 1;
      this.winner = firstTeam;
      tributeShip = [[fourthPlace, firstPlace]];
      backShip = [[firstPlace, fourthPlace]];
    }

    this.tributeShip = tributeShip;
    this.backShip = backShip;

    if (firstTeam === 0) {
      this.team0Score += 1;
      this.teamRanks[0] = Math.min(14, this.teamRanks[0] + rankIncrease);
      this.teamRanks[2] = Math.min(14, this.teamRanks[2] + rankIncrease);
    } else {
      this.team1Score += 1;
      this.teamRanks[1] = Math.min(14, this.teamRanks[1] + rankIncrease);
      this.teamRanks[3] = Math.min(14, this.teamRanks[3] + rankIncrease);
    }

    const rankMap = { 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 8:'8', 9:'9', 10:'T', 11:'J', 12:'Q', 13:'K', 14:'A' };
    const nextRank = this.winner === 0 ? this.teamRanks[0] : this.teamRanks[1];
    this.currentRank = rankMap[nextRank] || '2';

    this.checkAntiTribute();
    if (!this.antiTribute) {
      this.phase = 'tribute';
    } else {
      this.phase = 'gameover';
    }
  }

  checkAntiTribute() {
    const fourthPlace = this.finishOrder[3];
    const thirdPlace = this.finishOrder[2];
    const firstPlace = this.finishOrder[0];

    const fourthRedJokers = this.hands[fourthPlace].filter(c => c === 'HR').length;
    const thirdRedJokers = this.hands[thirdPlace].filter(c => c === 'HR').length;

    if (this.tributeShip.length === 2) {
      if (fourthRedJokers === 2 || thirdRedJokers === 2) {
        this.antiTribute = true;
        this.antiTributePlayers = [fourthPlace, thirdPlace];
      } else if (fourthRedJokers === 1 && thirdRedJokers === 1) {
        this.antiTribute = true;
        this.antiTributePlayers = [fourthPlace, thirdPlace];
      }
    } else {
      if (fourthRedJokers === 2) {
        this.antiTribute = true;
        this.antiTributePlayers = [fourthPlace];
      }
    }

    if (this.antiTribute) {
      this.tributeCards = [];
      this.backCards = [];
      this.roundStartSeat = firstPlace;
    }
  }

  getMaxCard(seat) {
    const hand = this.hands[seat];
    const rankOrder = { '2':15, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14, 'B':16, 'R':17 };
    let maxCard = null;
    let maxValue = -1;
    for (const card of hand) {
      const rank = card[1];
      if (card === 'H' + this.currentRank) continue;
      const value = rankOrder[rank] || 0;
      if (value > maxValue) {
        maxValue = value;
        maxCard = card;
      }
    }
    return maxCard;
  }

  getLessThanTenCard(seat) {
    const hand = this.hands[seat];
    const tenCards = hand.filter(c => {
      const rank = c[1];
      if (rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A') return false;
      if (rank === 'B' || rank === 'R') return false;
      if (c === 'H' + this.currentRank) return false;
      return true;
    });
    if (tenCards.length === 0) return null;
    return tenCards[0];
  }

  getLegalActionsForPlayer(seat) {
    const hand = this.hands[seat];
    return getLegalActions(hand, this.lastAction, this.currentRank);
  }
}

// AI 辅助接口 (旧接口兼容)
export function aiChooseTribute(hand, currentRank) {
  const sorted = sortHand(hand);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (!isJoker(sorted[i])) return { type: 'tribute', rank: getCardRank(sorted[i]), cards: [sorted[i]] };
  }
  return { type: 'tribute', rank: 'B', cards: [sorted[sorted.length - 1]] };
}

export function aiChooseBack(hand, currentRank) {
  const sorted = sortHand(hand);
  for (let i = 0; i < sorted.length; i++) {
    if (!isJoker(sorted[i]) && getCardValue(sorted[i], currentRank) <= 10) {
      return { type: 'back', rank: getCardRank(sorted[i]), cards: [sorted[i]] };
    }
  }
  return { type: 'back', rank: getCardRank(sorted[0]), cards: [sorted[0]] };
}
