import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import path from "path";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const HOST_STATE = path.join(__dirname, "..", ".auth", "host.json");
const GUEST_STATE = path.join(__dirname, "..", ".auth", "guest.json");

const HOST_EMAIL = "testhost@funduq.test";
const HOST_PASSWORD = "TestHost123!";
const GUEST_EMAIL = "testguest@funduq.test";
const GUEST_PASSWORD = "TestGuest123!";

/** Unique suffix to guarantee test isolation across runs */
const RUN_ID = Date.now().toString(36);
const TEST_PROPERTY_TITLE = `E2E Villa ${RUN_ID}`;

const AIRBNB_MOCK_URL = "https://airbnb.com/rooms/12345678";

// ─────────────────────────────────────────────────────────────
// Database Reset — runs before the test to ensure clean state
// ─────────────────────────────────────────────────────────────
test.beforeAll(async ({ request }) => {
  const res = await request.post("/api/test/reset", {
    data: {
      hostEmail: HOST_EMAIL,
      hostPassword: HOST_PASSWORD,
      guestEmail: GUEST_EMAIL,
      guestPassword: GUEST_PASSWORD,
    },
  });

  const body = await res.json();
  expect(res.ok(), `DB reset failed: ${JSON.stringify(body)}`).toBeTruthy();
  expect(body.success).toBe(true);
});

