import { chromium } from '@playwright/test';

(async () => {
  const baseURL = 'https://www.funduq.ae';
  
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 960 }
  });
  const page = await context.newPage();

  let googleAdsRequestFound = false;
  let whatsAppRedirectFound = false;
  let detectedGoogleAdsUrl = '';
  let detectedWhatsAppUrl = '';

  // Capture network requests
  page.on('request', request => {
    const url = request.url();
    
    // Log everything related to google/tracking to diagnose
    if (url.includes('google') || url.includes('doubleclick') || url.includes('gtag') || url.includes('ad')) {
      console.log(`🌐 Detected Google/Tracking request: ${url}`);
    }

    if (url.includes('18163609312') && url.includes('KNr0CI_Nna0cEODditVD') && url.includes('conversion')) {
      googleAdsRequestFound = true;
      detectedGoogleAdsUrl = url;
      console.log('✅ Found Google Ads Conversion Request!', url);
    }
    if (url.includes('wa.me') || url.includes('api.whatsapp.com')) {
      whatsAppRedirectFound = true;
      detectedWhatsAppUrl = url;
      console.log('✅ Found WhatsApp Redirect:', url);
    }
  });

  try {
    console.log(`Navigating to ${baseURL}/en/villas...`);
    await page.goto(`${baseURL}/en/villas`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('Current Page URL:', page.url());

    // Prioritize [data-testid="property-card"]
    const cards = page.locator('[data-testid="property-card"]');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} property cards by data-testid.`);

    let targetLink = null;
    if (cardCount > 0) {
      targetLink = cards.first();
    } else {
      console.log('Falling back to link regex filtering...');
      // Look for a link containing a slug, e.g., /villas/villa-something
      const allLinks = await page.locator('a[href*="/villas/"]').all();
      for (const link of allLinks) {
        const href = await link.getAttribute('href') || '';
        // Ensure it's not just /en/villas or /villas
        if (href.split('/').filter(Boolean).length > 2) {
          targetLink = link;
          break;
        }
      }
    }

    if (!targetLink) {
      console.error('ERROR: No villa detail links found on page!');
      return;
    }

    console.log('Extracting target URL...');
    const href = await targetLink.getAttribute('href');
    console.log(`Target HREF is: ${href}`);
    
    let targetUrl = href;
    if (href && !href.startsWith('http')) {
      targetUrl = `${baseURL}${href.startsWith('/') ? '' : '/'}${href}`;
    }

    // Inject check-in and check-out dates in future to pre-fill dates and make the form instantly valid!
    const finalUrl = `${targetUrl}?checkIn=2026-07-15&checkOut=2026-07-20`;

    console.log(`Directly navigating to villa detail page with prefilled dates: ${finalUrl}`);
    await page.goto(finalUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log(`Successfully navigated! Current URL: ${page.url()}`);

    // Wait for loader to disappear
    const loader = page.locator('.animate-spin');
    if (await loader.count() > 0) {
      console.log('Waiting for calendar availability API load to finish...');
      await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(e => console.log('Loader did not hide in time.'));
    }
    
    await page.waitForTimeout(2000);

    // Look for first submit button
    const submitBtn = page.locator('[data-testid="request-to-book-btn"]').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Checking button attributes...');
    const className = await submitBtn.getAttribute('class') || '';
    console.log(`Button class: ${className}`);
    
    if (className.includes('pointer-events-none') || className.includes('opacity-40')) {
      console.log('⚠️ Button is still disabled despite pre-fill! Attempting to force click...');
    } else {
      console.log('✅ SUCCESS: Button is fully enabled and active!');
    }

    console.log('Clicking Request to Book...');
    // Use standard click first, or force click to be sure
    await submitBtn.click();

    console.log('Clicked. Waiting for events to fire...');
    for (let i = 0; i < 16; i++) {
      await page.waitForTimeout(500);
      if (googleAdsRequestFound && whatsAppRedirectFound) {
        break;
      }
    }

    console.log('\n====================================');
    console.log('🏁 QA CHECKLIST VERIFICATION RESULTS:');
    console.log(`1. [GOOGLE ADS EVENT]: ${googleAdsRequestFound ? '✅ PASSED' : '❌ FAILED'}`);
    if (googleAdsRequestFound) {
      console.log(`   🚀 Conversion Pixel Fired: ${detectedGoogleAdsUrl}`);
    }
    console.log(`2. [WHATSAPP TRANSITION]: ${whatsAppRedirectFound ? '✅ PASSED' : '❌ FAILED'}`);
    if (whatsAppRedirectFound) {
      console.log(`   💬 WhatsApp Redirect Initiated: ${detectedWhatsAppUrl}`);
    }
    console.log('====================================\n');

    if (googleAdsRequestFound && whatsAppRedirectFound) {
      console.log('🎉 SUCCESS: BOTH QA REQUIREMENTS MET!');
    } else {
      console.log('⚠️ WARNING: One or more checks failed.');
    }

  } catch (error) {
    console.error('❌ QA execution failed with error:', error);
  } finally {
    await browser.close();
  }
})();
