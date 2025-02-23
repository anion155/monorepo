import { Equal, Expect } from "../type-tests";
import {
  appendMethod,
  appendProperties,
  appendProperty,
  assignProperties,
  create,
  getOwnProperty,
  getProperty,
  PropertyDescriptorReadonly,
  PropertyDescriptorWritable,
} from "./object";

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
  appendProperty(value, "a", { value: 1 });
  type Case = Expect<Equal<typeof value, { a: number }>>;
}

{
  const value = {};
  appendMethod(value, "a", () => 1);
  type Case = Expect<Equal<typeof value, { a: () => number }>>;
}

{
  const value = {};
  appendProperties(value, { a: 1, b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number; b: () => number }>>;
}

{
  const value = assignProperties({ a: 1 }, { b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number } & { b: () => number }>>;
}

{
  const value = create({ a: 1 }, { b: (): number => 2 });
  type Case = Expect<Equal<typeof value, { a: number } & { b: () => number }>>;
}
