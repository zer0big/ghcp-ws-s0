/**
 * E2E tests for high-contrast mode toggle functionality.
 * Verifies accessibility, keyboard navigation, state persistence, and visual changes.
 */
import { test, expect } from '@playwright/test';

test.describe('High Contrast Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display high contrast toggle button in header', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('High Contrast: Off');
  });

  test('should have proper ARIA attributes on toggle button', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    
    // Check it's a switch role
    await expect(toggle).toHaveAttribute('role', 'switch');
    
    // Check aria-checked is initially false
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    // Check aria-label exists
    await expect(toggle).toHaveAttribute('aria-label', 'Toggle high contrast mode');
  });

  test('should toggle high contrast mode when clicked', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    const html = page.locator('html');
    
    await test.step('Initially, high-contrast class should not be present', async () => {
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(false);
    });

    await test.step('Click toggle to enable high-contrast mode', async () => {
      await toggle.click();
      
      // Check HTML class
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
      
      // Check aria-checked updated
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      
      // Check button text updated
      await expect(toggle).toContainText('High Contrast: On');
    });

    await test.step('Click toggle again to disable high-contrast mode', async () => {
      await toggle.click();
      
      // Check HTML class removed
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(false);
      
      // Check aria-checked updated
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      // Check button text updated
      await expect(toggle).toContainText('High Contrast: Off');
    });
  });

  test('should persist high contrast mode across page reloads', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    
    await test.step('Enable high-contrast mode', async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    await test.step('Reload page and verify state persists', async () => {
      await page.reload();
      
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
      
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await expect(toggle).toContainText('High Contrast: On');
    });

    await test.step('Navigate to another page and verify state persists', async () => {
      await page.goto('/about');
      
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
      
      const aboutToggle = page.getByTestId('high-contrast-toggle');
      await expect(aboutToggle).toHaveAttribute('aria-checked', 'true');
      await expect(aboutToggle).toContainText('High Contrast: On');
    });
  });

  test('should be keyboard accessible with Tab, Enter, and Space', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    
    await test.step('Tab to high-contrast toggle', async () => {
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
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
    });

    await test.step('Deactivate with Space key', async () => {
      // Ensure toggle still has focus
      await expect(toggle).toBeFocused();
      
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(false);
    });
  });

  test('should have visible focus indicator on toggle button', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
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

  test('should apply high-contrast colors when enabled', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    
    await test.step('Enable high-contrast mode', async () => {
      await toggle.click();
    });

    await test.step('Verify HTML has high-contrast class and high-contrast styles are applied', async () => {
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
      
      // Check that high-contrast CSS custom property is set (accept both #000 and #000000)
      const bgColor = await html.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue('--hc-bg-primary').trim().toLowerCase();
      });
      
      expect(['#000', '#000000'].includes(bgColor)).toBe(true);
    });

    await test.step('Verify links use high-contrast yellow color', async () => {
      // Get computed style on an actual link element
      const firstLink = page.locator('a').first();
      const linkColor = await firstLink.evaluate((el) => {
        const color = window.getComputedStyle(el).color;
        // Convert to hex for consistent comparison across browsers
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          // Yellow links should have high red and green, low blue
          return r > 200 && g > 200 && b < 50;
        }
        return false;
      });
      
      expect(linkColor).toBeTruthy();
    });
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    const statusRegion = page.locator('#high-contrast-status');
    
    await test.step('Verify status region exists with proper ARIA attributes', async () => {
      await expect(statusRegion).toHaveAttribute('role', 'status');
      await expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    await test.step('Toggle on and verify announcement', async () => {
      await toggle.click();
      
      // Wait briefly for the status update
      await page.waitForTimeout(100);
      
      const statusText = await statusRegion.textContent();
      expect(statusText).toBe('High contrast mode enabled');
    });

    await test.step('Toggle off and verify announcement', async () => {
      await toggle.click();
      
      // Wait briefly for the status update
      await page.waitForTimeout(100);
      
      const statusText = await statusRegion.textContent();
      expect(statusText).toBe('High contrast mode disabled');
    });
  });

  test('should work correctly on game details page', async ({ page }) => {
    await page.goto('/game/1');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    
    await test.step('Enable high-contrast on game details page', async () => {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    await test.step('Navigate to home and verify state persists', async () => {
      await page.goto('/');
      
      const homeToggle = page.getByTestId('high-contrast-toggle');
      await expect(homeToggle).toHaveAttribute('aria-checked', 'true');
      
      const html = page.locator('html');
      const hasClass = await html.evaluate(el => el.classList.contains('high-contrast'));
      expect(hasClass).toBe(true);
    });
  });

  test('should not have accessibility violations with axe when high-contrast is enabled', async ({ page }) => {
    await page.goto('/');
    
    const toggle = page.getByTestId('high-contrast-toggle');
    await toggle.click();
    
    // Wait for high-contrast mode to fully apply
    await page.waitForTimeout(200);
    
    // Import AxeBuilder - we know it's available from other accessibility tests
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
