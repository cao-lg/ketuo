import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const gameEvents = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    if (text.includes('[AI]') || text.includes('Chosen action')) {
      gameEvents.push(text);
    }
  });
  
  page.on('pageerror', err => {
    errors.push('[Page Error]: ' + err.message);
  });
  
  try {
    console.log('🎮 开始完整测试掼蛋游戏...\n');
    await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });
    
    // 1. 测试难度选择
    console.log('📋 测试1: 难度选择');
    const difficultyBtns = await page.$$('.difficulty-btn');
    console.log(`   ✅ 找到 ${difficultyBtns.length} 个难度按钮`);
    
    await page.click('.difficulty-btn.expert');
    console.log('   ✅ 选择专家难度');
    
    // 2. 测试开始游戏
    console.log('\n📋 测试2: 开始游戏');
    await page.fill('input.styled-input', '测试玩家');
    await page.click('button.start-btn');
    console.log('   ✅ 游戏开始');
    
    await page.waitForTimeout(2000);
    
    // 3. 测试游戏进行
    console.log('\n📋 测试3: 游戏进行');
    let round = 0;
    const maxRounds = 20;
    
    while (round < maxRounds) {
      round++;
      await page.waitForTimeout(1500);
      
      const phase = await page.evaluate(() => window.gamePhase?.value);
      if (phase === 'gameover' || phase === 'tribute') {
        console.log('   🎉 游戏结束！');
        break;
      }
      
      const isMyTurn = await page.evaluate(() => 
        window.gamePhase?.value === 'play' && 
        window.currentSeat?.value === window.mySeat
      );
      
      if (isMyTurn) {
        // 点击提示
        const hintBtn = await page.$('button:has-text("提示")');
        if (hintBtn) await hintBtn.click();
        await page.waitForTimeout(300);
        
        // 出牌或不要
        const playBtn = await page.$('button:has-text("出牌")');
        if (playBtn) {
          await playBtn.click();
        } else {
          const passBtn = await page.$('button:has-text("不要")');
          if (passBtn) await passBtn.click();
        }
      }
    }
    
    // 4. 检查最终状态
    console.log('\n📋 测试4: 最终状态');
    const finalState = await page.evaluate(() => ({
      phase: window.gamePhase?.value,
      hands: window.hands?.value?.map(h => h.length) || [],
      finishOrder: window.finishOrder?.value || [],
      difficulty: window.gameState?.difficulty || 'unknown'
    }));
    
    console.log(`   阶段: ${finalState.phase}`);
    console.log(`   手牌: ${finalState.hands.join(', ')}`);
    console.log(`   完成顺序: ${finalState.finishOrder.join(', ') || '无'}`);
    
    // 5. 统计
    console.log('\n📊 测试统计');
    console.log(`   总回合: ${round}`);
    console.log(`   AI 出牌: ${gameEvents.filter(l => l.includes('Chosen action')).length} 次`);
    console.log(`   炸弹次数: ${gameEvents.filter(l => l.includes('Bomb')).length}`);
    
    // 截图
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('\n📸 截图已保存: test-result.png');
    
  } catch (error) {
    console.log('❌ 测试错误:', error.message);
  } finally {
    await browser.close();
    
    if (errors.length > 0) {
      console.log('\n❌ 发现错误:');
      errors.forEach(e => console.log('   ' + e));
    } else {
      console.log('\n✅ 所有测试通过！没有错误！');
    }
  }
})();