import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w, name] of [[720, 'tablet-720'], [900, 'tablet-900']]) {
  const p = await b.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 2 })
  await p.goto('http://localhost:4204/portfolio', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(3000)
  const g = await p.locator('.portfolio-grid-view').boundingBox()
  await p.evaluate(y => window.scrollTo(0, y - 20), g.y)
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `${name}.png` })
  await p.close()
}
console.log('ok')
