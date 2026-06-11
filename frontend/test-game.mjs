import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    if (text.includes('warning') || text.includes('Warning')) {
      warnings.push(text);
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
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    // 检查页面标题
    const title = await page.title();
    console.log('Page title:', title);
    
    // 检查是否有错误覆盖层
    const errorOverlay = await page.$('vite-error-overlay');
    if (errorOverlay) {
      console.log('ERROR: Vite error overlay detected!');
      const errorContent = await page.textContent('body');
      console.log('Page content:', errorContent.substring(0, 2000));
    } else {
      console.log('No error overlay detected');
      
      // 检查开始按钮
      const startBtn = await page.$('button:has-text("开始游戏")');
      if (startBtn) {
        console.log('Start button found');
        await startBtn.click();
        await page.waitForTimeout(2000);
        
        // 检查游戏状态
        const phase = await page.evaluate(() => window.gamePhase?.value || 'unknown');
        console.log('Game phase:', phase);
      }
    }
    
  } catch (error) {
    console.log('Test Error:', error.message);
  } finally {
    await browser.close();
    
    // 输出错误总结
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(e => console.log(e));
    }
  }
})();
