import puppeteer from 'puppeteer'

export interface UrlFetchResult {
  screenshotBase64: string
  domText: string
  url: string
}

/**
 * Navigates to a URL using Puppeteer, captures a full-page screenshot and
 * extracts a simplified text representation of the visible DOM.
 *
 * Throws if the URL is unreachable, times out, or returns an HTTP error.
 */
export async function fetchUrlContent(url: string): Promise<UrlFetchResult> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000
    })

    if (!response) {
      throw new Error(`No response received from ${url}`)
    }

    const status = response.status()
    if (status >= 400) {
      throw new Error(`HTTP ${status} error fetching ${url}`)
    }

    // Capture full-page screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 75,
      fullPage: false // viewport-only keeps base64 size manageable
    })

    const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64')

    // Extract simplified text tree from visible DOM
    const domText = await page.evaluate(() => {
      function extractText(el: Element, depth: number): string {
        if (depth > 6) return ''
        const tag = el.tagName.toLowerCase()

        // Skip non-visible elements
        if (['script', 'style', 'noscript', 'head', 'meta', 'link'].includes(tag)) return ''

        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return ''

        const indent = '  '.repeat(depth)
        const text = (el as HTMLElement).innerText?.trim().slice(0, 120) ?? ''
        const label = text ? `${indent}<${tag}> ${text}` : `${indent}<${tag}>`

        const children = Array.from(el.children)
          .map(child => extractText(child, depth + 1))
          .filter(Boolean)
          .join('\n')

        return children ? `${label}\n${children}` : label
      }

      return extractText(document.body, 0)
    })

    return { screenshotBase64, domText: domText.slice(0, 8_000), url }
  } catch (err: any) {
    // Re-throw with context so the route can return 422
    throw new Error(`Failed to fetch URL "${url}": ${err.message}`)
  } finally {
    if (browser) await browser.close()
  }
}
