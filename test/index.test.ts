import fs from "fs/promises";
import {
  MACRO_IDENTIFIER,
  MacroCall,
  MacroFunction,
  escapeRegExp,
  embedTokens,
  loadMacros,
} from "../src/macroLoader";

/* **************************************************
 * CONSTANTS
 ************************************************** */
const MACRO_DELIMITER = "^";
const GUID = "GUID";

// Create a minimal mock Stats object
const existingFileStats = {
  isFile: () => true,
  isDirectory: () => false,
} as any;

// There's a property for each step in the transformation pipeline.
// This allows for consistent testing of each step for each use case.
const testCases = [
  {
    description: "basic markdown - no macros",
    markdown: "start end",
    embedded: "start end",
    embeddedBlock: "start end",
    parsedMarkdown: "<p>start end</p>\n",
    removedBlock: "<p>start end</p>\n",
    processedOutput: "<p>start end</p>\n",
  },
  {
    description: "inline macro, no arguments, no content",
    markdown: "start ^testNoArgumentsNoContent{} end",
    embedded: `start ${GUID}_0${GUID}_0 end`,
    embeddedBlock: "",
    parsedMarkdown: "",
    removedBlock: "",
    processedOutput: "<p>start testNoArgumentsNoContent end</p>\n",
  },
  {
    description: "inline macro, no arguments, content",
    markdown: "start ^testNoArguments{content} end",
    embedded: `start ${GUID}_0content${GUID}_0 end`,
    embeddedBlock: "",
    parsedMarkdown: "",
    removedBlock: "",
    processedOutput: "<p>start testNoArguments content end</p>\n",
  },
  {
    description: "inline macro, argument, no spacing",
    markdown: "start ^testWithArgument(arg1){content} end",
    embedded: `start ${GUID}_0content${GUID}_0 end`,
    embeddedBlock: "",
    parsedMarkdown: "",
    removedBlock: "",
    processedOutput: "<p>start testWithArgument content arg1 end</p>\n",
  },
];

/* **************************************************
 * USER MACRO FUNCTIONS
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
 * HELPER FUNCTIONS
 ************************************************** */
function getMacros(): Map<string, MacroFunction> {
  let macros = new Map<string, MacroFunction>();
  macros.set("testNoArgumentsNoContent", testNoArgumentsNoContent);
  macros.set("testNoArguments", testNoArguments);
  macros.set("testWithArgument", testWithArgument);
  return macros;
}

function getMacroRegex(): RegExp {
  const escapedMacroDelimiter = escapeRegExp(MACRO_DELIMITER);
  const macroRegex = new RegExp(
    `${escapedMacroDelimiter}\\s*(\\S+?)\\s*(?:\\((.*?)\\))?\\s*\\{`,
    "g"
  );
  return macroRegex;
}

/* **************************************************
 * TESTS
 ************************************************** */
describe("loadMacros", () => {
  let statSpy: jest.SpyInstance;
  let mockDynamicImport: jest.Mock;
  const testMacroFile = "macro.js";

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
    const macros = await loadMacros(testMacroFile, mockDynamicImport);
    expect(macros.has("testNoMacroIdentifierSet")).toBeFalsy();
  });

  it("loads macro when identifier set", async () => {
    mockDynamicImport.mockResolvedValue({
      testNoArgumentsNoContent: testNoArgumentsNoContent,
    });
    const macros = await loadMacros(testMacroFile, mockDynamicImport);
    expect(macros.has("testNoArgumentsNoContent")).toBeTruthy();
    expect(typeof macros.get("testNoArgumentsNoContent")).toBe("function");
  });
});

describe("embedTokens", () => {
  let macros = getMacros();
  let macroRegex = getMacroRegex();
  let placeholders: Map<string, MacroCall>;

  beforeEach(() => {
    placeholders = new Map();
  });

  testCases.forEach(({ description, markdown, embedded }) => {
    it(description, () => {
      const result = embedTokens(
        markdown,
        macroRegex,
        macros,
        placeholders,
        GUID
      );
      expect(result).toBe(embedded);
    });
  });
});

// TO TEST:
//   markdown = embedTokens(markdown, macroRegex, macros, placeholders, guid);
//   markdown = separateBlockTokens(markdown, guid);
//   markdown = await marked.parse(markdown);
//   markdown = removeBlockTokenWrappers(markdown, guid);
//   markdown = processMacro(markdown, guid, placeholders);

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
