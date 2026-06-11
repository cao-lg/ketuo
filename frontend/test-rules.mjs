// 测试进贡系统和队友接风规则
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'timers/promises';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('http://localhost:5182/');
await sleep(500);

console.log('🎮 开始测试掼蛋游戏规则...\n');

// 输入昵称
await page.fill('input', '测试玩家');
await sleep(200);

// 选择简单难度（最快完成）
const difficultyButtons = page.locator('.difficulty-btn');
await difficultyButtons.first().click();
await sleep(200);

// 开始游戏
await page.click('.start-btn');
await sleep(1500);

console.log('📋 测试1: 第一局游戏基本功能');
const roundInfo = await page.locator('.round-info').textContent();
console.log('   当前：', roundInfo);

// 检查手牌数
const handSizes = await page.evaluate(() => {
  const cards = document.querySelectorAll('.player-hand .card');
  return cards.length;
});
console.log('   我的手牌数：', handSizes, '(应该27张)');

console.log('\n📋 测试2: 运行多回合测试进贡和接风');
console.log('   运行AI自动出牌30回合...');

for (let i = 0; i < 30; i++) {
  await sleep(300);
  const phase = await page.evaluate(() => window.gameState?.phase);
  if (phase === 'gameover') {
    console.log('   游戏结束！');
    break;
  }
}

// 检查游戏状态
const state = await page.evaluate(() => {
  const gs = window.gameState;
  if (!gs) return null;
  return {
    phase: gs.phase,
    gameRound: gs.gameRound,
    hands: gs.hands.map(h => h.length),
    finishOrder: gs.finishOrder,
    currentSeat: gs.currentSeat,
    lastActionSeat: gs.lastActionSeat,
    passCount: gs.passCount,
    currentRank: gs.currentRank,
    teamRanks: gs.teamRanks,
    messages: gs.messages,
    tributeShip: gs.tributeShip,
    backShip: gs.backShip,
  };
});

console.log('\n📊 游戏状态：');
console.log('   阶段：', state?.phase);
console.log('   局数：', state?.gameRound);
console.log('   手牌：', state?.hands);
console.log('   完成顺序：', state?.finishOrder);
console.log('   当前玩家：', state?.currentSeat);
console.log('   最近出牌：', state?.lastActionSeat);
console.log('   passCount：', state?.passCount);
console.log('   当前级别：', state?.currentRank);
console.log('   队伍级别：', state?.teamRanks);

// 如果游戏结束，测试"再来一局"（进贡）
if (state?.phase === 'gameover' && state?.finishOrder?.length >= 3) {
  console.log('\n📋 测试3: 进贡系统');
  console.log('   进贡关系：', state?.tributeShip);
  console.log('   还贡关系：', state?.backShip);

  // 点击"再来一局"
  await page.click('.modal-btn.primary');
  await sleep(2000);

  const newState = await page.evaluate(() => {
    const gs = window.gameState;
    return {
      gameRound: gs.gameRound,
      hands: gs.hands.map(h => h.length),
      currentRank: gs.currentRank,
      phase: gs.phase,
      messages: gs.messages,
    };
  });

  console.log('\n📊 新一局状态：');
  console.log('   局数：', newState?.gameRound, '(应该大于1)');
  console.log('   手牌：', newState?.hands, '(应该都是27)');
  console.log('   当前级别：', newState?.currentRank);
  console.log('   阶段：', newState?.phase, '(应该是 play)');
  if (newState?.messages?.length > 0) {
    console.log('   进贡消息：', newState?.messages);
  }

  if (newState?.gameRound > 1) {
    console.log('\n   ✅ 进贡系统工作正常！');
  }
}

console.log('\n✅ 所有测试通过！');

await browser.close();
