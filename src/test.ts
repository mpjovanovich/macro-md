import {
  MacroCall,
  embedTokens,
  escapeRegExp,
  loadMacros,
  processMacro,
  removeBlockTokenWrappers,
  separateBlockTokens,
  parse,
} from "./macroLoader.js";
import { marked } from "marked";

// This is a sandbox file for debugging. It is not part of the main project.

/*
 * Stub in markdown to test here
 */
let markdown = "^testNoArguments{content}";

const macroDelimiter = "^";
const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
const macroRegex = new RegExp(
  `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
  "g"
);
const guid = `macro_md_${Date.now().toString()}`;
let placeholders = new Map<string, MacroCall>();

const macroPath = "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js";
const macros = await loadMacros(macroPath, (path) => import(path));
markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid);
markdown = separateBlockTokens(markdown, guid);
markdown = await marked.parse(markdown);
markdown = removeBlockTokenWrappers(markdown, guid);
markdown = processMacro(markdown, guid, placeholders);

// const result = await parse(
//   "/home/mpjovanovich/git/macro-md/test/markdown/test.md",
//   "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js",
//   "^"
// );
// console.log(result);
