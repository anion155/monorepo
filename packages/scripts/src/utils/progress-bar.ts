import "@anion155/shared/global/math";

import { doRun } from "@anion155/shared/do";
import { hasField, is } from "@anion155/shared/is";
import { Loop } from "@anion155/shared/loop";
import { escapes } from "@anion155/shared/misc";
import { anionmationLoader } from "./anionmation-loader";
import { directPrint } from "./direct-print";

export type ProgressBarEdgeRender = (progress: number) => string | { toString(): string; readonly length: number };
export type ProgressBarBarsRender = (completeBars: number, emptyBars: number, barsNumber: number) => string;
export type ProgressBarConfig = {
  head?: string | ProgressBarEdgeRender;
  bars?: string | { complete: string; empty?: string } | ProgressBarBarsRender;
  tail?: string | ProgressBarEdgeRender;
  inclusive?: boolean;
  width?: number | `${number}%`;
  fps?: number;
  frameStep?: number;
};

export class ProgressBar<Steps extends number> {
  #progress: number = 0;
  #pending: number | undefined;
  #head: ProgressBarEdgeRender;
  #bars: ProgressBarBarsRender;
  #tail: ProgressBarEdgeRender;
  #inclusive: boolean;
  #width: ProgressBarConfig["width"];
  #fps: number;
  #frameStep: number;
  #loop: Loop<void>;
  constructor(config?: ProgressBarConfig) {
    if (is(config?.head, "string")) {
      const head = config.head;
      this.#head = () => head;
    } else if (config?.head) {
      this.#head = config?.head;
    } else {
      const loader = anionmationLoader();
      this.#head = () => `${loader.next().value}[`;
    }

    let bars = config?.bars;
    if (!bars) {
      bars = { complete: "#", empty: " " };
    }
    if (is(bars, "string")) {
      bars = { complete: bars, empty: " " };
    }
    if (hasField(bars, "complete")) {
      const { complete, empty = " " } = bars;
      this.#bars = (completeBars, emptyBars) => `${complete.repeat(completeBars)}${empty.repeat(emptyBars)}`;
    } else {
      this.#bars = bars;
    }

    if (is(config?.tail, "string")) {
      const tail = config.tail;
      this.#tail = () => tail;
    } else if (config?.tail) {
      this.#tail = config?.tail;
    } else {
      this.#tail = (progress) => {
        const percentage = Math.trunc(progress * 100);
        return `] ${percentage.toString().padStart(3, " ")}%`;
      };
    }

    this.#inclusive = config?.inclusive ?? true;
    this.#width = config?.width;
    process.stdout.on("resize", this.#init);
    this.#init();
    this.#fps = config?.fps ?? 5;
    this.#frameStep = config?.frameStep ?? 1 / this.#fps;
    this.#loop = new Loop(1000 / this.#fps, this.#print);
  }

  #init = () => {
    let buffer = "\n";
    buffer += escapes.cursor.save;
    buffer += escapes.regions.set(0, process.stdout.rows - 1);
    buffer += escapes.cursor.restore;
    buffer += escapes.cursor.moveUp(1);
    directPrint(buffer);
  };
  #deinit = () => {
    let buffer = "\n";
    buffer += escapes.cursor.save;
    buffer += escapes.regions.set(0, process.stdout.rows);
    buffer += escapes.cursor.moveTo(process.stdout.rows, 0);
    buffer += escapes.erase.clearFromCursorToLineEnd;
    buffer += escapes.cursor.restore;
    buffer += escapes.cursor.scrollUp;
    directPrint(buffer);
  };
  #animate = () => {
    if (!this.#pending) return;
    const diff = this.#pending - this.#progress;
    this.#progress = Math.min(this.#progress + this.#frameStep * diff, this.#pending);
    if (this.#progress === this.#pending) {
      this.#pending = undefined;
      return;
    }
  };
  #print = () => {
    const { rows, columns } = process.stdout;
    this.#animate();
    const progress = this.#progress;
    const head = this.#head(progress);
    const tail = this.#tail(progress);
    const width = doRun(() => {
      if (this.#width === undefined) return columns;
      if (is(this.#width, "number")) return Math.min(this.#width, columns);
      return Math.trunc((columns * Math.clamp(0, parseFloat(this.#width), 100)) / 100);
    });
    const barsNumber = this.#inclusive ? width - head.length - tail.length : Math.min(columns, width + head.length + tail.length);
    const completeBars = Math.trunc(progress * barsNumber);
    const bars = this.#bars(completeBars, barsNumber - completeBars, barsNumber);

    let buffer = "";
    buffer += escapes.cursor.save;
    buffer += escapes.cursor.moveTo(rows, 0);
    buffer += escapes.erase.clearFromCursorToLineEnd;
    buffer += `${head}${bars}${tail}`;
    buffer += escapes.cursor.restore;
    directPrint(buffer);
  };

  step(next: number, animate = true) {
    if (animate && next > this.#progress) {
      if (this.#pending !== undefined) this.#progress = this.#pending;
      this.#pending = next;
    } else this.#progress = next;
    this.#print();
  }
  finish() {
    this.#progress = 1;
    this.#print();
    this.dispose();
  }
  dispose() {
    process.stdout.off("resize", this.#init);
    this.#loop.stop();
    this.#deinit();
  }
  [Symbol.dispose]() {
    this.dispose();
  }
}
