import { jest } from "@jest/globals";

jest.mock("@anion155/polyfill-base", () => ({
  polyfill(condition: unknown, polyfill: () => void) {
    polyfill();
  },
  polyfillProperty(value: object, key: PropertyKey, descriptor: PropertyDescriptor) {
    const { writable = true, enumerable = true, configurable = true } = descriptor;
    Object.defineProperty(value, key, { ...descriptor, writable, enumerable, configurable });
  },
}));
