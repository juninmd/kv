import { test, expect } from "bun:test";
import { KVStore } from "../src/store";

test("set/get roundtrip preserves JSON value", async () => {
  const s = new KVStore(false);
  await s.set("a/b", { x: 1, y: [2, 3] });
  expect(s.get("a/b")).toEqual({ x: 1, y: [2, 3] });
  expect(s.get("missing")).toBeUndefined();
});

test("ttl expires the value", async () => {
  const s = new KVStore(false);
  await s.set("k", "v", 1);
  const now = Date.now();
  expect(s.get("k", now)).toBe("v");
  expect(s.get("k", now + 2000)).toBeUndefined();
});

test("incr treats missing as 0 and adds", async () => {
  const s = new KVStore(false);
  expect(await s.incr("count")).toBe(1);
  expect(await s.incr("count", 5)).toBe(6);
});

test("incr on non-number throws", async () => {
  const s = new KVStore(false);
  await s.set("str", "hello");
  await expect(s.incr("str")).rejects.toThrow("not a number");
});

test("del removes and reports", async () => {
  const s = new KVStore(false);
  await s.set("k", 1);
  expect(await s.del("k")).toBe(true);
  expect(await s.del("k")).toBe(false);
});

test("list skips expired and reports bytes", async () => {
  const s = new KVStore(false);
  await s.set("live", { a: 1 });
  await s.set("dead", "x", 1);
  const now = Date.now() + 2000;
  const keys = s.list(now);
  expect(keys.length).toBe(1);
  expect(keys[0].key).toBe("live");
  expect(keys[0].bytes).toBeGreaterThan(0);
});
