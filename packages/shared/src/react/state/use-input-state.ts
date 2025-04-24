import { useState } from "react";

import type { State } from "./types";
import { useSetStateDispatcher } from "./utils/use-set-state-dispatcher";

/** Input state that can be used as proxy state in Input implementations. */
export function useInputState<Value>(props: { value?: Value; defaultValue?: Value; onChange?: (value: Value) => void }): State<Value> {
  const inner = useState(props.defaultValue);
  const value = (props.value ?? inner[0])!;
  const setValue = useSetStateDispatcher<Value>(
    () => value,
    (next) => {
      inner[1](next);
      props.onChange?.(next);
    },
  );

  return [value, setValue];
}
