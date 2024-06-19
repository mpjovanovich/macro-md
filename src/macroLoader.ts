import fs from "fs";

const TOP_IDENTIFIER = "TOP";
const MACRO_IDENTIFIER = "macro_identifier";
type MacroFunction = (...args: string[]) => string;

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

export function processMarkdown(
  markdownPath: string,
  macros: Map<string, MacroFunction>,
  macroDelimiter: string
): void {
  //   MACRO FORMATS:

  // Macros are in the form ``identifier(args){content}
  //   ``mac{...} = macro with no args
  //   ``mac(a,b){...} = macro with args
  //   ``mac(*a){...} = macro with indefinite array argument
  //   TODO: v1.1 - ``mac1 mac2(80){...} = multiple macros for the same content

  // Text between the macro delimiter and the opening curly brace is treated as
  // a space delineated list of macro calls on the following content to be
  // applied in left to right order.

  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file does not exist: ${markdownPath}`);
  }

  // Search for macros in the markdown file
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
  const macroRegex = new RegExp(
    `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
    "g"
  );

  const result = processMacro(macros, macroRegex, TOP_IDENTIFIER, [markdown]);
  console.log(result);
}

/*
 * PRIVATE FUNCTIONS
 */

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

// Recursively process the macro content
function processMacro(
  macros: Map<string, MacroFunction>,
  macroRegex: RegExp,
  macro: string,
  args: string[]
): string {
  let content = args[0];

  // See if there is a macro in the content
  // If so, we need to replace the macro with the result of the macro.
  const match = macroRegex.exec(content);
  if (match) {
    // Make sure that the macro was defined by the user.
    const childMacro = match[1];
    const argsList = match[2];

    if (!macros.has(childMacro)) {
      throw new Error(`Macro not found: ${childMacro}`);
    }
    const macroContent = getMacroContent(content, macroRegex, match);

    let childArgs = argsList ? argsList.split(",") : [];
    childArgs = childArgs.map((arg) => arg.trim());

    // The first argument will always be the macro content, so add it to the
    // front of the args array.
    childArgs.unshift(macroContent);

    // TODO: a start/end index approach would be more efficient
    const processedContent = processMacro(
      macros,
      macroRegex,
      childMacro,
      childArgs
    );

    content = content.replace(match[0] + macroContent + "}", processedContent);
  }

  if (macro !== TOP_IDENTIFIER) {
    const macroFunction = macros.get(macro);
    if (macroFunction) {
      // content may have been updated by a nested macro, so update args
      args[0] = content;
      content = macroFunction.apply(null, args);
    }
  }

  return content;
}
