import fs from "fs";
import path from "path";

// const _MACRO_IDENTIFIER = "macro_identifier";

// // export interface MacroFunction {
// //   (args: string[], text: string): string;
// // }

// interface ModuleExports {
//   [key: string]: {
//     name: string;
//     [key: string]: any;
//   };
// }

// export function loadMacros(macrosPath: string): void {
//   // export function loadMacros(macrosPath: string): Map<string, MacroFunction> {
//   // Check if the file exists
//   if (!fs.existsSync(macrosPath)) {
//     throw new Error(`File does not exist: ${macrosPath}`);
//   }

//   const userMacros: ModuleExports = require(macrosPath);
//   //   const macros = new Map<string, MacroFunction>();

//   console.log(userMacros);

//   // User must have a "macro_identifier" property on any function that they want to use as a macro
//   //   Object.keys(userMacros).forEach(([key, value]) => {
//   //     if (value.hasOwnProperty(_MACRO_IDENTIFIER)) {
//   //       // macros.set(value[_MACRO_IDENTIFIER], userMacros[key]);
//   //     }
//   //   });

//   //   return macros;
// }

let x = 1;
