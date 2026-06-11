export const SUITS = {
  S: { name: '黑桃', symbol: '♠', color: 'spade' },
  H: { name: '红桃', symbol: '♥', color: 'heart' },
  C: { name: '梅花', symbol: '♣', color: 'club' },
  D: { name: '方块', symbol: '♦', color: 'diamond' }
}

export const RANKS = {
  '2': { name: '2', order: 2 },
  '3': { name: '3', order: 3 },
  '4': { name: '4', order: 4 },
  '5': { name: '5', order: 5 },
  '6': { name: '6', order: 6 },
  '7': { name: '7', order: 7 },
  '8': { name: '8', order: 8 },
  '9': { name: '9', order: 9 },
  'T': { name: '10', order: 10 },
  'J': { name: 'J', order: 11 },
  'Q': { name: 'Q', order: 12 },
  'K': { name: 'K', order: 13 },
  'A': { name: 'A', order: 14 },
  'B': { name: '小王', order: 15 },
  'R': { name: '大王', order: 16 }
}

export function parseCard(cardStr) {
  if (!cardStr || cardStr.length < 2) {
    return null
  }
  const suit = cardStr[0]
  const rank = cardStr.slice(1)
  
  if (rank === 'B' || rank === 'R') {
    return {
      suit: null,
      rank: rank,
      display: RANKS[rank]?.name || rank,
      type: rank === 'B' ? 'joker-small' : 'joker-big',
      order: RANKS[rank]?.order || 0
    }
  }
  
  return {
    suit: suit,
    rank: rank,
    display: RANKS[rank]?.name || rank,
    suitSymbol: SUITS[suit]?.symbol || suit,
    type: SUITS[suit]?.color || 'spade',
    order: RANKS[rank]?.order || 0
  }
}

export function formatCard(card) {
  if (!card) return ''
  if (card.suit) {
    return card.suit + card.rank
  }
  return card.rank
}

export function sortCards(cards) {
  return [...cards].sort((a, b) => {
    const orderA = parseCard(a)?.order || 0
    const orderB = parseCard(b)?.order || 0
    return orderA - orderB
  })
}

export function getCardClass(cardStr) {
  const card = parseCard(cardStr)
  if (!card) return ''
  
  if (card.type === 'joker-small') {
    return 'card-joker-small'
  }
  if (card.type === 'joker-big') {
    return 'card-joker-big'
  }
  return `card-${card.type}`
}

export function getCardDisplay(cardStr) {
  const card = parseCard(cardStr)
  return card?.display || cardStr
}

export function getSuitSymbol(cardStr) {
  const card = parseCard(cardStr)
  return card?.suitSymbol || ''
}

export function isJoker(cardStr) {
  return cardStr === 'B' || cardStr === 'R' || 
         (cardStr.length >= 2 && (cardStr[1] === 'B' || cardStr[1] === 'R'))
}

export const PATTERN_NAMES = {
  'Single': '单张',
  'Pair': '对子',
  'Trips': '三条',
  'ThreePair': '三对',
  'ThreeWithTwo': '三带二',
  'TwoTrips': '三连对',
  'Straight': '顺子',
  'StraightFlush': '同花顺',
  'Bomb': '炸弹',
  'FourKings': '天王炸',
  'tribute': '进贡',
  'back': '还贡',
  'PASS': '过牌'
}

export function getPatternName(pattern) {
  return PATTERN_NAMES[pattern] || pattern
}
