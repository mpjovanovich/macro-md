import { MACRO_IDENTIFIER } from "../../dist/macroLoader.js";

function testNoArgumentsNoContent(content) {
  return `testNoArgumentsNoContent`;
}

// You can just assign the expected string as a property if you don't want to use the import, but it's more error prone.
testNoArgumentsNoContent[MACRO_IDENTIFIER] = "testNoArgumentsNoContent";

function testNoArguments(content) {
  return `testNoArguments ${content}`;
}
testNoArguments[MACRO_IDENTIFIER] = "testNoArguments";

function testWithArgument(content, arg1) {
  return `testWithArgument ${content} ${arg1}`;
}
testWithArgument[MACRO_IDENTIFIER] = "testWithArgument";

export { testNoArgumentsNoContent, testNoArguments, testWithArgument };
