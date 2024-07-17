import {
  MacroCall,
  cleanLineEndings,
  embedTokens,
  escapeRegExp,
  loadMacros,
  loadMarkdown,
  processMacro,
  removeTokenWrappers,
  parseFile,
  parseString,
} from "../dist/macroLoader.js";
import fs from "fs";
import hljs from "highlightjs";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
// import { marked } from "marked";

// This is a sandbox file for debugging. It is not part of the main project.

/*
 * Stub in markdown to test here
 */
const macroPath = "/home/mpjovanovich/git/macro-md/test/macro/testMacro.js";
const markdownPath = "/home/mpjovanovich/git/macro-md/test/markdown/test.md";
const outputPath = "/mnt/c/Users/mpjov/Desktop/markdown_test/index.html";

let markdown = await integrationTest();
// let markdown = await testHarness();

// console.log(markdown);
writeHTMLFile();

async function integrationTest(): Promise<string> {
  // Integration test
  let markdown = await parseFile(markdownPath, macroPath, {
    useGitHubStyleIds: true,
    useHighlightJS: true,
  });
  return markdown;
}

async function testHarness(): Promise<string> {
  const useGitHubStyleIds = true;
  const useHighlightJS = true;
  //   Pain goes here...
  // let markdown = "start ^wrap (arg1 ) {content} end";
  //   let markdown = "start ^ wrap(aaa) upper {content} end";
  //   let markdown = "^upper wrap(aaa){content}";
  let markdown = await loadMarkdown(markdownPath);

  const macroDelimiter = "^";
  const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
  const macroRegex = new RegExp(`${escapedMacroDelimiter}(.*?)\\{`, "g");

  const guid = `macro_md_${Date.now().toString()}`;
  let placeholders = new Map<string, MacroCall>();

  const macros = await loadMacros(macroPath, (path) => import(path));

  markdown = cleanLineEndings(markdown, escapedMacroDelimiter);
  markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid, {
    index: 0,
  });

  let marked = new Marked();
  if (useHighlightJS) {
    const highlightExtension = markedHighlight({
      async: false,
      langPrefix: "hljs language-",
      highlight(code, lang, info) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(language, code).value;
      },
    });
    marked = new Marked(highlightExtension);
  }

  if (useGitHubStyleIds) {
    const renderer = new marked.Renderer();
    renderer.heading = function ({ text, depth }) {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, "-");
      return `<h${depth} id="${escapedText}">${text}</h${depth}>\n`;
    };
    marked.setOptions({ renderer: renderer });
  }

  markdown = await marked.parse(markdown);
  markdown = removeTokenWrappers(markdown, guid);
  markdown = processMacro(markdown, guid, placeholders);
  markdown = markdown.replace(/<p>\s*<\/p>/gi, "");
  return markdown;
}

function writeHTMLFile() {
  markdown = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Markdown Test</title>
        <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="assets/images/favicon-32x32.png"
        />
        <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="assets/images/favicon-16x16.png"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;1,400;1,700&display=swap"
            rel="stylesheet"
        />
        <link
            href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;1,400;1,700&display=swap"
            rel="stylesheet"
        />
        <link rel="stylesheet" href="assets/css/styles.css">
        <link rel="stylesheet" href="assets/css/highlight.css">
    </head>
    <body>
        ${markdown}
    </body>
`;
  fs.writeFileSync(outputPath, markdown);
}
