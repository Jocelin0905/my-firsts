import { expect, test } from '@playwright/test'
import { skipOnboarding, todayLocal } from './helpers'

test.beforeEach(async ({ page }) => skipOnboarding(page))

test('creates, edits across years, keeps counters, and deletes a First', async ({ page }) => {
  await page.goto('/new')
  await page.getByLabel(/标题/).fill('第一次独立上线一个产品')
  await page.getByLabel('分类').selectOption('Create')
  await page.getByLabel(/一句话/).fill('从一个想法走到真正上线。')
  await page.getByRole('button', { name: '保存第一次' }).click()

  await expect(page.getByText('FIRST #001')).toBeVisible()
  await page.getByText('第一次独立上线一个产品').click()
  await page.getByRole('link', { name: '编辑' }).click()
  await page.getByLabel(/日期/).fill('2025-12-20')
  await page.getByRole('button', { name: '保存修改' }).click()

  await expect(page.getByText('MY FIRSTS · 2025')).toBeVisible()
  await expect(page.getByText('FIRST #001')).toBeVisible()
  await page.getByRole('button', { name: '删除' }).click()
  await expect(page.getByRole('dialog')).toContainText('删除后无法恢复。')
  await page.getByRole('button', { name: '确认删除' }).click()
  await expect(page.getByRole('heading', { name: '这一年还没有留下 First。' })).toBeVisible()

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('my-firsts:app-data')!))
  expect(stored.numberCounters).toEqual({ '2025': 1, [String(new Date().getFullYear())]: 1 })
})

test('rejects future dates and keeps the form content', async ({ page }) => {
  await page.goto('/new')
  await page.getByLabel(/标题/).fill('未来的第一次')
  const tomorrow = new Date(`${todayLocal()}T12:00:00`)
  tomorrow.setDate(tomorrow.getDate() + 1)
  await page.getByLabel(/日期/).evaluate((input, value) => {
    const element = input as HTMLInputElement
    element.removeAttribute('max')
    element.value = String(value)
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }, tomorrow.toISOString().slice(0, 10))
  await page.getByRole('button', { name: '保存第一次' }).click()
  await expect(page.getByRole('alert')).toContainText('未来的事情')
  await expect(page.getByLabel(/标题/)).toHaveValue('未来的第一次')
})
