import {
  MacroCall,
  cleanLineEndings,
  embedTokens,
  escapeRegExp,
  loadMacros,
  loadMarkdown,
  processMacro,
  removeTokenWrappers,
  parse,
} from "./macroLoader.js";
import { marked } from "marked";
import pretty from "pretty";
import fs from "fs";

// This is a sandbox file for debugging. It is not part of the main project.

/*
 * Stub in markdown to test here
 */
const macroPath = "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js";
const markdownPath = "/home/mpjovanovich/git/macro-md/test/markdown/test.md";
const outputPath = "/mnt/c/Users/mpjov/Desktop/markdownTest.html";

// Pain goes here...
// let markdown = "^testNoArguments{\ncontent\n}";
// let markdown = "^testNoArguments{content} end";
// let markdown = "start ^testNoArguments{content} end";
// let markdown = `^testNoArguments{first}
// ^testNoArguments{second}`;
// let markdown = "Even more ^wrap(%){^wrap($){stuff}}";
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
markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid, {
  index: 0,
});
markdown = await marked.parse(markdown);
markdown = removeTokenWrappers(markdown, guid);
markdown = processMacro(markdown, guid, placeholders);
markdown = markdown.replace(/<p>\s*<\/p>/gi, "");

// Options for pretty
const options = {
  ocd: true,
  wrap_line_length: 80,
};
markdown = pretty(markdown, options);
console.log(markdown);
// fs.writeFileSync(outputPath, markdown);
