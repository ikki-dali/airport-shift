import { test, expect } from '@playwright/test'

test.describe('ログインページ', () => {
  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login')

    // タイトル確認
    await expect(page.getByText('シフト管理システム')).toBeVisible()
    await expect(page.getByText('Airport Shift Manager にログイン')).toBeVisible()

    // フォーム要素確認
    await expect(page.getByLabel('メールアドレス')).toBeVisible()
    await expect(page.getByLabel('パスワード')).toBeVisible()
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible()
  })

  test('メールアドレスとパスワードのフィールドが入力可能', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.getByLabel('メールアドレス')
    const passwordInput = page.getByLabel('パスワード')

    await emailInput.fill('test@example.com')
    await passwordInput.fill('password123')

    await expect(emailInput).toHaveValue('test@example.com')
    await expect(passwordInput).toHaveValue('password123')
  })

  test('ログインボタンがクリック可能', async ({ page }) => {
    await page.goto('/login')

    const loginButton = page.getByRole('button', { name: 'ログイン' })
    await expect(loginButton).toBeEnabled()
  })

  test('メールアドレスフィールドにtype="email"が設定されている', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.getByLabel('メールアドレス')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('パスワードフィールドにtype="password"が設定されている', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.getByLabel('パスワード')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

test.describe('認証リダイレクト', () => {
  test('未認証で / にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/')

    // /loginにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/)
  })

  test('未認証で /staff にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/staff')

    await expect(page).toHaveURL(/\/login/)
  })

  test('未認証で /shifts にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/shifts')

    await expect(page).toHaveURL(/\/login/)
  })

  test('未認証で /locations にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/locations')

    await expect(page).toHaveURL(/\/login/)
  })

  test('未認証で /roles にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/roles')

    await expect(page).toHaveURL(/\/login/)
  })

  test('未認証で /notifications にアクセスすると /login にリダイレクトされる', async ({ page }) => {
    await page.goto('/notifications')

    await expect(page).toHaveURL(/\/login/)
  })

  test('リダイレクト時にredirectToパラメータが付与される', async ({ page }) => {
    await page.goto('/staff')

    // redirectToパラメータ確認
    await expect(page).toHaveURL(/redirectTo=/)
  })

  test('/api/health は認証不要でアクセス可能', async ({ page }) => {
    const response = await page.goto('/api/health')

    expect(response?.status()).toBe(200)
  })
})
