import fs from "fs";

const MACRO_DELIMITER = "``";
const MACRO_IDENTIFIER = "macro_identifier";
type Macro = (...args: string[]) => string;
const functionMap = new Map<string, Macro>();

export async function loadMacros(
  markdownPath: string,
  macrosPath: string
): Promise<void> {
  /*
   * LOAD MACRO FILE
   */
  // Check if the file exists
  if (!fs.existsSync(macrosPath)) {
    throw new Error(`Macro file does not exist: ${macrosPath}`);
  }
  const userMacros = await import(macrosPath);

  for (const key in userMacros) {
    const macro = userMacros[key];
    if (typeof macro === "function" && MACRO_IDENTIFIER in macro) {
      functionMap.set(macro.macro_identifier, macro);
    }
  }

  /*
   * LOAD MARKDOWN FILE
   */
  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file does not exist: ${markdownPath}`);
  }

  //  TODO: Extract to function and make recursive.

  //   Macro Formats:

  //   - ``mac{ = macro with no args
  //   - ``mac(a,b){ = macro with args
  //   - ``mac(*a){ = macro with indefinite array argument
  //   - ``mac1 mac2(80){ = Text between the macro delimiter and the opening curly brace is treated as a space delineated list of macro calls on the following content to be applied in left to right order.

  // Macros are in the form ``identifier(args){content}
  // Search for macros in the markdown file
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const macroRegex = new RegExp(`${MACRO_DELIMITER}(.*?)\\{(.*?)\\}`, "g");
  let match;
  while ((match = macroRegex.exec(markdown)) !== null) {
    const identifier = match[1];
    const content = match[2];
    console.log(`${identifier}: ${content}`);
  }

  /*
   * DEBUG AND TESTING
   */

  // debug
  //   for (const [key, macro] of functionMap.entries()) {
  //     const result = macro();
  //     console.log(`${key}: ${result}`);
  //   }
  //   const test2 = functionMap.get("test2");
  //   if (test2) {
  //     console.log(test2("DYNAMIC CONTENT"));
  //   }
}
