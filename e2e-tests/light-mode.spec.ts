/**
 * E2E tests for light mode toggle functionality.
 * Verifies accessibility, keyboard navigation, state persistence, and visual changes.
 */
import { test, expect } from '@playwright/test';

test.describe('Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display light mode toggle button in header', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Light Mode: Off');
  });

  test('should have proper ARIA attributes on toggle button', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    
    // Check it's a switch role
    await expect(toggle).toHaveAttribute('role', 'switch');
    
    // Check aria-checked is initially false
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    // Accessible name comes from visible button text (WCAG 2.5.3 — no separate aria-label needed)
    await expect(toggle).toContainText('Light Mode');
  });

  test('should toggle light mode when clicked', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    const html = page.locator('html');
    
    await test.step('Initially, light class should not be present and dark should be', async () => {
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasLight).toBe(false);
      expect(hasDark).toBe(true);
    });

    await test.step('Click toggle to enable light mode', async () => {
      await toggle.click();
      
      // Check HTML classes
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasLight).toBe(true);
      expect(hasDark).toBe(false);
      
      // Check aria-checked updated
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      
      // Check button text updated
      await expect(toggle).toContainText('Light Mode: On');
    });

    await test.step('Click toggle again to disable light mode', async () => {
      await toggle.click();
      
      // Check HTML classes
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasLight).toBe(false);
      expect(hasDark).toBe(true);
      
      // Check aria-checked updated
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      // Check button text updated
      await expect(toggle).toContainText('Light Mode: Off');
    });
  });

  test('should persist light mode across page reloads', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    
    await test.step('Enable light mode', async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    await test.step('Reload page and verify state persists', async () => {
      await page.reload();
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasLight).toBe(true);
      expect(hasDark).toBe(false);
      
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await expect(toggle).toContainText('Light Mode: On');
    });

    await test.step('Navigate to another page and verify state persists', async () => {
      await page.goto('/about');
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      expect(hasLight).toBe(true);
      expect(hasDark).toBe(false);
      
      const aboutToggle = page.getByTestId('light-mode-toggle');
      await expect(aboutToggle).toHaveAttribute('aria-checked', 'true');
      await expect(aboutToggle).toContainText('Light Mode: On');
    });
  });

  test('should be keyboard accessible with Tab, Enter, and Space', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    
    await test.step('Tab to light mode toggle', async () => {
      // Tab through page elements until toggle is focused
      let tabCount = 0;
      while (tabCount < 30) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const isFocused = await toggle.evaluate(el => el === document.activeElement);
        if (isFocused) break;
      }
      
      await expect(toggle).toBeFocused();
    });

    await test.step('Activate with Enter key', async () => {
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      expect(hasLight).toBe(true);
    });

    await test.step('Deactivate with Space key', async () => {
      // Ensure toggle still has focus
      await expect(toggle).toBeFocused();
      
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      expect(hasLight).toBe(false);
    });
  });

  test('should have visible focus indicator on toggle button', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    await toggle.focus();
    
    // Verify focus indicator (outline or box-shadow)
    const hasVisibleFocus = await toggle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;
      
      return (outline !== 'none' && outlineWidth !== '0px') || boxShadow !== 'none';
    });
    
    expect(hasVisibleFocus).toBeTruthy();
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    const statusRegion = page.locator('#light-mode-status');
    
    await test.step('Verify status region exists with proper ARIA attributes', async () => {
      await expect(statusRegion).toHaveAttribute('role', 'status');
      await expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      await expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
    });

    await test.step('Toggle on and verify announcement', async () => {
      await toggle.click();
      
      // Wait briefly for the status update
      await page.waitForTimeout(100);
      
      const statusText = await statusRegion.textContent();
      expect(statusText).toBe('Light mode enabled');
    });

    await test.step('Toggle off and verify announcement', async () => {
      await toggle.click();
      
      // Wait briefly for the status update
      await page.waitForTimeout(100);
      
      const statusText = await statusRegion.textContent();
      expect(statusText).toBe('Light mode disabled');
    });
  });

  test('should work correctly on game details page', async ({ page }) => {
    await page.goto('/game/1');
    
    const toggle = page.getByTestId('light-mode-toggle');
    
    await test.step('Enable light mode on game details page', async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    await test.step('Navigate to home and verify state persists', async () => {
      await page.goto('/');
      
      const homeToggle = page.getByTestId('light-mode-toggle');
      await expect(homeToggle).toHaveAttribute('aria-checked', 'true');
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      expect(hasLight).toBe(true);
    });
  });

  test('should work independently with high-contrast mode', async ({ page }) => {
    await page.goto('/');
    
    const lightToggle = page.getByTestId('light-mode-toggle');
    const hcToggle = page.getByTestId('high-contrast-toggle');
    const html = page.locator('html');
    
    await test.step('Enable both light mode and high contrast', async () => {
      await lightToggle.click();
      await hcToggle.click();
      
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasHC = await html.evaluate(el => el.classList.contains('high-contrast'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      
      expect(hasLight).toBe(true);
      expect(hasHC).toBe(true);
      expect(hasDark).toBe(false);
    });

    await test.step('Disable high contrast, keep light mode', async () => {
      await hcToggle.click();
      
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasHC = await html.evaluate(el => el.classList.contains('high-contrast'));
      
      expect(hasLight).toBe(true);
      expect(hasHC).toBe(false);
    });

    await test.step('Disable light mode, keep dark mode', async () => {
      await lightToggle.click();
      
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasDark = await html.evaluate(el => el.classList.contains('dark'));
      
      expect(hasLight).toBe(false);
      expect(hasDark).toBe(true);
    });
  });

  test('should persist both modes across page reload', async ({ page }) => {
    await page.goto('/');
    
    const lightToggle = page.getByTestId('light-mode-toggle');
    const hcToggle = page.getByTestId('high-contrast-toggle');
    
    await test.step('Enable both modes', async () => {
      await lightToggle.click();
      await hcToggle.click();
    });

    await test.step('Reload and verify both persist', async () => {
      await page.reload();
      
      const html = page.locator('html');
      const hasLight = await html.evaluate(el => el.classList.contains('light'));
      const hasHC = await html.evaluate(el => el.classList.contains('high-contrast'));
      
      expect(hasLight).toBe(true);
      expect(hasHC).toBe(true);
      
      await expect(lightToggle).toHaveAttribute('aria-checked', 'true');
      await expect(hcToggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  test('should not have accessibility violations with axe when light mode is enabled', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('light-mode-toggle');
    await toggle.click();
    
    // Wait for light mode to fully apply
    await page.waitForTimeout(200);
    
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
