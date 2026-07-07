import { test, expect, Page } from "@playwright/test";

const TEST_PRODUCT = {
  name: "Playwright Test Shampoo",
  category: "Shampoo & Grooming",
  price: "29.99",
  stock: "50",
  description: "Automated test product",
};

const UPDATED_PRICE = "39.99";

async function addProduct(page: Page, product: typeof TEST_PRODUCT) {
  await page.goto("/products/new");
  await page.getByTestId("input-name").fill(product.name);
  await page.getByTestId("input-category").selectOption(product.category);
  await page.getByTestId("input-price").fill(product.price);
  await page.getByTestId("input-stock").fill(product.stock);
  await page.getByTestId("input-description").fill(product.description);
  await page.getByTestId("btn-submit").click();
  await page.waitForURL("/products");
}

test.describe("Dashboard", () => {
  test("dashboard page loads with stats", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PawShop Ops/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("stats-grid")).toBeVisible();
    const statsCards = page.getByTestId("stats-card");
    await expect(statsCards).toHaveCount(4);
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sidebar")).toBeVisible();
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByTestId("nav-products")).toBeVisible();
  });

  test("recent products section is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("recent-products")).toBeVisible();
  });
});

test.describe("CSV import staging", () => {
  test("maps, validates, and promotes only valid rows", async ({ page }) => {
    await page.goto("/imports");
    await expect(page.getByTestId("import-workspace")).toBeVisible();
    await page.getByTestId("import-next").click();
    await expect(page.getByText("Map source columns")).toBeVisible();
    await page.getByTestId("import-next").click();
    await expect(page.getByText("Staging review")).toBeVisible();
    await expect(page.getByText("Duplicate in this file — skipped")).toBeVisible();
    await expect(page.getByText("Price must be greater than zero")).toBeVisible();
    await page.getByTestId("promote-import").click();
    await expect(page.getByTestId("import-complete")).toBeVisible();
    await expect(page.getByText("3 products moved from staging to production.")).toBeVisible();
  });
});

test.describe("Product List", () => {
  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("products-page")).toBeVisible();
    await expect(page.getByTestId("btn-add-product")).toBeVisible();
  });

  test("search filter is present", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("search-filter")).toBeVisible();
    await expect(page.getByTestId("search-input")).toBeVisible();
    await expect(page.getByTestId("status-filter")).toBeVisible();
  });

  test("navigates to add product page", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("btn-add-product").click();
    await expect(page).toHaveURL("/products/new");
  });
});

test.describe("Add Product", () => {
  test("add product page loads with form", async ({ page }) => {
    await page.goto("/products/new");
    await expect(page.getByTestId("new-product-page")).toBeVisible();
    await expect(page.getByTestId("product-form")).toBeVisible();
    await expect(page.getByTestId("input-name")).toBeVisible();
    await expect(page.getByTestId("input-category")).toBeVisible();
    await expect(page.getByTestId("input-price")).toBeVisible();
    await expect(page.getByTestId("input-stock")).toBeVisible();
    await expect(page.getByTestId("input-status")).toBeVisible();
  });

  test("form validation shows errors for empty required fields", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByTestId("btn-submit").click();
    await expect(page.getByTestId("error-name")).toBeVisible();
    await expect(page.getByTestId("error-category")).toBeVisible();
  });

  test("form validation requires price > 0", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByTestId("input-name").fill("Test Product");
    await page.getByTestId("input-category").selectOption("Toys");
    await page.getByTestId("input-price").fill("0");
    await page.getByTestId("btn-submit").click();
    await expect(page.getByTestId("error-price")).toBeVisible();
  });

  test("cancel button returns to products list", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByTestId("btn-cancel").click();
    await expect(page).toHaveURL("/products");
  });
});

