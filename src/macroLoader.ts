import fs from "fs";

const MACRO_IDENTIFIER = "macro_identifier";
type Macro = (...args: any[]) => any;
const functionMap = new Map<string, Macro>();

export async function loadMacros(macrosPath: string): Promise<void> {
  /*
   * LOAD MACRO FILE
   */
  // Check if the file exists
  if (!fs.existsSync(macrosPath)) {
    throw new Error(`File does not exist: ${macrosPath}`);
  }
  const userMacros = await import(macrosPath);

  for (const key in userMacros) {
    const macro = userMacros[key];
    if (typeof macro === "function" && MACRO_IDENTIFIER in macro) {
      functionMap.set(macro.macro_identifier, macro);
    }
  }

  const test = functionMap.get("test");
  if (test) {
    console.log(test());
  }
}
