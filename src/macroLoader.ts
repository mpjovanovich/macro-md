import fs from "fs";
import { marked } from "marked";

const MACRO_IDENTIFIER = "macro_identifier";
type MacroFunction = (...args: string[]) => string;
type MacroCall = { macro: MacroFunction; args: string[] };

/*
 * PUBLIC FUNCTIONS
 */

export async function loadMacros(
  macrosPath: string
): Promise<Map<string, MacroFunction>> {
  const userMacros = await import(macrosPath);
  const macros = new Map<string, MacroFunction>();

  if (!fs.existsSync(macrosPath)) {
    throw new Error(`Macro file does not exist: ${macrosPath}`);
  }

  for (const key in userMacros) {
    const macro = userMacros[key];
    if (typeof macro === "function" && MACRO_IDENTIFIER in macro) {
      macros.set(macro.macro_identifier, macro);
    }
  }

  return macros;
}

export async function processMarkdown(
  markdownPath: string,
  macros: Map<string, MacroFunction>,
  macroDelimiter: string
): Promise<string> {
  //   MACRO FORMATS:

  // Macros are in the form ``identifier(args){content}
  //   ``mac{...} = macro with no args
  //   ``mac(a,b){...} = macro with args
  //   ``mac(*a){...} = macro with indefinite array argument
  //   TODO: v1.1 - ``mac1 mac2(80){...} = multiple macros for the same content

  // Text between the macro delimiter and the opening curly brace is treated as
  // a space delineated list of macro calls on the following content to be
  // applied in left to right order.

  // Search for macros in the markdown file
  const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
  const macroRegex = new RegExp(
    `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
    "g"
  );

  let markdown = fs.readFileSync(markdownPath, "utf8");
  let placeholders = new Map<string, MacroCall>();
  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file does not exist: ${markdownPath}`);
  }

  const guid = `macro_md_${Date.now().toString()}`;
  markdown = preProcessTokens(markdown, macroRegex, macros, placeholders, guid);
  markdown = await marked.parse(markdown);
  markdown = processMacro(markdown, guid, placeholders);

  return markdown;
}

/*
 * PRIVATE FUNCTIONS
 */

function preProcessTokens(
  markdown: string,
  macroRegex: RegExp,
  macros: Map<string, MacroFunction>,
  placeholders: Map<string, MacroCall>,
  macroGuid: string,
  macroIndex: number = 0
): string {
  const match = macroRegex.exec(markdown);
  if (match) {
    // Make sure that the macro was defined by the user.
    const macro = match[1];
    const argsList = match[2];

    const macroFunction = macros.get(macro);
    if (!macroFunction) {
      throw new Error(`Macro not found: ${macro}`);
    }
    const macroContent = getMacroContent(markdown, macroRegex, match);

    let childArgs = argsList ? argsList.split(",") : [];
    childArgs = childArgs.map((arg) => arg.trim());

    const macroPlaceholder = `${macroGuid}_${macroIndex}`;
    placeholders.set(macroPlaceholder, {
      macro: macroFunction,
      args: childArgs,
    });
    macroIndex++;

    const innerMarkdown = preProcessTokens(
      macroContent,
      macroRegex,
      macros,
      placeholders,
      macroGuid,
      macroIndex
    );

    // Replace the macro with a placeholder
    markdown = markdown.replace(
      match[0] + macroContent + "}",
      macroPlaceholder + innerMarkdown + macroPlaceholder
    );
  }

  return markdown;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMacroContent(
  content: string,
  macroRegex: RegExp,
  match: RegExpExecArray
): string {
  // We may have nested macros in the form: ^echo{I ^echo{was} echoed.}
  // This function will return the content of the outermost macro, ignoring all
  // nested macros.
  // If there are no macros it will return the original content.
  let macroContentStart = match.index + match[0].length;
  let macroContentEnd = -1;

  // Technically this is the first character after the opening brace
  let openBraceIndex = macroContentStart;
  let closeBraceIndex = content.indexOf("}", macroContentStart);
  let openMacros = 1;
  let macroContent = "";

  // Find the closing curly brace that belongs to this macro.
  while (openMacros > 0 && closeBraceIndex !== -1) {
    // Get substring up to the closing brace
    macroContent = content.substring(openBraceIndex, closeBraceIndex);

    // RegEx in JS have state, so we need to reset the index.
    // It will otherwise start looking from the last match.
    macroRegex.lastIndex = 0;

    // See if there is another macro in the substring that we extracted.
    let nextMacroMatch = macroRegex.exec(macroContent);
    if (nextMacroMatch && nextMacroMatch.index < closeBraceIndex) {
      // If we're in here then a macro tag was found before the closing brace,
      // so that curly brace is not the one we're looking for.
      openMacros++;
      openBraceIndex =
        macroContentStart + nextMacroMatch.index + nextMacroMatch[0].length;
    } else {
      // If we're in here then we found the closing brace that belongs to the
      // current macro.
      openMacros--;

      // Assume that this is the closing brace that we're looking for.
      macroContentEnd = closeBraceIndex;

      // Find the next closing brace
      closeBraceIndex = content.indexOf("}", closeBraceIndex + 1);
    }

    // Sanity check. Too many macros or something is broken.
    if (openMacros > 10) {
      throw new Error("Too many nested macros.");
    }
  }

  if (macroContentEnd === -1) {
    macroContent = content.substring(macroContentStart);
  } else {
    macroContent = content.substring(macroContentStart, macroContentEnd);
  }

  return macroContent;
}

function processMacro(
  markdown: string,
  macroGuid: string,
  placeholders: Map<string, MacroCall>,
  placeholder?: string
): string {
  let processedMarkdown = markdown;

  // Check for child placeholders
  const placeholderRegex = new RegExp(`${macroGuid}_\\d+`, "g");
  const match = placeholderRegex.exec(markdown);

  if (match) {
    const childPlaceholder = match[0];
    const childStart = markdown.indexOf(childPlaceholder);
    const childEnd = markdown.indexOf(childPlaceholder, childStart + 1);
    const childContent = markdown.substring(
      childStart + childPlaceholder.length,
      childEnd
    );

    // Recursively process the next placeholder
    processedMarkdown = processMacro(
      childContent,
      macroGuid,
      placeholders,
      childPlaceholder
    );

    markdown = markdown.replace(
      childPlaceholder + childContent + childPlaceholder,
      processedMarkdown
    );
  }

  if (placeholder) {
    const macroFunction = placeholders.get(placeholder);
    if (macroFunction) {
      // It is assumed that the first argument is the content of the macro for
      // all user defined macros.
      macroFunction.args.unshift(markdown);
      markdown = macroFunction.macro.apply(null, macroFunction.args);
    }
  }

  return markdown;
}
