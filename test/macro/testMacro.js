import { MACRO_IDENTIFIER } from "../../dist/macroLoader.js";
import { html, parseFragment, serialize } from "parse5";

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

export function addAttribute(content, attributeName, attributeValue) {
  const fragment = parseFragment(content);
  if (fragment.childNodes.length === 0) {
    throw new Error("The HTML fragment has no child nodes.");
  }

  const firstChild = fragment.childNodes[0];
  if (!firstChild.attrs) {
    firstChild.attrs = [];
  }
  // Check if the attribute already exists
  const existingAttribute = firstChild.attrs.find(
    (attr) => attr.name === attributeName
  );
  if (existingAttribute) {
    existingAttribute.value = attributeValue;
  } else {
    firstChild.attrs.push({ name: attributeName, value: attributeValue });
  }

  return serialize(fragment);
}
addAttribute[MACRO_IDENTIFIER] = "addAttribute";

export function wrapHtml(content, wrapper) {
  const wrapperTag = wrapper.replace("<", "").replace(">", "").split(" ")[0];
  const html = `${wrapper}${content}</${wrapperTag}>`;
  return html;
}
wrapHtml[MACRO_IDENTIFIER] = "wrapHtml";

export function head(content) {
  return `<head>
    <title>Test</title>
    </head>`;
}
head[MACRO_IDENTIFIER] = "head";