// ─────────────────────────────────────────────────────────────
// Critical Path E2E Test
// ─────────────────────────────────────────────────────────────
test.describe("Funduq Critical Booking Flow", () => {
  test("host imports property, guest books, contacts revealed after confirmation", async ({
    browser,
  }) => {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: HOST FLOW — Import a property from Airbnb
    // ═══════════════════════════════════════════════════════════
    let propertyId: string | undefined;

    await test.step("Host imports a property via Airbnb flow", async () => {
      const hostContext = await browser.newContext({
        storageState: HOST_STATE,
      });
      const hostPage = await hostContext.newPage();

      // Navigate to new property page
      await hostPage.goto("/host/properties/new");
      await expect(
        hostPage.getByText("How would you like to start?")
      ).toBeVisible({ timeout: 15_000 });

      // ─── Choose "Import from Airbnb" path ───
      // Fill in a mock Airbnb URL
      await hostPage
        .getByPlaceholder("https://airbnb.com/rooms/...")
        .fill(AIRBNB_MOCK_URL);

      // Click Import Listing
      await hostPage.getByTestId("import-submit").click();

      // Wait for the import loading to complete and wizard to appear
      // The mock import takes ~2s + stage animations
      await expect(
        hostPage.getByText("Imported from Airbnb — Review & Edit")
      ).toBeVisible({ timeout: 30_000 });

      // ─── Wizard is now prefilled. Override the title ───
      // Step 0: Basics — clear and set unique title
      const titleInput = hostPage.locator('input[name="title"]');
      await titleInput.clear();
      await titleInput.fill(TEST_PROPERTY_TITLE);

      // Select emirate
      await hostPage.locator('select[name="location_emirate"]').selectOption("Dubai");

      // Fill district
      const districtInput = hostPage.locator('input[name="location_district"]');
      await districtInput.clear();
      await districtInput.fill("Palm Jumeirah");

      // Click Continue to next step (Details)
      await hostPage.getByRole("button", { name: "Continue" }).click();

      // Step 1: Details — pre-filled from import, just continue
      await expect(hostPage.getByText("Description")).toBeVisible();
      await hostPage.getByRole("button", { name: "Continue" }).click();

      // Step 2: Amenities — select at least one
      await expect(
        hostPage.getByText("Select all amenities that apply")
      ).toBeVisible();
      await hostPage.getByText("Private Pool").click();
      await hostPage.getByRole("button", { name: "Continue" }).click();

      // Step 3: Gallery — images are pre-filled from import, continue
      await expect(
        hostPage.getByText(/imported images|Add image URLs/i)
      ).toBeVisible();
      // If there are imported images, just continue; if not, add a placeholder
      const imageCount = await hostPage.locator('[alt^="Property image"]').count();
      if (imageCount === 0) {
        // Add a placeholder image
        const imageInput = hostPage.getByPlaceholder("Paste image URL...");
        await imageInput.fill(
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80"
        );
        await imageInput.press("Enter");
        await expect(hostPage.locator('[alt="Property image 1"]')).toBeVisible();
      }
      await hostPage.getByRole("button", { name: "Continue" }).click();

      // Step 4: Pricing — pre-filled from import, submit
      await expect(hostPage.getByText("Listing Preview")).toBeVisible();
      await hostPage.getByRole("button", { name: "Publish Listing" }).click();

      // ─── Assert: success state appears ───
      await expect(hostPage.getByText("Congratulations!")).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        hostPage.getByText("Property listed successfully!")
      ).toBeVisible();

      // ─── Verify property appears on the host dashboard ───
      await hostPage.goto("/host/dashboard");
      await expect(hostPage.getByText(TEST_PROPERTY_TITLE)).toBeVisible({
        timeout: 10_000,
      });

      // Grab the property ID from the catalogue for later use
      await hostPage.goto("/villas");
      const propertyCard = hostPage
        .getByTestId("property-card-title")
        .filter({ hasText: TEST_PROPERTY_TITLE });
      await expect(propertyCard).toBeVisible({ timeout: 10_000 });

      // Get property ID from the card link
      const cardLink = propertyCard.locator("xpath=ancestor::a");
      const href = await cardLink.getAttribute("href");
      propertyId = href?.split("/villas/")[1];
      expect(propertyId).toBeTruthy();

      await hostContext.close();
    });

    // ═══════════════════════════════════════════════════════════
    // STEP 2: GUEST FLOW — Find property, book, see contacts
    // ═══════════════════════════════════════════════════════════
    await test.step("Guest books the property and sees owner contacts after host approval", async () => {
      expect(propertyId).toBeTruthy();

      // ─── 2a. Guest finds & requests a booking ───
      const guestContext = await browser.newContext({
        storageState: GUEST_STATE,
      });
      const guestPage = await guestContext.newPage();

      // Navigate to villas catalogue
      await guestPage.goto("/villas");
      await expect(
        guestPage.getByTestId("property-card-title").filter({
          hasText: TEST_PROPERTY_TITLE,
        })
      ).toBeVisible({ timeout: 10_000 });

      // Click on the property card to go to detail page
      await guestPage
        .getByTestId("property-card")
        .filter({ hasText: TEST_PROPERTY_TITLE })
        .click();

      // Verify we're on the detail page
      await expect(guestPage.getByTestId("property-title")).toHaveText(
        TEST_PROPERTY_TITLE,
        { timeout: 10_000 }
      );

      // ─── Select dates in BookingWidget ───
      // Wait for calendar to load
      await expect(
        guestPage.getByTestId("booking-submit")
      ).toBeVisible({ timeout: 15_000 });

      // Select a date range: click two dates in the calendar
      // We'll pick the 15th and 18th of the visible month
      // First, find available day buttons (not disabled)
      const calendarDays = guestPage.locator(
        '.rdp-funduq button:not([disabled]):not([aria-disabled="true"])'
      );

      // Wait for calendar to be ready
      await expect(calendarDays.first()).toBeVisible({ timeout: 10_000 });

      // Get available day buttons and pick two that are separated
      const availableDays = await calendarDays.all();
      expect(availableDays.length).toBeGreaterThanOrEqual(4);

      // Click the 3rd available day as check-in
      await availableDays[2].click();
      // Click the 5th available day as check-out (3 nights)
      await availableDays[4].click();

      // Select 2 guests
      await guestPage
        .locator("select")
        .filter({ hasText: /Guest/ })
        .selectOption("2");

      // Click "Request to Book"
      await guestPage.getByTestId("booking-submit").click();

      // Assert success message
      const bookingResult = guestPage.getByTestId("booking-result");
      await expect(bookingResult).toBeVisible({ timeout: 15_000 });
      await expect(bookingResult).toHaveAttribute("data-success", "true");
      await expect(bookingResult).toContainText("Booking request sent!");

      // ─── 2b. Host approves the booking ───
      const hostContext = await browser.newContext({
        storageState: HOST_STATE,
      });
      const hostPage = await hostContext.newPage();

      await hostPage.goto("/host/bookings");

      // Find the booking for our test property
      await expect(
        hostPage.getByText(TEST_PROPERTY_TITLE)
      ).toBeVisible({ timeout: 15_000 });

      // Verify the booking is pending
      const statusBadge = hostPage.getByTestId("booking-status").first();
      await expect(statusBadge).toContainText("pending", { ignoreCase: true });

      // Click Approve
      await hostPage.getByTestId("booking-approve").first().click();

      // Wait for page refresh → status should change to confirmed
      await expect(statusBadge).toContainText("confirmed", {
        ignoreCase: true,
        timeout: 10_000,
      });

      await hostContext.close();

      // ─── 2c. Guest sees owner contacts ───
      await guestPage.goto("/guest/bookings");

      // Find the booking for our test property
      await expect(
        guestPage.getByText(TEST_PROPERTY_TITLE)
      ).toBeVisible({ timeout: 15_000 });

      // Verify status is Confirmed
      const guestStatusBadge = guestPage
        .locator('[class*="bg-green"]')
        .filter({ hasText: /confirmed/i });
      await expect(guestStatusBadge.first()).toBeVisible({ timeout: 10_000 });

      // Verify ContactReveal block is visible
      const contactBlock = guestPage.getByTestId("contact-reveal");
      await expect(contactBlock).toBeVisible({ timeout: 15_000 });

      // Verify phone is displayed
      const phone = guestPage.getByTestId("contact-phone");
      await expect(phone).toBeVisible();
      await expect(phone).toContainText("+971");

      // Verify email is displayed
      const email = guestPage.getByTestId("contact-email");
      await expect(email).toBeVisible();

      // Verify WhatsApp button with correct href
      const whatsapp = guestPage.getByTestId("contact-whatsapp");
      await expect(whatsapp).toBeVisible();
      await expect(whatsapp).toContainText("WhatsApp");
      const waHref = await whatsapp.getAttribute("href");
      expect(waHref).toContain("wa.me");

      await guestContext.close();
    });
  });
});
