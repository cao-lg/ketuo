import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    if (text.includes('[AI]')) {
      console.log(text);
    }
  });
  
  page.on('pageerror', err => {
    errors.push('[Page Error]: ' + err.message);
  });
  
  try {
    console.log('Opening page...');
    await page.goto('http://localhost:5181/', { waitUntil: 'networkidle' });
    
    // 检查页面标题
    const title = await page.title();
    console.log('Page title:', title);
    
    // 检查难度选择按钮
    const difficultyButtons = await page.$$('.difficulty-btn');
    console.log('Difficulty buttons found:', difficultyButtons.length);
    
    // 点击困难难度
    const hardBtn = await page.$('.difficulty-btn.hard');
    if (hardBtn) {
      await hardBtn.click();
      console.log('Selected hard difficulty');
    }
    
    // 输入玩家名
    await page.fill('input.styled-input', '测试玩家');
    console.log('Entered player name');
    
    // 点击开始游戏
    const startBtn = await page.$('button.start-btn');
    if (startBtn) {
      await startBtn.click();
      console.log('Started game');
      await page.waitForTimeout(3000);
      
      // 检查游戏状态
      const phase = await page.evaluate(() => window.gamePhase?.value);
      console.log('Game phase:', phase);
      
      // 等待AI出牌
      console.log('Waiting for AI moves...');
      await page.waitForTimeout(10000);
      
      // 获取游戏状态
      const gameInfo = await page.evaluate(() => ({
        phase: window.gamePhase?.value,
        currentSeat: window.currentSeat?.value,
        hands: window.hands?.value?.map(h => h.length) || [],
        finishOrder: window.finishOrder?.value || []
      }));
      
      console.log('\n=== Game State ===');
      console.log('Phase:', gameInfo.phase);
      console.log('Current Seat:', gameInfo.currentSeat);
      console.log('Hands:', gameInfo.hands);
      console.log('Finish Order:', gameInfo.finishOrder);
    }
    
  } catch (error) {
    console.log('Test Error:', error.message);
  } finally {
    await browser.close();
    
    // 输出错误
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(e => console.log(e));
    } else {
      console.log('\n✅ No errors found!');
    }
  }
})();