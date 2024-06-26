import {
  MacroCall,
  cleanLineEndings,
  embedTokens,
  escapeRegExp,
  loadMacros,
  loadMarkdown,
  processMacro,
  removeBlockTokenWrappers,
  parse,
} from "./macroLoader.js";
import { marked } from "marked";
import fs from "fs";

// This is a sandbox file for debugging. It is not part of the main project.

/*
 * Stub in markdown to test here
 */
const macroPath = "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js";
const markdownPath = "/home/mpjovanovich/git/macro-md/test/markdown/test.md";
const outputPath = "/mnt/c/Users/mpjov/Desktop/markdownTest.html";

// let markdown = "^testNoArguments{content}";
// let markdown = "^testNoArguments{content} end";
// let markdown = "start ^testNoArguments{content} end";
// let markdown = `^testNoArguments{first}
// ^testNoArguments{second}`;
let markdown = await loadMarkdown(markdownPath);

const macroDelimiter = "^";
const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
const macroRegex = new RegExp(
  `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
  "g"
);
const guid = `macro_md_${Date.now().toString()}`;
let placeholders = new Map<string, MacroCall>();

const macros = await loadMacros(macroPath, (path) => import(path));

markdown = cleanLineEndings(markdown, escapedMacroDelimiter);
markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid);
markdown = await marked.parse(markdown);
markdown = removeBlockTokenWrappers(markdown, guid);
markdown = processMacro(markdown, guid, placeholders);
console.log(markdown);
// fs.writeFileSync(outputPath, result);
