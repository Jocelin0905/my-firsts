import { expect, test } from '@playwright/test'
import { skipOnboarding } from './helpers'

test('exports, clears, and restores a complete text backup', async ({ page }) => {
  await skipOnboarding(page)
  await page.goto('/new')
  await page.getByLabel(/标题/).fill('第一次完成备份恢复')
  await page.getByRole('button', { name: '保存第一次' }).click()
  await page.goto('/settings')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export Backup' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()

  await page.getByRole('button', { name: 'Clear All Data' }).click()
  await page.getByRole('button', { name: '确认清空' }).click()
  await page.getByRole('button', { name: 'Import Backup' }).click()
  await page.locator('input[type=file]').setInputFiles(path!)
  await page.getByRole('button', { name: '继续导入' }).click()
  await page.goto('/')
  await expect(page.getByText('第一次完成备份恢复')).toBeVisible()
})
