import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/proposal-iterator-helpers/global";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { TestGame } from "./test-game";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <TestGame />
  </StrictMode>,
);
