import { MACRO_IDENTIFIER } from "../../dist/macroLoader.js";

/*
 * Unit test functions
 */
export function testNoMacroIdentifierSet(content) {
  return `testNoMacroIdentifierSet`;
}

export function testNoArgumentsNoContent(content) {
  return `TNANC`;
}
testNoArgumentsNoContent[MACRO_IDENTIFIER] = "testNoArgumentsNoContent";

export function testNoArguments(content) {
  return `TNA_start_${content}_TNA_end`;
}
testNoArguments[MACRO_IDENTIFIER] = "testNoArguments";

export function testWithArgument(content, arg1) {
  return `TWA_start_${content} ${arg1}_TWA_end`;
}
testWithArgument[MACRO_IDENTIFIER] = "testWithArgument";

/*
 * More test functions
 */

// Just a way to move html to post processing of markdown.
export function raw(content, rawContent) {
  //   return rawContent;
  //   return content;
  return "";
}
raw[MACRO_IDENTIFIER] = "raw";

export function upper(content) {
  return content.toUpperCase();
}
upper[MACRO_IDENTIFIER] = "upper";

export function lower(content) {
  return content.toLowerCase();
}
lower[MACRO_IDENTIFIER] = "lower";

export function wrap(content, wrapper) {
  return `${wrapper}${content}${wrapper}`;
}
wrap[MACRO_IDENTIFIER] = "wrap";

export function wrapHTML(content, wrapper) {
  return `${wrapper}${content}${wrapper.replace("<", "</")}`;
}
wrapHTML[MACRO_IDENTIFIER] = "wrapHTML";
