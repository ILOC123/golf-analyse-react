import { test } from '@playwright/test'
import path from 'path'

const OUT = 'tests/screenshots'

// ── Hilfsfunktion: Nav-Tab anklicken ──────────────────────────────
async function goToTab(page, name) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForTimeout(300)
}

// ── Screenshots aller Hauptansichten ──────────────────────────────
test('Statistiken', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/1-statistiken.png`, fullPage: true })
})

test('Runde – Setup', async ({ page }) => {
  await page.goto('/')
  await goToTab(page, 'Runde')
  await page.screenshot({ path: `${OUT}/2-runde-setup.png` })
})

test('Verlauf', async ({ page }) => {
  await page.goto('/')
  await goToTab(page, 'Verlauf')
  await page.screenshot({ path: `${OUT}/3-verlauf.png` })
})

test('Kurse', async ({ page }) => {
  await page.goto('/')
  await goToTab(page, 'Kurse')
  await page.screenshot({ path: `${OUT}/4-kurse.png` })
})
