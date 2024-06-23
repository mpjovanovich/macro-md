function testNoArgumentsNoContent(content) {
  return `testNoArgumentsNoContent`;
}
testNoArgumentsNoContent.macroIdentifier = "testNoArgumentsNoContent";

function testNoArguments(content) {
  return `testNoArgumentsNoContent ${content}`;
}
testNoArguments.macroIdentifier = "testNoArguments";

function testWithArgument(content, arg1) {
  return `testWithArgument ${content} ${arg1}`;
}
testWithArgument.macroIdentifier = "testWithArgument";

export { testNoArgumentsNoContent, testNoArguments, testWithArgument };
