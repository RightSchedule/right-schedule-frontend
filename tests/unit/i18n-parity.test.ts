import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "messages");
const files = readdirSync(join(ROOT, "en")).filter((f) => f.endsWith(".json"));

type Leaves = Record<string, string>;

function flatten(value: unknown, prefix = "", out: Leaves = {}): Leaves {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = String(value);
  }
  return out;
}

const load = (locale: string, file: string) =>
  flatten(JSON.parse(readFileSync(join(ROOT, locale, file), "utf8")));

/** Top-level ICU arguments; plural/select branch text like `{hoje}` is skipped. */
function placeholders(s: string): string[] {
  const names: string[] = [];
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") {
      if (depth === 0) names.push(/^\s*(\w+)/.exec(s.slice(i + 1))?.[1] ?? "");
      depth++;
    } else if (s[i] === "}") {
      depth--;
    }
  }
  return names.sort();
}

describe("translations", () => {
  it("have the same files in every locale", () => {
    const pt = readdirSync(join(ROOT, "pt")).filter((f) => f.endsWith(".json"));
    expect(pt.sort()).toEqual([...files].sort());
  });

  describe.each(files)("%s", (file) => {
    const en = load("en", file);
    const pt = load("pt", file);

    it("has no missing or extra keys", () => {
      expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
    });

    it("has no empty values", () => {
      for (const locale of [en, pt]) {
        for (const [key, value] of Object.entries(locale)) {
          expect(value.trim(), key).not.toBe("");
        }
      }
    });

    it("uses the same placeholders", () => {
      for (const key of Object.keys(en)) {
        if (pt[key] === undefined) continue;
        expect(placeholders(pt[key]!), key).toEqual(placeholders(en[key]!));
      }
    });
  });
});
