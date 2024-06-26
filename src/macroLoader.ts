import fs from "fs/promises";
import { marked } from "marked";

export const MACRO_IDENTIFIER = "macroIdentifier";
export type MacroFunction = (...args: string[]) => string;
export type MacroCall = { macro: MacroFunction; args: string[] };

/* ************************************************************************
 * PUBLIC FUNCTIONS
 * ***********************************************************************/

/**
 * This function is the public entry point to process a markdown file.
 */
export async function parse(
  markdownPath: string,
  macroPath: string,
  macroDelimiter: string
): Promise<string> {
  const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
  const macroRegex = new RegExp(
    `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
    "g"
  );
  const guid = `macro_md_${Date.now().toString()}`;
  let placeholders = new Map<string, MacroCall>();

  //   MACRO FORMATS:

  // Macros are in the form ``identifier(args){content}
  //   ``mac{...} = macro with no args
  //   ``mac(a,b){...} = macro with args
  //   ``mac(*a){...} = macro with indefinite array argument
  //   TODO: v1.1 - ``mac1 mac2(80){...} = multiple macros for the same content

  // Text between the macro delimiter and the opening curly brace is treated as
  // a space delineated list of macro calls on the following content to be
  // applied in left to right order.

  // Load the user defined macros and markdown.
  const macros = await loadMacros(macroPath, (path) => import(path));
  let markdown = await loadMarkdown(markdownPath);

  // Process the markdown and macros.
  markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid);
  markdown = separateBlockTokens(markdown, guid);
  markdown = await marked.parse(markdown);
  markdown = removeBlockTokenWrappers(markdown, guid);
  markdown = processMacro(markdown, guid, placeholders);

  return markdown;
}

/* ************************************************************************
 * PRIVATE FUNCTIONS - exposed for testing
 * ***********************************************************************/

/**
 * Checks if a file exists at the provided path.
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  const exists = await fs
    .stat(filePath)
    .then(() => true)
    .catch(() => false);
  return exists;
}

/**
 * This function replaces the user defined macro identifiers, arguments, and
 * curly braces with placeholders tokens based on the provided macroGuid. The
 * placeholders are stored in the placeholders map, along with the macro
 * function and arguments that they reference.
 */
export function embedTokens(
  markdown: string,
  macroRegex: RegExp,
  macros: Map<string, MacroFunction>,
  placeholders: Map<string, MacroCall>,
  macroGuid: string,
  macroIndex: number = 0
): string {
  let match = macroRegex.exec(markdown);
  while (match) {
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

    const innerMarkdown = embedTokens(
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

    match = macroRegex.exec(markdown);
  }

  return markdown;
}

/**
 * This function escapes any characters that have special meaning in a regular
 * expression.  It's needed because the user provides the macro delimiter, which
 * ends up in the regex.
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * This function extracts the content of a macro from the markdown - the part
 * that's inside of the curly braces. It will match the correct ending curly
 * brace in the case of nested macros.
 */
export function getMacroContent(
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

/**
 * This function loads the user defined macros from the provided file path.
 */
export async function loadMacros(
  macroPath: string,
  // Dependency injection so that testing is not a nightmare.
  importFunction: (path: string) => Promise<any>
): Promise<Map<string, MacroFunction>> {
  if (!(await checkFileExists(macroPath))) {
    throw new Error(`Macro file does not exist: ${macroPath}`);
  }

  const userMacros = await importFunction(macroPath);
  const macros = new Map<string, MacroFunction>();

  for (const key in userMacros) {
    const macro = userMacros[key];
    if (typeof macro === "function" && MACRO_IDENTIFIER in macro) {
      macros.set(macro.macroIdentifier, macro);
    }
  }

  return macros;
}

/**
 * This function returns the raw markdown from the provided file path.
 */
export async function loadMarkdown(markdownPath: string): Promise<string> {
  if (!(await checkFileExists(markdownPath))) {
    throw new Error(`Macro file does not exist: ${markdownPath}`);
  }
  return fs.readFile(markdownPath, "utf8");
}

/**
 * This function takes the pre-processed markdown and runs any embedded user
 * defined macros.
 */
export function processMacro(
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

/**
 * This function strips the <p> and </p> tags from the block level tokens.
 */
export function removeBlockTokenWrappers(
  markdown: string,
  macroGuid: string
): string {
  const blockTokenRegex = new RegExp(`<p>${macroGuid}_\\d+<\/p>`, "g");
  const blockTokens = markdown.match(blockTokenRegex);

  if (blockTokens) {
    blockTokens.forEach((token) => {
      // Remove the <p> and </p> tags
      const tokenContent = token.substring(3, token.length - 4);
      markdown = markdown.replace(token, tokenContent);
    });
  }

  return markdown;
}

/**
 * This function isolates the block level tokens from the inline content by
 * placing them on their own lines. They'll end up as <p> tags in the final
 * HTML, which will be stripped out later.
 */
export function separateBlockTokens(
  markdown: string,
  macroGuid: string
): string {
  const placeholderRegex = new RegExp(`${macroGuid}_\\d+`, "g");

  // Remove all carriage returns and split the markdown into lines.
  let lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());

  // Prepend any macros that are at the beginning of a line to the previous line.
  for (let i = 0; i < lines.length; i++) {
    let matchFound: boolean | undefined;
    while (matchFound !== false) {
      // Reset the RegEx index and look for the next placeholder
      placeholderRegex.lastIndex = 0;
      matchFound = false;
      const match = placeholderRegex.exec(lines[i]);

      // If a match was found, and it's the first thing on the line, and the line is not the match itself...
      if (match && match.index === 0 && lines[i] !== match[0]) {
        matchFound = true;

        // Prepend match to the previous line
        if (i === 0) {
          // Can't remember why I did this... needed?
          //   lines.unshift("");
          lines.unshift(match[0]);
        } else {
          //   lines.splice(i, 0, "");
          lines.splice(i, 0, match[0]);
        }

        // i += 2;
        i++;
        lines[i] = lines[i].replace(match[0], "");
      }
    }
  }

  // Append any macros that are at the end of a line to the next line.
  for (let i = 0; i < lines.length; i++) {
    let matchFound: boolean | undefined;
    while (matchFound !== false) {
      // Reset the RegEx index and look for the next placeholder
      placeholderRegex.lastIndex = 0;
      matchFound = false;

      // Get the last occurance of the placeholder in the line.
      let lastIndex = lines[i].lastIndexOf(macroGuid);
      if (lastIndex > 0) {
        const match = placeholderRegex.exec(lines[i].substring(lastIndex));

        // If a match was found and it's the last thing on the line...
        if (match && lines[i].substring(lastIndex + match[0].length) === "") {
          matchFound = true;

          // Append match to the next line
          if (i === lines.length - 1) {
            // Can't remember why I did this... needed?
            // lines.push("");
            lines.push(match[0]);
          } else {
            lines.splice(i + 1, 0, match[0]);
            // lines.splice(i + 1, 0, "");
          }

          lines[i] = lines[i].substring(0, lastIndex);
        }
      }
    }
  }

  return lines.join("\n");
}
