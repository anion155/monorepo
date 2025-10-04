import "./emplace";

import { describe, expect, it } from "@jest/globals";

import { Waiter } from "../jest/waiter";
import { SmartWeakRef } from "./emplace";

describe("Map emplace extensions", () => {
  const fabric = ({ id }: { id: number }) => ({ value: `fabric-${id}` });
  const first = { id: 1 };
  const second = { id: 2 };

  it("Map's .emplace() should return existing or create new value", () => {
    const map = new Map([[first, { value: "manual-1" }]]);
    expect(map.emplace(first, fabric)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second, fabric)).toStrictEqual({ value: "fabric-2" });
  });

  it("Map.withFabric() should return existing or create new value", () => {
    const map = Map.withFabric(fabric, [[first, { value: "manual-1" }]]);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("new Map.withFabric() should return existing or create new value", () => {
    const map = new Map.withFabric(fabric, [[first, { value: "manual-1" }]]);
    expect(map).toBeInstanceOf(Map);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("Map's .withFabric() should return existing or create new value", () => {
    const source = new Map([[first, { value: "manual-1" }]]);
    const map = source.withFabric(fabric);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("WeakMap's .emplace() should return existing or create new value", () => {
    const map = new WeakMap([[first, { value: "manual-1" }]]);
    expect(map.emplace(first, fabric)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second, fabric)).toStrictEqual({ value: "fabric-2" });
  });

  it("WeakMap.withFabric() should return existing or create new value", () => {
    const map = WeakMap.withFabric(fabric, [[first, { value: "manual-1" }]]);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("new WeakMap.withFabric() should return existing or create new value", () => {
    const map = new WeakMap.withFabric(fabric, [[first, { value: "manual-1" }]]);
    expect(map).toBeInstanceOf(WeakMap);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("WeakMap's .withFabric() should return existing or create new value", () => {
    const source = new WeakMap([[first, { value: "manual-1" }]]);
    let map = source.withFabric(fabric);
    expect(map.emplace(first)).toStrictEqual({ value: "fabric-1" });
    map = source.withFabric(fabric, [first]);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });

  it("class SmartWeakRef should wrap WeakRef and restore value if .emplace() is called", async () => {
    class Test {}
    let ref: SmartWeakRef<Test>;
    const waiter = new Waiter(() => {
      ref = new SmartWeakRef(() => new Test());
      const value = ref.deref()!;
      expect(value).toBeInstanceOf(Test);
      return value;
    });
    expect(ref!.emplace()).toBeInstanceOf(Test);
    await waiter.await();
    expect(ref!.deref()).toBeUndefined();
    expect(ref!.emplace()).toBeInstanceOf(Test);
  });
});
