// ============================================================
// 高级 AI 策略模块
// ============================================================

// ------------------------------
// 记牌系统
// ------------------------------
export class CardTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalCards = this._createDeck();
    this.playedCards = {};
    this.remainingCards = {...this.totalCards};
    this.playerHistory = [[], [], [], []];
  }

  _createDeck() {
    const deck = {};
    const suits = ['H', 'S', 'C', 'D'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck[`${suit}${rank}`] = 4;
      }
    }
    deck['SB'] = 2;
    deck['HR'] = 2;
    return deck;
  }

  recordPlay(seat, cards) {
    for (const card of cards) {
      this.playerHistory[seat].push(card);
      if (this.remainingCards[card] > 0) {
        this.remainingCards[card]--;
        this.playedCards[card] = (this.playedCards[card] || 0) + 1;
      }
    }
  }

  getRemaining(card) {
    return this.remainingCards[card] || 0;
  }

  getPlayed(card) {
    return this.playedCards[card] || 0;
  }

  calculateProbability(card, remainingHands) {
    const remaining = this.getRemaining(card);
    const totalRemaining = remainingHands.reduce((a, b) => a + b, 0);
    if (totalRemaining === 0) return 0;
    return remaining / totalRemaining;
  }

  estimateCanBeat(pattern, currentRank, remainingHands) {
    if (!pattern || pattern.type === 'PASS') return false;
    const requiredCards = this._estimateRequiredCards(pattern, currentRank);
    for (const card of requiredCards) {
      if (this.getRemaining(card) > 0) return true;
    }
    return false;
  }

  _estimateRequiredCards(pattern, currentRank) {
    const required = [];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    
    if (pattern.type === 'Single') {
      required.push(`H${currentRank}`);
      required.push('SB');
      required.push('HR');
    }
    
    return required;
  }
}

// ------------------------------
// 团队协作系统
// ------------------------------
export class TeamCoordinator {
  constructor(mySeat) {
    this.mySeat = mySeat;
    this.teammateSeat = (mySeat + 2) % 4;
    this.opponents = [(mySeat + 1) % 4, (mySeat + 3) % 4];
  }

  isTeammate(seat) {
    return seat === this.teammateSeat;
  }

  isOpponent(seat) {
    return this.opponents.includes(seat);
  }

  shouldLetTeammatePlay(lastActionSeat, myCards, gamePhase) {
    if (gamePhase !== 'play') return false;
    if (!this.isTeammate(lastActionSeat)) return false;
    if (myCards <= 3) return true;
    return false;
  }

  shouldFeedTeammate(lastActionSeat, currentRank) {
    if (!this.isTeammate(lastActionSeat)) return false;
    return true;
  }

  analyzeTeammateNeeds(teammateHistory, currentRank) {
    const patterns = [];
    for (const cards of teammateHistory) {
      if (cards.length > 0) {
        patterns.push(cards.length);
      }
    }
    return patterns;
  }
}

// ------------------------------
// 难度等级配置
// ------------------------------
export const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    aggressiveness: 0.3,
    riskTolerance: 0.2,
    teamPlay: 0.3,
    memory: 0.3,
    bluffing: 0.1,
  },
  medium: {
    name: '中等',
    aggressiveness: 0.5,
    riskTolerance: 0.4,
    teamPlay: 0.5,
    memory: 0.5,
    bluffing: 0.3,
  },
  hard: {
    name: '困难',
    aggressiveness: 0.8,
    riskTolerance: 0.7,
    teamPlay: 0.8,
    memory: 0.9,
    bluffing: 0.6,
  },
  expert: {
    name: '专家',
    aggressiveness: 0.95,
    riskTolerance: 0.85,
    teamPlay: 0.95,
    memory: 1.0,
    bluffing: 0.8,
  }
};

// ------------------------------
// 工具函数引用
// ------------------------------
let _getLegalActions = null;
let _compareActions = null;

export function setToolFunctions(getLegalActions, compareActions) {
  _getLegalActions = getLegalActions;
  _compareActions = compareActions;
}

// ------------------------------
// 高级 AI 决策器
// ------------------------------
export class AdvancedAI {
  constructor(seat, difficulty = 'medium') {
    this.seat = seat;
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
    this.cardTracker = new CardTracker();
    this.teamCoordinator = new TeamCoordinator(seat);
    this.handHistory = [];
  }

  reset() {
    this.cardTracker.reset();
    this.handHistory = [];
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
  }

