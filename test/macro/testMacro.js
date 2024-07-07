import { MACRO_IDENTIFIER } from "../../dist/macroLoader.js";
import { parseFragment, serialize } from "parse5";

/*
 * Sandbox macros for testing.
 * These are in no way robust. Use at your own risk.
 */

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

export function wrapHtml(content, wrapperElement, classList = "") {
  const html = `<${wrapperElement} class=${classList}>${content}</${wrapperElement}>`;
  return html;
}
wrapHtml[MACRO_IDENTIFIER] = "wrapHtml";

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

export function demo(content) {
  content = '<p class="focusContentTitle">Demo:<p>\n\n' + content;
  content = wrapHtml(content, "div", "focusContent");
  return content;
}
demo[MACRO_IDENTIFIER] = "demo";

export function head(content) {
  return `<head>
    <title>Test</title>
    </head>`;
}
head[MACRO_IDENTIFIER] = "head";
