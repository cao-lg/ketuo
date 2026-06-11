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
  
  if (card.type === 'joker-small') return 'card-joker-small'
  if (card.type === 'joker-big') return 'card-joker-big'
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
  'PASS': '过牌'
}

export function getPatternName(pattern) {
  return PATTERN_NAMES[pattern] || pattern
}

export function createDeck() {
  const deck = []
  const suits = ['S', 'H', 'C', 'D']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(suit + rank)
    }
  }
  deck.push('SB')
  deck.push('HR')
  return deck
}

export function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function distributeCards(deck) {
  const hands = [[], [], [], []]
  for (let i = 0; i < 27; i++) {
    hands[i % 4].push(deck[i])
  }
  for (let i = 27; i < 54; i++) {
    hands[Math.floor((i - 27) / 6)].push(deck[i])
  }
  return hands.map(h => sortCards(h))
}

export function getPattern(cards) {
  if (!cards || cards.length === 0) return null
  
  const sorted = sortCards(cards)
  const orders = sorted.map(c => parseCard(c)?.order || 0)
  const ranks = sorted.map(c => parseCard(c)?.rank || '')
  
  if (cards.length === 1) {
    return { type: 'Single', rank: ranks[0], cards: sorted }
  }
  
  if (cards.length === 2) {
    if (orders[0] >= 15) {
      return { type: 'Pair', rank: ranks[0], cards: sorted }
    }
    if (orders[0] === orders[1]) {
      return { type: 'Pair', rank: ranks[0], cards: sorted }
    }
    return null
  }
  
  if (cards.length === 3) {
    if (orders[0] === orders[1] && orders[1] === orders[2]) {
      return { type: 'Trips', rank: ranks[0], cards: sorted }
    }
    return null
  }
  
  if (cards.length === 4) {
    if (orders[0] === orders[1] && orders[1] === orders[2] && orders[2] === orders[3]) {
      return { type: 'Bomb', rank: ranks[0], cards: sorted }
    }
    return null
  }
  
  return null
}

export function compareActions(action1, action2) {
  if (!action1) return false
  if (!action2) return true
  if (action1.type === 'PASS') return false
  if (action2.type === 'PASS') return true
  
  if (action1.type === 'Bomb' && action2.type !== 'Bomb') return true
  if (action1.type !== 'Bomb' && action2.type === 'Bomb') return false
  
  if (action1.type === 'Bomb' && action2.type === 'Bomb') {
    const order1 = parseCard(action1.cards[0])?.order || 0
    const order2 = parseCard(action2.cards[0])?.order || 0
    return order1 > order2
  }
  
  if (action1.type !== action2.type) return false
  
  const order1 = parseCard(action1.rank)?.order || 0
  const order2 = parseCard(action2.rank)?.order || 0
  return order1 > order2
}

export function getValidActions(handCards, lastAction) {
  const actions = []
  
  for (let i = 0; i < handCards.length; i++) {
    const cards = [handCards[i]]
    const pattern = getPattern(cards)
    if (pattern && (!lastAction || compareActions(pattern, lastAction))) {
      actions.push(pattern)
    }
  }
  
  for (let i = 0; i < handCards.length; i++) {
    for (let j = i + 1; j < handCards.length; j++) {
      const cards = [handCards[i], handCards[j]]
      const pattern = getPattern(cards)
      if (pattern && (!lastAction || compareActions(pattern, lastAction))) {
        const exists = actions.some(a => 
          a.type === pattern.type && 
          a.rank === pattern.rank && 
          a.cards.length === pattern.cards.length
        )
        if (!exists) actions.push(pattern)
      }
    }
  }
  
  for (let i = 0; i < handCards.length; i++) {
    for (let j = i + 1; j < handCards.length; j++) {
      for (let k = j + 1; k < handCards.length; k++) {
        const cards = [handCards[i], handCards[j], handCards[k]]
        const pattern = getPattern(cards)
        if (pattern && (!lastAction || compareActions(pattern, lastAction))) {
          const exists = actions.some(a => 
            a.type === pattern.type && 
            a.rank === pattern.rank && 
            a.cards.length === pattern.cards.length
          )
          if (!exists) actions.push(pattern)
        }
      }
    }
  }
  
  for (let i = 0; i < handCards.length; i++) {
    for (let j = i + 1; j < handCards.length; j++) {
      for (let k = j + 1; k < handCards.length; k++) {
        for (let l = k + 1; l < handCards.length; l++) {
          const cards = [handCards[i], handCards[j], handCards[k], handCards[l]]
          const pattern = getPattern(cards)
          if (pattern && (!lastAction || compareActions(pattern, lastAction))) {
            actions.push(pattern)
          }
        }
      }
    }
  }
  
  actions.push({ type: 'PASS', cards: [] })
  
  return actions
}

export function removeCardsFromHand(hand, cardsToRemove) {
  const result = [...hand]
  for (const card of cardsToRemove) {
    const idx = result.indexOf(card)
    if (idx > -1) {
      result.splice(idx, 1)
    }
  }
  return result
}
