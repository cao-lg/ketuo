import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const gameLog = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    if (text.includes('[AI]') || text.includes('出牌') || text.includes('PASS')) {
      gameLog.push(text);
    }
  });
  
  page.on('pageerror', err => {
    errors.push('[Page Error]: ' + err.message);
  });
  
  try {
    console.log('🎮 开始测试掼蛋游戏...\n');
    await page.goto('http://localhost:5181/', { waitUntil: 'networkidle' });
    
    // 选择专家难度
    const expertBtn = await page.$('.difficulty-btn.expert');
    if (expertBtn) {
      await expertBtn.click();
      console.log('✅ 选择专家难度');
    }
    
    // 输入玩家名
    await page.fill('input.styled-input', '测试玩家');
    
    // 开始游戏
    const startBtn = await page.$('button.start-btn');
    if (startBtn) {
      await startBtn.click();
      console.log('✅ 游戏开始\n');
    }
    
    // 模拟玩家出牌
    let round = 0;
    const maxRounds = 30;
    
    while (round < maxRounds) {
      round++;
      await page.waitForTimeout(2000);
      
      // 检查游戏阶段
      const phase = await page.evaluate(() => window.gamePhase?.value);
      
      if (phase === 'gameover' || phase === 'tribute') {
        console.log('\n🎉 游戏结束！');
        break;
      }
      
      // 检查是否轮到玩家
      const isMyTurn = await page.evaluate(() => 
        window.gamePhase?.value === 'play' && 
        window.currentSeat?.value === window.mySeat
      );
      
      if (isMyTurn) {
        // 点击提示按钮
        const hintBtn = await page.$('button:has-text("提示")');
        if (hintBtn) {
          await hintBtn.click();
          await page.waitForTimeout(500);
        }
        
        // 点击出牌按钮
        const playBtn = await page.$('button:has-text("出牌")');
        if (playBtn) {
          await playBtn.click();
          console.log(`回合 ${round}: 玩家出牌`);
        } else {
          // 没有可出的牌，点击不要
          const passBtn = await page.$('button:has-text("不要")');
          if (passBtn) {
            await passBtn.click();
            console.log(`回合 ${round}: 玩家 PASS`);
          }
        }
      }
    }
    
    // 最终状态
    const finalState = await page.evaluate(() => ({
      phase: window.gamePhase?.value,
      hands: window.hands?.value?.map(h => h.length) || [],
      finishOrder: window.finishOrder?.value || [],
      teamRanks: window.gameState?.teamRanks || [],
      currentRank: window.gameState?.currentRank || 'unknown'
    }));
    
    console.log('\n=== 最终状态 ===');
    console.log('阶段:', finalState.phase);
    console.log('手牌数:', finalState.hands);
    console.log('完成顺序:', finalState.finishOrder);
    console.log('队伍等级:', finalState.teamRanks);
    console.log('当前级牌:', finalState.currentRank);
    
    // 统计
    console.log('\n=== 游戏统计 ===');
    console.log('总回合数:', round);
    console.log('AI 出牌次数:', gameLog.filter(l => l.includes('Chosen action')).length);
    
  } catch (error) {
    console.log('❌ 测试错误:', error.message);
  } finally {
    await browser.close();
    
    if (errors.length > 0) {
      console.log('\n=== 错误 ===');
      errors.forEach(e => console.log(e));
    } else {
      console.log('\n✅ 没有错误！');
    }
  }
})();