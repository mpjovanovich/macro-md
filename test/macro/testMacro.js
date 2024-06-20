import { parseFragment, serialize } from "parse5";

// Has no identifier property, so should be ignored.
function ignoredFunction() {
  console.log("ignoredFunction");
}

function cap(content) {
  //   const html = parseFragment(content);

  //   // Modify the text nodes for all the elements recursively.
  //   function modifyTextNodes(node) {
  //     if (node.nodeName === "#text") {
  //       node.value = node.value.toUpperCase();
  //     } else {
  //       node.childNodes.forEach((childNode) => modifyTextNodes(childNode));
  //     }
  //   }
  //   modifyTextNodes(html);

  //   return serialize(html);
  return content.toUpperCase();
}
cap.macro_identifier = "cap";

function wrap(content, wrapperChar) {
  return wrapperChar + content + wrapperChar;
}
wrap.macro_identifier = "wrap";

testNoArguments.macro_identifier = "testNoArguments";
// Basic test function with no arguments (except expected content argument).
function testNoArguments(content) {
  console.log("...testNoArguments executing...");
  console.log(content);
  console.log("");
}
testNoArguments.macro_identifier = "testNoArguments";

function testWithArgument(content, arg1) {
  console.log("...testWithArgument executing...");
  console.log(content);
  console.log(arg1);
  console.log("");
}
testWithArgument.macro_identifier = "testWithArgument";

function testWithArguments(content, arg1, arg2) {
  console.log("...testWithArguments executing...");
  console.log(content);
  console.log(arg1);
  console.log(arg2);
  console.log("");
}
testWithArguments.macro_identifier = "testWithArguments";

export {
  ignoredFunction,
  cap,
  wrap,
  testNoArguments,
  testWithArgument,
  testWithArguments,
};
