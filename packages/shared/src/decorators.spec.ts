import { describe, expect, it, jest } from "@jest/globals";

import { bound, cached } from "./decorators";

describe("decorators", () => {
  describe("cached()", () => {
    it("should call getter only once per instance", () => {
      const spy = jest.fn(() => 5);
      class Test {
        @cached
        get field() {
          return spy();
        }
      }
      expect(spy).toHaveBeenCalledTimes(0);
      const a = new Test();
      expect(spy).toHaveBeenCalledTimes(0);
      expect(a.field).toBe(5);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(a.field).toBe(5);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should not change prototype field", () => {
      class Test {
        @cached
        get field() {
          return 1;
        }
      }
      const protoField = Object.getOwnPropertyDescriptor(Test.prototype, "field");
      void new Test().field;
      expect(protoField).toStrictEqual(Object.getOwnPropertyDescriptor(Test.prototype, "field"));
    });

    it("should keep original emumerable state", () => {
      class Test {
        @cached
        get enumerable() {
          return 1;
        }
        @cached
        get nonenumerable() {
          return 1;
        }
      }
      Object.defineProperty(Test.prototype, "enumerable", { enumerable: true });
      Object.defineProperty(Test.prototype, "nonenumerable", { enumerable: false });
      const a = new Test();
      expect(Object.getOwnPropertyDescriptor(Test.prototype, "enumerable")?.enumerable).toBe(true);
      expect(Object.getOwnPropertyDescriptor(Test.prototype, "nonenumerable")?.enumerable).toBe(false);
      void a.enumerable;
      void a.nonenumerable;
      expect(Object.getOwnPropertyDescriptor(a, "enumerable")?.enumerable).toBe(true);
      expect(Object.getOwnPropertyDescriptor(a, "nonenumerable")?.enumerable).toBe(false);
    });
  });

  describe("bound()", () => {
    it("should bound method to instance", () => {
      class Test {
        field = 1;
        @bound method() {
          return this.field;
        }
      }
      const { method } = new Test();
      expect(method()).toBe(1);
    });
  });
});
