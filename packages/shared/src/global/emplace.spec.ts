import "./emplace";

import { describe, expect, it } from "@jest/globals";

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

  it("WeakMap's .withFabric() should return existing or create new value", () => {
    const source = new WeakMap([[first, { value: "manual-1" }]]);
    let map = source.withFabric(fabric);
    expect(map.emplace(first)).toStrictEqual({ value: "fabric-1" });
    map = source.withFabric(fabric, [first]);
    expect(map.emplace(first)).toStrictEqual({ value: "manual-1" });
    expect(map.emplace(second)).toStrictEqual({ value: "fabric-2" });
  });
});
