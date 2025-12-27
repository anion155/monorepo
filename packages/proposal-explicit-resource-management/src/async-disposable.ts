import "./symbols";

export interface AsyncDisposable {
  [Symbol.asyncDispose](): Promise<void>;
}
