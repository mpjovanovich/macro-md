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

  // Load the user defined macros and markdown.
  const macros = await loadMacros(macroPath, (path) => import(path));

  // Process markdown. Each step transforms the markdown.
  let markdown = await loadMarkdown(markdownPath);
  markdown = cleanLineEndings(markdown, escapedMacroDelimiter);
  markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid, {
    index: 0,
  });
  markdown = await marked.parse(markdown);
  markdown = removeTokenWrappers(markdown, guid);
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
 * Removes starting and trailing spaces from lines, making processing much
 * easier later in the pipeline.
 */
export function cleanLineEndings(
  markdown: string,
  escapedMacroDelimiter: string
): string {
  return (
    markdown
      .replace(
        new RegExp(
          `\\n[ \\t]*(${escapedMacroDelimiter}\\s*\\S+?\\s*(?:\\(.*?\\))?\\s*\\{)`,
          "g"
        ),
        "\n$1"
      )
      // Remove spaces or tabs between a closing curly brace and a newline
      .replace(/\}(?:[ \t]*)\n/g, "}\n")
      // Finally, remove any space or tab characters at the start/end of the markdown
      .trim()
  );
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
  macroIndex: { index: number }, // Hack to let us pass by reference
  inline?: boolean
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

    let childArgs = argsList ? argsList.split(",") : [];
    childArgs = childArgs.map((arg) => arg.trim());

    const macroPlaceholder = `${macroGuid}_${macroIndex.index}`;
    placeholders.set(macroPlaceholder, {
      macro: macroFunction,
      args: childArgs,
    });
    macroIndex.index++;

    const { start, end } = getMacroContent(markdown, macroRegex, match);

    // Check if inline. If it is don't try to put any block level macros as children.
    if (!inline) {
      if (match.index !== 0 && markdown[match.index - 1] !== "\n") {
        inline = true;
      }
      // If the end is not the very last character and the next character is not a
      // newline, then this is an inline macro.
      if (end !== markdown.length - 1 && markdown[end + 1] !== "\n") {
        inline = true;
      }
    }

    const macroContent = markdown.substring(start, end);
    const innerMarkdown = embedTokens(
      macroContent,
      macroRegex,
      macros,
      placeholders,
      macroGuid,
      macroIndex,
      inline
    );

    // Replace the macro with a placeholder.
    if (!inline) {
      // Block macros need to have the identifier on its own line. This will turn
      // them into <p> tags which we will later remove. The end result is that the
      // macro tags will wrap the html rather than be inline.
      markdown = markdown.replace(
        match[0] + macroContent + "}",
        `${macroPlaceholder}\n\n${innerMarkdown}\n\n${macroPlaceholder}\n`
      );
    } else {
      // We pad each side with a space so that it works in the case that there is
      // markdown syntax touching the curly braces. The markdown parser would not
      // recognize the inner content as markdown otherwise. E.g.:
      // ^macro{**bold**} would not render the bold.  These are trimmed away in
      // the processMacro function.
      markdown = markdown.replace(
        match[0] + macroContent + "}",
        `${macroPlaceholder} ${innerMarkdown} ${macroPlaceholder}`
      );
    }

    macroRegex.lastIndex = 0;
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
): {
  start: number;
  end: number;
} {
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

  return { start: macroContentStart, end: macroContentEnd };
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
  let match = placeholderRegex.exec(markdown);

  while (match) {
    const childPlaceholder = match[0];
    const childStart = markdown.indexOf(childPlaceholder);
    const childEnd = markdown.indexOf(childPlaceholder, childStart + 1);
    const childContent = markdown.substring(
      childStart + childPlaceholder.length,
      childEnd
    );
    const trimmedChildContent = childContent.trim();

    // Recursively process the next placeholder
    processedMarkdown = processMacro(
      //   childContent,
      trimmedChildContent,
      macroGuid,
      placeholders,
      childPlaceholder
    );

    markdown = markdown.replace(
      childPlaceholder + childContent + childPlaceholder,
      processedMarkdown
    );

    placeholderRegex.lastIndex = 0;
    match = placeholderRegex.exec(markdown);
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
export function removeTokenWrappers(
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
