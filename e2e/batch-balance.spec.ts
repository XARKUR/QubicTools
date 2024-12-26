import { test, expect } from '@playwright/test'

test.describe('Batch Balance Check', () => {
  test('should display empty results initially', async ({ page }) => {
    await page.goto('/batch-balance')
    
    // 检查页面标题
    await expect(page.getByRole('heading', { name: '批量查询余额' })).toBeVisible()
    
    // 检查结果卡片
    const resultsCard = page.getByText('总余额: 0 QUBIC')
    await expect(resultsCard).toBeVisible()
  })

  test('should handle address input and query', async ({ page }) => {
    await page.goto('/batch-balance')
    
    // 输入地址
    const textarea = page.getByPlaceholder('每行输入一个地址')
    await textarea.fill('AFKQVZYWQKZVQKW9HEAU9VVDHGHBBXDKNZL9EQHMNVHWRGPJNQKRVMXKOFKZWZ9QWRXBFVJXVGHPNMVZ')
    
    // 点击查询按钮
    await page.getByRole('button', { name: '查询' }).click()
    
    // 等待结果显示
    await expect(page.getByText('查询结果')).toBeVisible()
  })

  test('should handle copy and delete operations', async ({ page }) => {
    await page.goto('/batch-balance')
    
    // 输入地址并查询
    const textarea = page.getByPlaceholder('每行输入一个地址')
    await textarea.fill('AFKQVZYWQKZVQKW9HEAU9VVDHGHBBXDKNZL9EQHMNVHWRGPJNQKRVMXKOFKZWZ9QWRXBFVJXVGHPNMVZ')
    await page.getByRole('button', { name: '查询' }).click()
    
    // 等待结果显示
    await expect(page.getByText('查询结果')).toBeVisible()
    
    // 测试复制功能
    const copyButton = page.getByRole('button').filter({ has: page.getByText('copy') })
    await copyButton.click()
    
    // 测试删除功能
    const deleteButton = page.getByRole('button').filter({ has: page.getByText('trash') })
    await deleteButton.click()
    
    // 验证结果已被删除
    await expect(page.getByText('总余额: 0 QUBIC')).toBeVisible()
  })

  test('should handle mobile view', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/batch-balance')
    
    // 检查表格是否可以水平滚动
    const table = page.locator('table').first()
    const tableWidth = await table.evaluate((el) => el.scrollWidth)
    const containerWidth = await table.evaluate((el) => el.clientWidth)
    
    // 验证表格宽度大于容器宽度（可滚动）
    expect(tableWidth).toBeGreaterThan(containerWidth)
  })
})
