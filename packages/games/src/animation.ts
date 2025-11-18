export type AnimationConfig = number | [duration: number, frames: number[]];
export type AnimationsConfig<Names extends string> = { [Name in Names]: AnimationConfig };
