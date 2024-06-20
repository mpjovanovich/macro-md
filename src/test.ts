import { parse } from "./macroLoader.js";

// This is a sandbox file to test the macroLoader. It is not part of the main project.
const result = await parse(
  "/home/mpjovanovich/git/macro-md/test/markdown/test.md",
  "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js",
  "^"
);
console.log(result);
