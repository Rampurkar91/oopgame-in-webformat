import { test, expect } from "@playwright/test";

test("compiled engine loads, simulation dispatches, saves and restores after refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Command centre." }),
  ).toBeVisible();
  const wasm = await page.request.get("/wasm/game.wasm");
  expect(wasm.headers()["content-type"]).toContain("application/wasm");
  expect((await wasm.body()).subarray(0, 4).toString("hex")).toBe("0061736d");
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Dispatch rescue unit" }).click();
  await expect(page.getByText("Mission in progress")).toBeVisible();
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Command centre." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load operation", exact: true })
    .click();
  await expect(page.getByText("Mission in progress")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume simulation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Change simulation speed" }).click();
  await page.getByRole("button", { name: "Change simulation speed" }).click();
  await page.getByRole("button", { name: "Resume simulation" }).click();
  await expect(page.getByText(/safely delivered/)).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Pause simulation" }).click();
  for (const name of [
    "Rescue fleet",
    "Civilians",
    "Missions",
    "Facilities",
    "Pathfinder",
    "Analytics",
  ]) {
    await page.locator("nav").getByRole("button", { name }).click();
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("Dijkstra draws an actual C++ route and rejects blocked cells", async ({
  page,
}) => {
  await page.goto("/#Pathfinder");
  await expect(
    page.getByRole("heading", { name: "Dijkstra pathfinder." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Calculate route" }).click();
  await expect(page.getByText("Optimal route found")).toBeVisible();
  await page.getByLabel("Start cell", { exact: true }).fill("16");
  await page.getByRole("button", { name: "Calculate route" }).click();
  await expect(page.getByText("No reachable route")).toBeVisible();
});

test("restart resets the operation only after confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Command centre." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start simulation", exact: true })
    .click();
  await page.getByRole("button", { name: "Dispatch rescue unit" }).click();
  await page
    .getByRole("button", { name: "Restart simulation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Restart operation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start simulation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ready to deploy", { exact: false }),
  ).toBeVisible();
});

test("mobile command centre has working navigation and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Command centre." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Civilians", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "People, not just coordinates." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
