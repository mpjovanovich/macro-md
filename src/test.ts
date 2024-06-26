import {
  MacroCall,
  embedTokens,
  escapeRegExp,
  loadMacros,
  parse,
} from "./macroLoader.js";

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
let markdown = "start ^testNoArguments{first} ^testNoArguments{second} end";
markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid);

// This is a sandbox file for debugging. It is not part of the main project.
// const result = await parse(
//   "/home/mpjovanovich/git/macro-md/test/markdown/test.md",
//   "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js",
//   "^"
// );
// console.log(result);
