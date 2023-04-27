import { useState } from "react";

import type { SetStateDispatcher } from "./use-set-state-dispatcher";
import { useSetStateDispatcher } from "./use-set-state-dispatcher";
import { useStableCallback } from "./use-stable-callback";
import { assert } from "./utils/assert";

// eslint-disable-next-line @typescript-eslint/ban-types -- empty object used to ban any null or undefined types from being used
export type InputProps<T extends {}> =
  | {
      value: T;
      defaultValue?: T;
      onValueChange: (value: T) => void;
    }
  | {
      value?: T;
      defaultValue: T;
      onValueChange?: (value: T) => void;
    };

// eslint-disable-next-line @typescript-eslint/ban-types -- empty object used to ban any null or undefined types from being used
export function useInputState<T extends {}>(
  props: InputProps<T>
): [T, SetStateDispatcher<T>] {
  const { value: propValue, defaultValue, onValueChange } = props;
  const state = useState<T | undefined>(defaultValue);

  const value = propValue ?? state[0];
  assert(
    value !== undefined && value !== null,
    "DeveloperError: value or defaultValue must be provided.\n" +
      "If your value can be undefined or null, than use boxed " +
      "value instead `useInputState({ value: { boxed: value as T | undefined } })`"
  );
  const setValue = useSetStateDispatcher(
    () => value,
    (next) => {
      if (propValue === undefined) {
        state[1](next);
      }
      onValueChange?.(next);
    }
  );

  return [value, setValue];
}
