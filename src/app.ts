import { loadMacros, processMarkdown } from "./macroLoader.js";

const macros = await loadMacros(
  "/home/mpjovanovich/git/macro-md/sandbox/testMacro.js"
);

// Will be in its own file later, but for now process here
processMarkdown(
  "/home/mpjovanovich/git/macro-md/sandbox/test2.md",
  macros,
  "^"
);
