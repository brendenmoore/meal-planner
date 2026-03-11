import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:3001";

const waitForReady = async (page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
};

const runScenario = async ({ label, viewport, withAuth }) => {
  const issues = [];
  const observations = [];
  const consoleErrors = [];
  const requestFailures = [];
  const pageErrors = [];
  const badResponses = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err?.stack || String(err)));
  page.on("requestfailed", (req) => {
    const failureText = req.failure()?.errorText || "failed";
    if (failureText === "net::ERR_ABORTED") {
      if (req.url().includes("?_rsc=")) return;
      if (req.url().includes("/api/")) return;
      return;
    }
    requestFailures.push(`${req.method()} ${req.url()} -> ${failureText}`);
  });

  page.on("response", (res) => {
    const url = res.url();
    if (!url.startsWith(BASE_URL)) return;
    if (url.includes("/_next/")) return;
    if (res.status() >= 400) {
      badResponses.push(`${res.status()} ${url}`);
    }
  });

  // Capture dialogs for validation and avoid blocking.
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  const takeShot = async (slug) => {
    await page.screenshot({ path: `artifacts/qa-${label}-${slug}.png`, fullPage: true });
  };

  // Home (unauth state check)
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await waitForReady(page);
  await takeShot("home");

  const homeGreeting = page.getByText("Welcome back, Chef!");
  if (!withAuth && await homeGreeting.isVisible()) {
    issues.push("Unauthenticated home shows the dashboard instead of a landing/login prompt.");
  }

  const initialUrl = page.url();
  const newRecipeBtn = page.getByRole("button", { name: /New Recipe/i });
  if (await newRecipeBtn.isVisible()) {
    await newRecipeBtn.click();
    await page.waitForTimeout(200);
    if (page.url() === initialUrl) {
      issues.push("Home: New Recipe button does not navigate.");
    }
  }

  const viewAllBtn = page.getByRole("button", { name: /View All/i });
  if (await viewAllBtn.isVisible()) {
    await viewAllBtn.click();
    await page.waitForTimeout(200);
    if (page.url() === initialUrl) {
      issues.push("Home: View All button does not navigate.");
    }
  }

  if (withAuth) {
    // Auth flow
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await waitForReady(page);
    await takeShot("login");

    const email = `qa+${Date.now()}@example.com`;
    const password = "Test1234!";

    const emailInput = page.getByLabel("Email");
    if (await emailInput.count()) {
      await emailInput.fill(email);
    } else {
      await page.getByPlaceholder("you@example.com").fill(email);
    }

    const passwordInput = page.getByLabel("Password");
    if (await passwordInput.count()) {
      await passwordInput.fill(password);
    } else {
      await page.getByPlaceholder("••••••••").fill(password);
    }
    const loginScope = page.getByRole("main");
    await loginScope.getByRole("button", { name: /Create Account/i }).click({ force: true });
    await page.waitForTimeout(1000);

    const statusText = page.locator("text=Account created");
    if (await statusText.isVisible()) {
      observations.push("Sign up returned 'Account created' status. Email confirmation may be required.");
    }

    await loginScope.getByRole("button", { name: /^Sign In$/i }).click({ force: true });
    await page.waitForTimeout(1000);

    if (page.url().includes("/login")) {
      const errorText = await page.locator("[class*=\"error\"]").first().textContent().catch(() => null);
      issues.push(
        `Auth: Sign in did not navigate away from /login (email confirmation or auth failure).${errorText ? ` Error: ${errorText}` : ""}`
      );
    } else {
      const recipeName = `QA Recipe ${Date.now()}`;
      const planName = `QA Plan ${Date.now()}`;
      const templateName = `QA Template ${Date.now()}`;

      // Create recipe
      await page.goto(`${BASE_URL}/recipes/new`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await page.getByPlaceholder("e.g., Grandma's Lasagna").fill(recipeName);
      await page.getByPlaceholder("Amount (e.g., 2 cups)").fill("1 cup");
      await page.getByPlaceholder("Ingredient name").fill("Rice");
      await page.getByPlaceholder("Step 1: Preheat the oven to 350°F...").fill("Cook rice.");
      await page.getByRole("button", { name: /Save Recipe/i }).click();
      await page.waitForTimeout(1000);

      await page.goto(`${BASE_URL}/recipes`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const recipeListItem = page.getByText(recipeName).first();
      if (!(await recipeListItem.count())) {
        issues.push("E2E: Created recipe did not appear in Recipes list.");
      }

      // Create meal plan
      await page.goto(`${BASE_URL}/meal-plans/new`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await page.getByPlaceholder("e.g., Italian Night, Quick Breakfasts...").fill(planName);
      await page.getByText("Loading recipes...").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
      const recipeResult = page.getByText(recipeName).first();
      try {
        await recipeResult.waitFor({ timeout: 5000 });
        const recipeRow = recipeResult.locator("..").locator("..");
        const addRecipeBtn = recipeRow.getByRole("button", { name: /Add/i });
        await addRecipeBtn.click();
      } catch {
        issues.push("E2E: Recipe did not appear in Add Recipes list.");
      }
      const savePlanBtn = page.getByRole("button", { name: /Save Plan/i });
      await savePlanBtn.waitFor({ state: "visible" });
      if (await savePlanBtn.isDisabled()) {
        await page.waitForTimeout(500);
      }
      await savePlanBtn.click({ force: true });
      await page.waitForURL("**/meal-plans", { timeout: 5000 }).catch(() => {});

      await page.goto(`${BASE_URL}/meal-plans`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const planListItem = page.getByText(planName).first();
      try {
        await planListItem.waitFor({ timeout: 5000 });
      } catch {
        issues.push("E2E: Created meal plan did not appear in Meal Plans list.");
      }

      // Create template
      await page.goto(`${BASE_URL}/templates/new`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      await page.getByPlaceholder("e.g., Summer Diet Week 1").fill(templateName);
      await page.getByText("Loading meal plans...").waitFor({ state: "detached", timeout: 5000 }).catch(() => {});
      const planResult = page.getByText(planName).first();
      try {
        await planResult.waitFor({ timeout: 5000 });
        const planRow = planResult.locator("..").locator("..");
        const addPlanBtn = planRow.getByRole("button", { name: /Add/i });
        await addPlanBtn.click();
      } catch {
        issues.push("E2E: Meal plan did not appear in Add Meal Plans list.");
      }
      const saveTemplateBtn = page.getByRole("button", { name: /Save Template/i });
      await saveTemplateBtn.waitFor({ state: "visible" });
      if (await saveTemplateBtn.isDisabled()) {
        await page.waitForTimeout(500);
      }
      await saveTemplateBtn.click({ force: true });
      await page.waitForURL("**/templates", { timeout: 5000 }).catch(() => {});

      await page.goto(`${BASE_URL}/templates`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const templateListItem = page.getByText(templateName).first();
      try {
        await templateListItem.waitFor({ timeout: 5000 });
      } catch {
        issues.push("E2E: Created template did not appear in Templates list.");
      }

      // Schedule add item
      await page.goto(`${BASE_URL}/schedule`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const dayAddBtn = page.locator('[class*="addMealBtn"]').first();
      if (await dayAddBtn.isVisible()) {
        await dayAddBtn.click();
        await page.waitForTimeout(300);
        const addItem = page.getByText("Quick Lunch").first();
        if (await addItem.isVisible()) {
          await addItem.click();
          await page.waitForTimeout(300);
          if (!(await page.getByText("Quick Lunch").count())) {
            issues.push("E2E: Added schedule item not visible in calendar.");
          }
        }
      }

      // Shopping list generation
      await page.goto(`${BASE_URL}/shopping-list`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const generateBtn = page.getByRole("button", { name: /Generate List/i });
      if (await generateBtn.isVisible()) {
        await generateBtn.click({ force: true });
        await page.waitForTimeout(500);
        const manualInput = page.getByPlaceholder("Add a quick item...");
        if (await manualInput.isVisible()) {
          await manualInput.fill("QA Item");
          const manualForm = page.locator("form").filter({ has: manualInput });
          await manualForm.getByRole("button", { name: /Add/i }).click();
          await page.waitForTimeout(200);
          if (!(await page.getByText("QA Item").count())) {
            issues.push("E2E: Manual shopping list item not visible.");
          }
        }
      }
    }
  }

  // Navbar links
  const navLinks = await page.locator("nav a").all();
  const navHrefs = new Set();
  for (const link of navLinks) {
    const href = await link.getAttribute("href");
    if (href) navHrefs.add(href);
  }

  // Explicitly test main routes.
  const routes = new Set([
    "/",
    "/recipes",
    "/recipes/new",
    "/schedule",
    "/shopping-list",
    "/meal-plans",
    "/meal-plans/new",
    "/templates",
    "/templates/new",
    "/profile",
    ...navHrefs,
  ]);

  for (const path of routes) {
    try {
      const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
      await waitForReady(page);
      const currentUrl = page.url();
      if (response && response.status() === 404) {
        issues.push(`Route ${path} returned 404.`);
      }

      const screenshotPath = `artifacts/qa-${label}-${path.replace(/\//g, "_") || "root"}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      if (path === "/schedule" && currentUrl.includes("/schedule")) {
        const autofill = page.getByRole("button", { name: /Autofill from Template/i });
        if (await autofill.isVisible()) {
          await autofill.click();
          await page.waitForTimeout(200);
        } else {
          issues.push("Schedule: Autofill button not visible.");
        }

        const plusButton = page.locator('[class*="addMealBtn"]').first();
        if (await plusButton.isVisible()) {
          await plusButton.click();
          await page.waitForTimeout(200);
        }

        const modalHeading = page.locator("text=Add to");
        if (await modalHeading.count()) {
          const overlay = page.locator('[class*="overlay"]').filter({ has: modalHeading });
          const firstResult = overlay.getByText("Italian Night").first();
          if (await firstResult.count()) {
            await firstResult.click({ timeout: 5000 });
            await page.waitForTimeout(200);
          }
        } else {
          issues.push("Schedule: Add meal modal did not appear when clicking +.");
        }
      }

      if (path === "/shopping-list" && currentUrl.includes("/shopping-list")) {
        const generateBtn = page.getByRole("button", { name: /Generate List/i });
        if (await generateBtn.isVisible()) {
          await generateBtn.click();
          await page.waitForTimeout(300);
        } else {
          issues.push("Shopping List: Generate List button not visible.");
        }

        const manualInput = page.getByPlaceholder("Add a quick item...");
        if (await manualInput.isVisible()) {
          await manualInput.fill("Test Item");
          const manualForm = page.locator("form").filter({ has: manualInput });
          await manualForm.getByRole("button", { name: /Add/i }).click();
          await page.waitForTimeout(200);
        }
      }

      if (path === "/recipes/new") {
        const saveBtn = page.getByRole("button", { name: /Save Recipe/i });
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(200);
        }
      }

      if (withAuth && page.url().includes("/login") && path !== "/login") {
        issues.push(`Auth: Navigating to ${path} redirected to /login.`);
      }
    } catch (error) {
      issues.push(`Navigation or interaction error on ${path}: ${error}`);
    }
  }

  if (dialogs.length) {
    observations.push(...dialogs.map((msg) => `Dialog observed: ${msg}`));
  }

  if (consoleErrors.length) {
    issues.push(...consoleErrors.map((msg) => `Console error: ${msg}`));
  }
  if (pageErrors.length) {
    issues.push(...pageErrors.map((msg) => `Page error: ${msg}`));
  }
  if (requestFailures.length) {
    issues.push(...requestFailures.map((msg) => `Request failed: ${msg}`));
  }
  if (badResponses.length) {
    issues.push(...badResponses.map((msg) => `Bad response: ${msg}`));
  }

  await browser.close();
  return { label, issues, observations, consoleErrors, pageErrors, requestFailures };
};

const main = async () => {
  await import("node:fs").then((fs) => {
    if (!fs.existsSync("artifacts")) fs.mkdirSync("artifacts");
  });

  const desktop = await runScenario({ label: "desktop", viewport: { width: 1440, height: 900 }, withAuth: false });
  const mobile = await runScenario({ label: "mobile", viewport: { width: 390, height: 844 }, withAuth: false });
  const desktopAuth = await runScenario({ label: "desktop-auth", viewport: { width: 1440, height: 900 }, withAuth: true });

  const allIssues = [...desktop.issues, ...mobile.issues, ...desktopAuth.issues];
  const uniqueIssues = Array.from(new Set(allIssues));

  const report = {
    desktop,
    mobile,
    desktopAuth,
    uniqueIssues,
  };

  await import("node:fs").then((fs) => {
    fs.writeFileSync("artifacts/qa-report.json", JSON.stringify(report, null, 2));
  });

  console.log(JSON.stringify(report, null, 2));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
