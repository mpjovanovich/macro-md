import fs from "fs/promises";
import {
  MACRO_IDENTIFIER,
  MacroFunction,
  loadMacros,
  parse,
} from "../src/macroLoader";

const TEST_MARKDOWN_FILE = "markdown.md";
const TEST_MACRO_FILE = "macro.js";

// Create a minimal mock Stats object
const existingFileStats = {
  isFile: () => true,
  isDirectory: () => false,
} as any;

/* **************************************************
 * MACRO FUNCTIONS
 ************************************************** */
function testNoMacroIdentifierSet(content: string): string {
  return `testNoMacroIdentifierSet`;
}

function testNoArgumentsNoContent(content: string): string {
  return `testNoArgumentsNoContent`;
}
testNoArgumentsNoContent[MACRO_IDENTIFIER] = "testNoArgumentsNoContent";

function testNoArguments(content: string): string {
  return `testNoArguments ${content}`;
}
testNoArguments[MACRO_IDENTIFIER] = "testNoArguments";

function testWithArgument(content: string, arg1: string): string {
  return `testWithArgument ${content} ${arg1}`;
}
testWithArgument[MACRO_IDENTIFIER] = "testWithArgument";

/* **************************************************
 * TESTS
 ************************************************** */
describe("loadMacros", () => {
  let statSpy: jest.SpyInstance;
  let mockDynamicImport: jest.Mock;

  beforeEach(() => {
    // Needed so that we don't get a "file not found" error.
    statSpy = jest.spyOn(fs, "stat").mockResolvedValue(existingFileStats);
    // Use a mock to allow us to define the macros for each test rather than
    // loading from a file.
    mockDynamicImport = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not load macro when identifier not set", async () => {
    mockDynamicImport.mockResolvedValue({
      testNoMacroIdentifierSet: testNoMacroIdentifierSet,
    });
    const macros = await loadMacros(TEST_MACRO_FILE, mockDynamicImport);
    expect(macros.has("testNoMacroIdentifierSet")).toBeFalsy();
  });

  it("loads macro when identifier set", async () => {
    mockDynamicImport.mockResolvedValue({
      testNoArgumentsNoContent: testNoArgumentsNoContent,
    });
    const macros = await loadMacros(TEST_MACRO_FILE, mockDynamicImport);
    expect(macros.has("testNoArgumentsNoContent")).toBeTruthy();
    expect(typeof macros.get("testNoArgumentsNoContent")).toBe("function");
  });
});

// // TODO: refactor. I don't want to pollute the API just for the sake of testing.
// // We will unit test the components of the parse function instead.
// describe("parse", () => {
//   let statSpy: jest.SpyInstance;
//   let readFileSpy: jest.SpyInstance;
//   let mockDynamicImport: jest.Mock;

//   beforeEach(() => {
//     // Needed so that we don't get a "file not found" error.
//     statSpy = jest.spyOn(fs, "stat").mockResolvedValue(existingFileStats);
//     // Use a spy to allow us to define the markdown for each test.
//     readFileSpy = jest.spyOn(fs, "readFile");
//     // Use a mock to allow us to define the macros for each test rather than
//     // loading from a file.
//     mockDynamicImport = jest.fn();
//   });

//   afterEach(() => {
//     jest.restoreAllMocks();
//   });

//   it("basic markdown - no macros", async () => {
//     // // Imports
//     // mockDynamicImport.mockResolvedValue({
//     //   testNoMacroIdentifierSet: testNoMacroIdentifierSet,
//     // });
//     // // Markdown
//     // readFileSpy.mockResolvedValueOnce("start end");

//     expect(true).toBe(true);
//   });

//   //   const testCases = [
//   //     {
//   //       description: "basic markdown - no macros",
//   //       markdown: "start end",
//   //       expected: "<p>start end</p>\n",
//   //     },
//   //     {
//   //       description: "inline macro, no arguments, no content",
//   //       markdown: "start ^testNoArgumentsNoContent{} end",
//   //       expected: "<p>start testNoArgumentsNoContent end</p>\n",
//   //     },
//   //     {
//   //       description: "inline macro, no arguments, content",
//   //       markdown: "start ^testNoArguments{content} end",
//   //       expected: "<p>start testNoArguments content end</p>\n",
//   //     },
//   //     {
//   //       description: "inline macro, argument, no spacing",
//   //       markdown: "start ^testWithArgument(arg1){content} end",
//   //       expected: "<p>start testWithArgument content arg1 end</p>\n",
//   //     },
//   //   ];

//   //   testCases.forEach(({ description, markdown, expected }) => {
//   //     test(description, async () => {
//   //       readFileSpy.mockResolvedValueOnce(markdown);
//   //       const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
//   //       expect(result).toBe(expected);
//   //     });
//   //   });
// });

/* TODO:
Currently broken:
- first line is wrapped in a macro.
- Multiple inline non-nested tags

No args:
- Single inline
- Inline with nested inline
- Multiple inline on same line
- Single block different line from content
- Single block same line as content
- Single block wrapping whole file
- Block with nested inline 
- Multiple nested block
- Multiple nested inline
- Multiple macros same content

Args
- Single args
- Indefinite args
- Multiple macros with args same content
*/
