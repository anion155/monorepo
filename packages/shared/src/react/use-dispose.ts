import { isDisposable } from "../disposable";
import { useRenderEffect } from "./use-render-effect";

/**
 * Disposes {@link disposable} on value change or unmount.
 *
 * @example
 *  const Component = () => {
 *    const [value, setValue] = useState();
 *    useDispose(value);
 *  };
 */
export function useDispose(disposable: Disposable | AsyncDisposable): void;
export function useDispose(value: unknown): void;
export function useDispose(disposable: unknown) {
  useRenderEffect(() => {
    if (isDisposable(disposable)) {
      return () => {
        disposable[Symbol.dispose]();
      };
    }
    if (isDisposable.async(disposable)) {
      return () => {
        disposable[Symbol.asyncDispose]();
      };
    }
  }, [disposable]);
}
