const puppeteer = require('puppeteer');

(async () => {
  const testCases = [
    { mode: 'baseline', label: 'Baseline (non-editable)' },
    { mode: 'ce', label: 'ContentEditable (no editing)' },
    { mode: 'ce_edit', label: 'ContentEditable (simulated editing)' }
  ];

  const results = [];
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-software-rasterizer"] });
  for (const tc of testCases) {
    const page = await browser.newPage();
    const url = `http://localhost:8000/tests/performance-editable-test.html?mode=${tc.mode}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.results !== undefined);
    const perf = await page.evaluate(() => window.results);
    results.push({ ...tc, ...perf });
    await page.close();
  }
  await browser.close();

  console.log('===== Performance Results =====');
  results.forEach(r => {
    console.log(`${r.label}: avg = ${r.avg.toFixed(3)} ms, max = ${r.max.toFixed(3)} ms (iterations: ${r.iterations})`);
  });

  // Decide risk level based on thresholds (example: avg > 2ms considered risk)
  const baselineAvg = results.find(r => r.mode === 'baseline').avg;
  const ceAvg = results.find(r => r.mode === 'ce').avg;
  const ceEditAvg = results.find(r => r.mode === 'ce_edit').avg;

  const ratioNoEdit = ceAvg / baselineAvg;
  const ratioEdit = ceEditAvg / baselineAvg;

  console.log('\n===== Impact Analysis =====');
  console.log(`ContentEditable (no edit) is ${(ratioNoEdit*100).toFixed(1)}% of baseline.`);
  console.log(`ContentEditable (editing) is ${(ratioEdit*100).toFixed(1)}% of baseline.`);

  const riskLevel = ratioEdit > 3 ? 'HIGH' : (ratioEdit > 1.5 ? 'MEDIUM' : 'LOW');
  console.log(`\nRisk Level Assessment: ${riskLevel}`);
})(); 