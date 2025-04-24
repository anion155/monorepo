export type SetStateDispatcher<T> = (state: T | { (current: T): T }) => void;

export type State<T> = [state: T, SetStateDispatcher<T>];
