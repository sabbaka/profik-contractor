import { readdirSync } from "fs";
import { join, relative } from "path";

/**
 * expo-router turns every .ts/.tsx file under app/ into a route — its ignore
 * pattern spares only +api, +html and +native-intent files. A test placed
 * beside its route would be bundled into the app, and evaluating it calls
 * `jest.mock` on a device where `jest` does not exist. Tests for route files
 * live here instead, under __tests__/app/, mirroring the route's path.
 */
test("no test files under app/", () => {
  const root = join(__dirname, "../../app");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(test|spec)\.[tj]sx?$/.test(entry.name))
        found.push(relative(root, path));
    }
  };
  walk(root);
  expect(found).toEqual([]);
});
