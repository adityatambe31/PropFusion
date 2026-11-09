import { test, expect } from "@playwright/test";

test("public sign-in offers manager and tenant roles", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("heading", { name: "Choose how you want to sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Property Manager/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tenant/ })).toBeVisible();
});
test("manager role selection opens manager sign-in", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByRole("link", { name: /Property Manager/ }).click();
  await expect(page).toHaveURL(/role=manager/);
  await expect(page.getByText("Signing in as")).toBeVisible();
});
test("tenant route opens tenant sign-in", async ({ page }) => {
  await page.goto("/tenant/sign-in");
  await expect(page).toHaveURL(/\/auth\/sign-in\?role=tenant/);
});
test("anonymous manager dashboard redirects to sign-in", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/dashboard/leases");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});
test("anonymous tenant dashboard redirects to tenant sign-in", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/tenant/dashboard");
  await expect(page).toHaveURL(/\/auth\/sign-in\?role=tenant/);
});
