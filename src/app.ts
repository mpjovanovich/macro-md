import { parse } from "./macroLoader.js";

// Will be in its own file later, but for now process here
const result = await parse(
  "/home/mpjovanovich/git/macro-md/sandbox/test2.md",
  "/home/mpjovanovich/git/macro-md/sandbox/testMacro.js",
  "^"
);
console.log(result);
