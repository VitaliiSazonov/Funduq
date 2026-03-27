import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Test credentials — these must match what the /api/test/reset endpoint creates.
 * Using dedicated test accounts with email confirmation disabled in Supabase.
 */
const HOST_EMAIL = "testhost@funduq.test";
const HOST_PASSWORD = "TestHost123!";
const GUEST_EMAIL = "testguest@funduq.test";
const GUEST_PASSWORD = "TestGuest123!";

const AUTH_DIR = path.join(__dirname, ".auth");
const HOST_STATE = path.join(AUTH_DIR, "host.json");
const GUEST_STATE = path.join(AUTH_DIR, "guest.json");

/**
 * Helper: Sign in via the /login page and save storage state.
 */
async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  storageStatePath: string
) {
  await page.goto("/login");

  // Fill credentials
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();

  // Wait for successful redirect (away from /login)
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });

  // Save the authenticated storage state (cookies, localStorage)
  await page.context().storageState({ path: storageStatePath });
}

// ─────────────────────────────────────────────────────────────
// Setup: Authenticate as Host
// ─────────────────────────────────────────────────────────────
setup("authenticate as host", async ({ page }) => {
  await signIn(page, HOST_EMAIL, HOST_PASSWORD, HOST_STATE);
});

// ─────────────────────────────────────────────────────────────
// Setup: Authenticate as Guest
// ─────────────────────────────────────────────────────────────
setup("authenticate as guest", async ({ page }) => {
  await signIn(page, GUEST_EMAIL, GUEST_PASSWORD, GUEST_STATE);
});