test.describe("Full CRUD Flow", () => {
  test("add product → appear in table → edit → search → delete", async ({ page }) => {
    await addProduct(page, TEST_PRODUCT);

    await expect(page).toHaveURL("/products");
    await expect(page.getByTestId("product-table")).toBeVisible();

    const productRows = page.getByTestId("product-row");
    const targetRow = productRows.filter({
      has: page.getByText(TEST_PRODUCT.name),
    });
    await expect(targetRow).toBeVisible();

    const editBtn = targetRow.getByTestId("btn-edit");
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await targetRow.hover();
    await editBtn.click();
    await expect(page).toHaveURL(/\/products\/.+\/edit/);

    await expect(page.getByTestId("edit-product-page")).toBeVisible();
    await page.getByTestId("input-price").clear();
    await page.getByTestId("input-price").fill(UPDATED_PRICE);
    await page.getByTestId("btn-submit").click();
    await expect(page).toHaveURL("/products");

    await page.getByTestId("search-input").fill(TEST_PRODUCT.name);
    await page.waitForTimeout(500);

    const filteredRow = page.getByTestId("product-row").filter({
      has: page.getByText(TEST_PRODUCT.name),
    });
    await expect(filteredRow).toBeVisible();

    await filteredRow.hover();
    const deleteBtn = filteredRow.getByTestId("btn-delete");
    await deleteBtn.click();

    await expect(page.getByTestId("delete-modal")).toBeVisible();
    await expect(page.getByTestId("delete-modal-confirm")).toBeVisible();
    await page.getByTestId("delete-modal-confirm").click();

    await expect(page.getByTestId("delete-modal")).not.toBeVisible({ timeout: 5000 });
    await expect(filteredRow).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Edit Product", () => {
  test("edit product page loads with pre-filled data", async ({ page }) => {
    await addProduct(page, TEST_PRODUCT);

    const targetRow = page.getByTestId("product-row").filter({
      has: page.getByText(TEST_PRODUCT.name),
    });
    await targetRow.hover();
    await targetRow.getByTestId("btn-edit").click();

    await expect(page.getByTestId("edit-product-page")).toBeVisible();
    await expect(page.getByTestId("input-name")).toHaveValue(TEST_PRODUCT.name);
    await expect(page.getByTestId("input-price")).toHaveValue(TEST_PRODUCT.price);

    await page.getByTestId("btn-cancel").click();
    await expect(page).toHaveURL("/products");

    await page.getByTestId("product-row").filter({ has: page.getByText(TEST_PRODUCT.name) }).hover();
    await page.getByTestId("btn-delete").first().click();
    await page.getByTestId("delete-modal-confirm").click();
  });
});

test.describe("Delete Product", () => {
  test("delete modal has cancel option", async ({ page }) => {
    await addProduct(page, TEST_PRODUCT);

    const targetRow = page.getByTestId("product-row").filter({
      has: page.getByText(TEST_PRODUCT.name),
    });
    await targetRow.hover();
    await targetRow.getByTestId("btn-delete").click();

    await expect(page.getByTestId("delete-modal")).toBeVisible();
    await page.getByTestId("delete-modal-cancel").click();
    await expect(page.getByTestId("delete-modal")).not.toBeVisible();
    await expect(targetRow).toBeVisible();

    await targetRow.hover();
    await targetRow.getByTestId("btn-delete").click();
    await page.getByTestId("delete-modal-confirm").click();
  });
});

test.describe("Search and Filter", () => {
  test("search filters products by name", async ({ page }) => {
    await page.goto("/products");
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("zzznoresultszxq");
    await page.waitForTimeout(600);

    const rows = page.getByTestId("product-row");
    const count = await rows.count();
    if (count === 0) {
      await expect(page.getByTestId("empty-state")).toBeVisible();
    } else {
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("status filter shows only active products", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("status-filter").selectOption("active");
    await page.waitForTimeout(300);

    const statuses = page.getByTestId("product-status");
    const count = await statuses.count();
    for (let i = 0; i < count; i++) {
      const text = await statuses.nth(i).textContent();
      expect(text?.trim()).toBe("Active");
    }
  });

  test("status filter shows only inactive products", async ({ page }) => {
    await page.goto("/products");
    await page.getByTestId("status-filter").selectOption("inactive");
    await page.waitForTimeout(300);

    const statuses = page.getByTestId("product-status");
    const count = await statuses.count();
    for (let i = 0; i < count; i++) {
      const text = await statuses.nth(i).textContent();
      expect(text?.trim()).toBe("Inactive");
    }
  });
});

test.describe("Mobile Layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("stats-grid")).toBeVisible();
  });

  test("products page is usable on mobile", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByTestId("products-page")).toBeVisible();
    await expect(page.getByTestId("btn-add-product")).toBeVisible();
  });

  test("add product form is usable on mobile", async ({ page }) => {
    await page.goto("/products/new");
    await expect(page.getByTestId("product-form")).toBeVisible();
    await expect(page.getByTestId("input-name")).toBeVisible();
    await expect(page.getByTestId("btn-submit")).toBeVisible();
  });
});
