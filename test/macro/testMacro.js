// Has no identifier property, so should be ignored.
function ignoredFunction() {
  console.log("ignoredFunction");
}

function cap(content) {
  return content.toUpperCase();
}
cap.macroIdentifier = "cap";

function wrap(content, wrapperChar) {
  return wrapperChar + content + wrapperChar;
}
wrap.macroIdentifier = "wrap";

testNoArguments.macroIdentifier = "testNoArguments";
// Basic test function with no arguments (except expected content argument).
function testNoArguments(content) {
  console.log("...testNoArguments executing...");
  console.log(content);
  console.log("");
}
testNoArguments.macroIdentifier = "testNoArguments";

function testWithArgument(content, arg1) {
  console.log("...testWithArgument executing...");
  console.log(content);
  console.log(arg1);
  console.log("");
}
testWithArgument.macroIdentifier = "testWithArgument";

function testWithArguments(content, arg1, arg2) {
  console.log("...testWithArguments executing...");
  console.log(content);
  console.log(arg1);
  console.log(arg2);
  console.log("");
}
testWithArguments.macroIdentifier = "testWithArguments";

export {
  ignoredFunction,
  cap,
  wrap,
  testNoArguments,
  testWithArgument,
  testWithArguments,
};
