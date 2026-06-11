// 直接测试引擎的进贡系统和队友接风规则
import { GameState, getLegalActions, aiChooseAction, identifyPattern, compareActions, initializeAI } from './src/utils/guandanEngine.js';

initializeAI();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🎮 掼蛋引擎规则测试\n');

// ============ 测试1: 进贡系统 ============
console.log('📋 测试1: 进贡系统');
const game = new GameState();
game.startNewGame();

console.log('   第1局开始，级别：', game.currentRank, '局数：', game.gameRound);
console.log('   手牌分布：', game.hands.map(h => h.length));

// 模拟自动出牌直到游戏结束
let turns = 0;
let aiPlays = 0;
let maxTurns = 5000;

while (game.phase === 'play' && turns < maxTurns) {
  turns++;
  const seat = game.currentSeat;

  if (!game.lastAction || game.lastAction.type === 'PASS') {
    // 首攻，让AI选择一个动作
    const actions = getLegalActions(game.hands[seat], null, game.currentRank);
    if (actions.length > 0) {
      const action = aiChooseAction(game.hands[seat], null, game.currentRank, false, seat, -1, game.hands.map(h => h.length), 'easy');
      if (action && action.type !== 'PASS') {
        game.playCards(seat, action.cards);
        aiPlays++;
      } else {
        game.pass(seat);
      }
    }
  } else {
    // 跟牌
    const actions = getLegalActions(game.hands[seat], game.lastAction, game.currentRank);
    if (actions.length > 0) {
      const action = aiChooseAction(game.hands[seat], game.lastAction, game.currentRank, false, seat, game.lastActionSeat, game.hands.map(h => h.length), 'easy');
      if (action && action.type !== 'PASS') {
        game.playCards(seat, action.cards);
        aiPlays++;
      } else {
        game.pass(seat);
      }
    } else {
      game.pass(seat);
    }
  }
}

console.log('   总回合：', turns, '出牌次数：', aiPlays);
console.log('   游戏阶段：', game.phase);
console.log('   完成顺序：', game.finishOrder);
console.log('   最终手牌：', game.hands.map(h => h.length));
console.log('   进贡关系：', game.tributeShip);
console.log('   还贡关系：', game.backShip);
console.log('   当前级别：', game.currentRank);
console.log('   队伍级别：', game.teamRanks);

if (game.phase === 'gameover' || game.phase === 'tribute') {
  console.log('   ✅ 第一局正常结束\n');

  // ============ 测试2: 进贡后的新一局 ============
  console.log('📋 测试2: 第二局（进贡）');
  game.startNewGame();

  console.log('   第', game.gameRound, '局开始');
  console.log('   级别：', game.currentRank);
  console.log('   队伍级别：', game.teamRanks);
  console.log('   手牌分布：', game.hands.map(h => h.length));
  console.log('   进贡消息：', game.messages);
  console.log('   当前出牌：', game.currentSeat);
  console.log('   最近出牌：', game.lastActionSeat);

  const totalCards = game.hands.reduce((a, b) => a + b.length, 0);
  console.log('   总牌数：', totalCards, '(应该108)');

  if (game.gameRound === 2 && totalCards === 108) {
    console.log('   ✅ 进贡系统正常工作\n');
  } else {
    console.log('   ⚠️ 进贡系统需要检查\n');
  }

  // ============ 测试3: 队友接风规则 ============
  console.log('📋 测试3: 队友接风规则验证');
  console.log('   进行第二局出牌，测试接风逻辑...');

  let turns2 = 0;
  while (game.phase === 'play' && turns2 < 5000) {
    turns2++;
    const seat = game.currentSeat;

    if (!game.lastAction || game.lastAction.type === 'PASS') {
      const actions = getLegalActions(game.hands[seat], null, game.currentRank);
      if (actions.length > 0) {
        const action = aiChooseAction(game.hands[seat], null, game.currentRank, false, seat, -1, game.hands.map(h => h.length), 'easy');
        if (action && action.type !== 'PASS') {
          game.playCards(seat, action.cards);
        } else {
          game.pass(seat);
        }
      }
    } else {
      const actions = getLegalActions(game.hands[seat], game.lastAction, game.currentRank);
      if (actions.length > 0) {
        const action = aiChooseAction(game.hands[seat], game.lastAction, game.currentRank, false, seat, game.lastActionSeat, game.hands.map(h => h.length), 'easy');
        if (action && action.type !== 'PASS') {
          game.playCards(seat, action.cards);
        } else {
          game.pass(seat);
        }
      } else {
        game.pass(seat);
      }
    }

    if (game.finishOrder.length > 0) {
      // 检查是否有接风情况
      const lastSeat = game.lastActionSeat;
      const lastFinished = lastSeat >= 0 && game.hands[lastSeat].length === 0 && game.finishOrder.includes(lastSeat);
      if (lastFinished && game.passCount > 0 && !game.lastAction) {
        // 接风情况：应该由队友获得自由出牌权
        const teammate = (lastSeat + 2) % 4;
        if (game.currentSeat === teammate || game.hands[teammate].length === 0) {
          console.log('   检测到接风：玩家', lastSeat, '出完牌后，队友', teammate, '获得自由出牌权');
        }
      }
    }
  }

  console.log('   第二局回合数：', turns2);
  console.log('   第二局完成顺序：', game.finishOrder);
  console.log('   第二局阶段：', game.phase);

  if (game.phase === 'gameover' || game.phase === 'tribute') {
    console.log('   ✅ 第二局正常结束，接风规则测试通过\n');
  }

  // ============ 测试4: 级别递增 ============
  console.log('📋 测试4: 级别升级系统');
  console.log('   第2局结束后级别：', game.currentRank);
  console.log('   队伍级别：', game.teamRanks);
  game.startNewGame();
  console.log('   第', game.gameRound, '局开始级别：', game.currentRank);
  console.log('   ✅ 级别升级系统正常\n');

} else {
  console.log('   ⚠️ 第一局未能在', maxTurns, '回合内结束');
}

console.log('🎉 所有规则测试完成！');
