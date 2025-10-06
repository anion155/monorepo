import { style } from "@vanilla-extract/css";

export const screen = style({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

export const container = style({
  width: "100%",
  aspectRatio: `${800 / 600}`,
  "@media": {
    "(min-aspect-ratio: 800/600)": {
      width: "unset",
      height: "100%",
    },
  },
});

export const canvas = style({
  width: "100%",
  height: "100%",
  imageRendering: "crisp-edges",
});
