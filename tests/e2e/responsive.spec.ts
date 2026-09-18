import { expect, test } from '@playwright/test'
import { skipOnboarding } from './helpers'

for (const width of [320, 375, 390, 430, 1440]) {
  test(`does not overflow at ${width}px`, async ({ page }) => {
    await skipOnboarding(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('long titles remain inside the collectible card', async ({ page }) => {
  await skipOnboarding(page)
  await page.addInitScript(() => {
    const year = new Date().getFullYear()
    localStorage.setItem('my-firsts:app-data', JSON.stringify({
      version: 1,
      firsts: [{
        id: 'long-title', number: 1000, year,
        title: '第一次ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ',
        date: `${year}-01-01`, category: 'Other',
        createdAt: `${year}-01-01T00:00:00.000Z`, updatedAt: `${year}-01-01T00:00:00.000Z`,
      }],
      numberCounters: { [year]: 1000 },
      celebratedMilestones: {},
    }))
  })
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  await expect(page.getByText('FIRST #1000')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
