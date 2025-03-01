import { render as domRender } from "@testing-library/react";
export { act, screen } from "@testing-library/react";

import { createRender, createRenderHook, GlobalWrappers } from "./base";

export const globalWrappers = new GlobalWrappers();
export const render = createRender(domRender, {}, globalWrappers, undefined);
export const renderHook = createRenderHook(domRender, {}, globalWrappers, undefined);
