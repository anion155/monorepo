import "./symbols";

export interface Disposable {
  [Symbol.dispose](): void;
}
