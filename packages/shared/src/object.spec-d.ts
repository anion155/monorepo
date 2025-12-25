import type { PropertyDescriptorReadonly, PropertyDescriptorWritable } from "./object";
import {
  appendMethod,
  appendProperties,
  appendProperty,
  appendValues,
  assignFields,
  assignProperties,
  create,
  createFrom,
  getOwnProperty,
  getProperty,
} from "./object";
import type { Equal, Expect } from "./type-tests";

const value = new (class {
  valueWritable = 1;
  readonly valueReadonly: number = 2;
  get accessorWritable() {
    return 3;
  }
  set accessorWritable(next: number) {}
  get accessorReadonly() {
    return 4;
  }
})();

{
  const descriptors = [
    getOwnProperty(value, "valueWritable"),
    getOwnProperty(value, "valueReadonly"),
    getOwnProperty(value, "accessorWritable"),
    getOwnProperty(value, "accessorReadonly"),
    getOwnProperty(value, "unknown"),
  ] as const;
  type Cases = Expect<
    Equal<
      typeof descriptors,
      readonly [
        PropertyDescriptorWritable<number> | undefined,
        PropertyDescriptorReadonly<number> | undefined,
        PropertyDescriptorWritable<number> | undefined,
        PropertyDescriptorReadonly<number> | undefined,
        undefined,
      ]
    >
  >;
}

{
  const descriptors = [
    getProperty(value, "valueWritable"),
    getProperty(value, "valueReadonly"),
    getProperty(value, "accessorWritable"),
    getProperty(value, "accessorReadonly"),
    getProperty(value, "unknown"),
  ] as const;
  type Cases = Expect<
    Equal<
      typeof descriptors,
      readonly [
        PropertyDescriptorWritable<number>,
        PropertyDescriptorReadonly<number>,
        PropertyDescriptorWritable<number>,
        PropertyDescriptorReadonly<number>,
        undefined,
      ]
    >
  >;
}

{
  const value = {};
  appendProperty(value, "a", { value: 1, writable: true });
  appendProperty(value, "b", { value: 1, writable: false });
  appendProperty(value, "c", { value: 1 });
  type Case = Expect<Equal<typeof value, { a: number; readonly b: number; readonly c: number }>>;
}

{
  const value = {};
  appendMethod(value, "a", () => 1);
  type Case = Expect<Equal<typeof value, { a: () => number }>>;
}

{
  const value = {};
  appendProperties(value, { a: { value: 1 }, b: { value: 1, writable: false }, c: { value: 1, writable: true }, d: { value: (): number => 2 } });
  type Case = Expect<Equal<typeof value, { readonly a: number; readonly b: number; c: number; d: () => number }>>;
}

{
  const value = {};
  appendValues(value, { a: 1, b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}

{
  const source = { a: 1 };
  const value = assignProperties(source, { b: { value: (): number => 2 } });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}

{
  const value = assignFields({ a: 1 }, { b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}

{
  const value = create({ a: 1 }, { b: { value: (): number => 2 } });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}

{
  const value = createFrom({ a: 1 }, { b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}
