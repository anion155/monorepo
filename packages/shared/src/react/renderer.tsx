import type { ReactNode } from "react";

/**
 * Small utility component for the times when you don't want to create separate component
 * and you don't need to rerender based on reconciliation.
 *
 * @example
 *  const App = () => {
 *    return (
 *      <SomeWrapper>
 *        <SomeLogic />
 *        <Renderer
 *          render={() => {
 *            const [count, setCounter] = useState(5);
 *            const inc = useCallback(() => setCounter(current => current + 1), []);
 *            return <button onClick={inc}>{count}</button>;
 *          }}
 *        />
 *        <Suspense>
 *          <Renderer hook={() => use(createCachedPromise())} />
 *        </Suspense>
 *      </SomeWrapper>
 *    );
 *  }
 */
export const Renderer = ({ render, hook }: ExclusiveUnion<{ render: () => ReactNode }, { hook: () => void }>) => {
  if (hook) {
    hook();
    return null;
  } else if (render) {
    return render?.();
  }
  return null;
};