  chooseAction(hand, lastAction, currentRank, isFirst, lastActionSeat, handsCount) {
    if (!_getLegalActions || !_compareActions) {
      throw new Error('Tool functions not set');
    }
    
    const legal = _getLegalActions(hand, lastAction, currentRank);
    const realActions = legal.filter(a => a.type !== 'PASS');
    
    if (realActions.length === 0) {
      return { type: 'PASS', rank: 0, cards: [] };
    }

    const myCount = hand.length;
    const isLateGame = myCount <= 5;

    if (isFirst || !lastAction || lastAction.type === 'PASS') {
      return this._chooseFirstAction(realActions, myCount, isLateGame, currentRank);
    }

    return this._chooseResponseAction(realActions, lastAction, myCount, isLateGame, 
                                      lastActionSeat, handsCount, currentRank);
  }

  _chooseFirstAction(realActions, myCount, isLateGame, currentRank) {
    const config = this.config;

    if (isLateGame) {
      for (const a of realActions) {
        if (a.cards.length === myCount && a.type !== 'Bomb' && a.type !== 'FourKings') {
          return a;
        }
      }
    }

    if (myCount >= 15 && config.aggressiveness > 0.5) {
      const bigActions = realActions.filter(a => 
        a.type === 'TwoTrips' || a.type === 'Plate' || a.type === 'Straight' || a.type === 'FullHouse'
      ).sort((a, b) => b.cards.length - a.cards.length);
      if (bigActions.length > 0) return bigActions[0];
    }

    const singles = realActions.filter(a => a.type === 'Single').sort((a, b) => a.rank - b.rank);
    if (singles.length > 0) {
      const smallSingle = singles.find(s => s.rank < 13) || singles[0];
      return smallSingle;
    }

    const pairs = realActions.filter(a => a.type === 'Pair').sort((a, b) => a.rank - b.rank);
    if (pairs.length > 0) return pairs[0];

    const nonBomb = realActions.filter(a => a.type !== 'Bomb' && a.type !== 'FourKings' && a.type !== 'StraightFlush');
    if (nonBomb.length > 0) return nonBomb[0];

    return realActions[0];
  }

  _chooseResponseAction(realActions, lastAction, myCount, isLateGame, 
                        lastActionSeat, handsCount, currentRank) {
    const config = this.config;
    const lastType = lastAction.type;

    if (this.teamCoordinator.shouldLetTeammatePlay(lastActionSeat, myCount, 'play') && config.teamPlay > 0.5) {
      if (Math.random() < config.teamPlay) {
        const smallCards = realActions.filter(a => a.rank < 10);
        if (smallCards.length > 0 && Math.random() < 0.5) {
          return smallCards[0];
        }
        return { type: 'PASS', rank: 0, cards: [] };
      }
    }

    const sameType = realActions.filter(a => a.type === lastType).sort((a, b) => a.rank - b.rank);
    for (const a of sameType) {
      if (_compareActions(a, lastAction)) {
        if (a.rank < 14 || isLateGame || config.aggressiveness > 0.7) {
          return a;
        }
        if (lastAction.rank < 13) return a;
      }
    }

    const isLastActionBig = lastAction.rank >= 13 || lastAction.type === 'Bomb' || 
                            lastAction.type === 'StraightFlush' || lastAction.type === 'FullHouse';
    const needsBomb = isLastActionBig || lastAction.type === 'Bomb' || lastAction.type === 'StraightFlush';
    
    const bombThreshold = isLateGame ? 0.3 : (needsBomb ? 0.5 : config.riskTolerance);
    const shouldBomb = Math.random() < bombThreshold || (isLateGame && myCount <= 3);

    if (shouldBomb) {
      const bombs = realActions.filter(a => a.type === 'Bomb').sort((a, b) => {
        if (a.size !== b.size) return a.size - b.size;
        return a.rank - b.rank;
      });

      for (const bomb of bombs) {
        if (_compareActions(bomb, lastAction)) {
          if (lastAction.type === 'Bomb') {
            if (bomb.size > lastAction.size || (bomb.size === lastAction.size && bomb.rank > lastAction.rank)) {
              return bomb;
            }
          } else {
            return bomb;
          }
        }
      }
    }

    const sf = realActions.find(a => a.type === 'StraightFlush');
    if (sf && _compareActions(sf, lastAction)) {
      if (isLateGame || Math.random() < config.aggressiveness) return sf;
    }

    return { type: 'PASS', rank: 0, cards: [] };
  }

  updateTracker(seat, cards) {
    this.cardTracker.recordPlay(seat, cards);
  }
}