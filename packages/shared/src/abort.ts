import { createErrorClass } from "./errors";

export class AbortError extends createErrorClass("AbortError", "this operation was aborted") {}
