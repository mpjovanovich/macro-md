// Has no identifier property, so should be ignored.
function ignoredFunction() {
  console.log("ignoredFunction");
}

function echo(content) {
  return content;
}
echo.macro_identifier = "echo";

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
  echo,
  testNoArguments,
  testWithArgument,
  testWithArguments,
};
