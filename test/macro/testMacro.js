const MACRO_IDENTIFIER = "macroIdentifier";
import { parseFragment, serialize } from "parse5";

/*
 * HELPERS
 */
function getChildAttributeValue(content, elementName, attributeName) {
  // Check if content is a string or a node
  let fragment;
  if (typeof content === "string") {
    fragment = parseFragment(content);
  } else {
    fragment = content;
  }

  // Depth first search.
  let value = "";
  for (const child of fragment.childNodes) {
    if (value) {
      break;
    }
    if (child.nodeName.toLowerCase() === elementName.toLowerCase()) {
      if (child.attrs) {
        const attr = child.attrs.find(
          (attr) => attr.name.toLowerCase() === attributeName.toLowerCase()
        );
        if (attr) {
          return attr.value;
        }
      }
    }
    value = getChildAttributeValue(child, elementName, attributeName);
  }

  // Final check at the root node. We should have a value by now.
  if (!value) {
    throw new Error(`Attribute not found: ${attributeName} in ${elementName}`);
  }
  return value;
}

/*
 * MACROS
 */
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
  content = '<p class="focusContentTitle">Demo:</p>\n\n' + content;
  content = wrapHtml(content, "div", "focusContent");
  return content;
}
demo[MACRO_IDENTIFIER] = "demo";

export function exercise(content) {
  content = '<p class="focusContentTitle">Exercise:</p>\n\n' + content;
  content = wrapHtml(content, "div", "focusContent");
  return content;
}
exercise[MACRO_IDENTIFIER] = "exercise";

export function fig(content, width = "100", altText = "Figure") {
  // If the content has an anchor tag...
  const href = content.includes("<a")
    ? getChildAttributeValue(content, "a", "href")
    : content.replace("<p>", "").replace("</p>", "");
  content = `<img src="${href}" alt="${altText}" style="width:${width}%;height:auto;">`;
  content = wrapHtml(content, "span");
  content = wrapHtml(content, "figure");
  return content;
}
fig[MACRO_IDENTIFIER] = "fig";

export function summary(content, summary) {
  return `<details><summary>${summary}</summary>${content}</details>`;
}
summary[MACRO_IDENTIFIER] = "summary";

export function wrapHtml(content, wrapperElement, classList = "") {
  const classAttribute = classList ? ` class="${classList}"` : "";
  const html = `<${wrapperElement} ${classAttribute}>${content}</${wrapperElement}>`;
  return html;
}
wrapHtml[MACRO_IDENTIFIER] = "wrapHtml";
