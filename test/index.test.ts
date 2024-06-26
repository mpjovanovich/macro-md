import fs from "fs/promises";
import {
  MACRO_IDENTIFIER,
  MacroCall,
  MacroFunction,
  escapeRegExp,
  embedTokens,
  loadMacros,
  processMacro,
  removeBlockTokenWrappers,
} from "../src/macroLoader";
import { marked } from "marked";

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

const macros = getMacros();
const macroRegex = getMacroRegex();

// There's a property for each step in the transformation pipeline.
// This allows for consistent testing of each step for each use case.
const testCases: {
  description: string;
  markdown: string;
  embedded: string;
  parsedMarkdown: string;
  removedBlock: string;
  processedOutput: string;
  placeholders: Map<string, MacroCall>;
}[] = [
  // INLINE
  {
    description: "basic markdown - no macros",
    markdown: "start end",
    embedded: "start end",
    parsedMarkdown: "<p>start end</p>\n",
    removedBlock: "<p>start end</p>\n",
    processedOutput: "<p>start end</p>\n",
    placeholders: new Map<string, MacroCall>(),
  },
  {
    description: "inline macro, no content",
    markdown: "start ^testNoArgumentsNoContent{} end",
    embedded: `start ${GUID}_0${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TNANC end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArgumentsNoContent,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "inline macro, content",
    markdown: "start ^testNoArguments{content} end",
    embedded: `start ${GUID}_0content${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TNA_start_content_TNA_end end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "inline macro, content, bumps against start but not end",
    markdown: "^testNoArguments{content} end",
    embedded: `${GUID}_0content${GUID}_0 end`,
    parsedMarkdown: `<p>${GUID}_0content${GUID}_0 end</p>\n`,
    removedBlock: `<p>${GUID}_0content${GUID}_0 end</p>\n`,
    processedOutput: `<p>TNA_start_content_TNA_end end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "inline macro, content, bumps against end but not start",
    markdown: "start ^testNoArguments{content}",
    embedded: `start ${GUID}_0content${GUID}_0`,
    parsedMarkdown: `<p>start ${GUID}_0content${GUID}_0</p>\n`,
    removedBlock: `<p>start ${GUID}_0content${GUID}_0</p>\n`,
    processedOutput: `<p>start TNA_start_content_TNA_end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "macro wrapping single line of content",
    markdown: "^testNoArguments{content}",
    embedded: `${GUID}_0\n\ncontent\n\n${GUID}_0\n`,
    parsedMarkdown: `<p>${GUID}_0</p>\n<p>content</p>\n<p>${GUID}_0</p>\n`,
    removedBlock: `${GUID}_0\n<p>content</p>\n${GUID}_0\n`,
    processedOutput: `TNA_start_<p>content</p>_TNA_end\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "two subsequent inline macros, each on own line",
    markdown: `^testNoArguments{first}\n^testNoArguments{second}`,
    embedded: `${GUID}_0\n\nfirst\n\n${GUID}_0\n\n${GUID}_1\n\nsecond\n\n${GUID}_1\n`,
    parsedMarkdown: `<p>${GUID}_0</p>\n<p>first</p>\n<p>${GUID}_0</p>\n<p>${GUID}_1</p>\n<p>second</p>\n<p>${GUID}_1</p>\n`,
    removedBlock: `${GUID}_0\n<p>first</p>\n${GUID}_0\n${GUID}_1\n<p>second</p>\n${GUID}_1\n`,
    processedOutput: `TNA_start_<p>first</p>_TNA_end\nTNA_start_<p>second</p>_TNA_end\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
      [
        "GUID_1",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "nested inline macro",
    markdown:
      "outerstart ^testNoArguments{innerstart ^testNoArguments{content} innerend} outerend",
    embedded: `outerstart ${GUID}_0innerstart ${GUID}_1content${GUID}_1 innerend${GUID}_0 outerend`,
    parsedMarkdown: `<p>outerstart ${GUID}_0innerstart ${GUID}_1content${GUID}_1 innerend${GUID}_0 outerend</p>\n`,
    removedBlock: `<p>outerstart ${GUID}_0innerstart ${GUID}_1content${GUID}_1 innerend${GUID}_0 outerend</p>\n`,
    processedOutput:
      "<p>outerstart TNA_start_innerstart TNA_start_content_TNA_end innerend_TNA_end outerend</p>\n",
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
      [
        "GUID_1",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },
  {
    description: "multiple inline on same line",
    markdown: "start ^testNoArguments{first} ^testNoArguments{second} end",
    embedded: `start ${GUID}_0first${GUID}_0 ${GUID}_1second${GUID}_1 end`,
    parsedMarkdown: `<p>start ${GUID}_0first${GUID}_0 ${GUID}_1second${GUID}_1 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0first${GUID}_0 ${GUID}_1second${GUID}_1 end</p>\n`,
    processedOutput:
      "<p>start TNA_start_first_TNA_end TNA_start_second_TNA_end end</p>\n",
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
      [
        "GUID_1",
        {
          macro: testNoArguments,
          args: [],
        },
      ],
    ]),
  },

  // MULTILINE
  //   {
  //     description: "macro wrapping multiple lines of content",
  //     markdown: `^testNoArguments{
  // content
  // }`,
  //     embedded: `${GUID}_0
  // content
  // ${GUID}_0`,
  //     parsedMarkdown: `<p>${GUID}_0</p>
  // <p>content</p>
  // <p>${GUID}_0</p>
  // `,
  //     removedBlock: `${GUID}_0
  // <p>content</p>
  // ${GUID}_0
  // `,
  //     processedOutput: `TNA_start_<p>content</p>_TNA_end\n`,
  //     placeholders: new Map<string, MacroCall>([
  //       [
  //         "GUID_0",
  //         {
  //           macro: testNoArguments,
  //           args: [],
  //         },
  //       ],
  //     ]),
  //   },
  //   {
  //     description: "macro wrapping multiple lines of content with line breaks",
  //     markdown: `^testNoArguments{

  // content

  // }`,
  //     embedded: `${GUID}_0

  // content

  // ${GUID}_0`,
  //     parsedMarkdown: `<p>${GUID}_0</p>
  // <p>content</p>
  // <p>${GUID}_0</p>
  // `,
  //     removedBlock: `${GUID}_0
  // <p>content</p>
  // ${GUID}_0
  // `,
  //     processedOutput: `TNA_start_<p>content</p>_TNA_end\n`,
  //     placeholders: new Map<string, MacroCall>([
  //       [
  //         "GUID_0",
  //         {
  //           macro: testNoArguments,
  //           args: [],
  //         },
  //       ],
  //     ]),
  //   },
  //   {
  //     description: "macro wrapping multiple lines of content with nested macro",
  //     markdown: `^testNoArguments{
  // content
  // ^testNoArguments{
  // nested content
  // }
  // }`,
  //     embedded: `${GUID}_0
  // content
  // ${GUID}_1
  // nested content
  // ${GUID}_1
  // ${GUID}_0`,
  //     parsedMarkdown: `<p>${GUID}_0</p>
  // <p>content</p>
  // <p>${GUID}_1</p>
  // <p>nested content</p>
  // <p>${GUID}_1</p>
  // <p>${GUID}_0</p>
  // `,
  //     removedBlock: `${GUID}_0
  // <p>content</p>
  // ${GUID}_1
  // <p>nested content</p>
  // ${GUID}_1
  // ${GUID}_0
  // `,
  //     processedOutput: `TNA_start_<p>content</p>
  // TNA_start_<p>nested content</p>_TNA_end_TNA_end\n`,
  //     placeholders: new Map<string, MacroCall>([
  //       [
  //         "GUID_0",
  //         {
  //           macro: testNoArguments,
  //           args: [],
  //         },
  //       ],
  //       [
  //         "GUID_1",
  //         {
  //           macro: testNoArguments,
  //           args: [],
  //         },
  //       ],
  //     ]),
  //   },

  // SINGLE ARGUMENT
  {
    description: "inline macro, single argument, no spacing",
    markdown: "start ^testWithArgument(arg1){content} end",
    embedded: `start ${GUID}_0content${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TWA_start_content arg1_TWA_end end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testWithArgument,
          args: ["arg1"],
        },
      ],
    ]),
  },
  {
    description: "inline macro, single argument, spacing",
    markdown: "start ^testWithArgument (arg1 ) {content} end",
    embedded: `start ${GUID}_0content${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0content${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TWA_start_content arg1_TWA_end end</p>\n`,
    placeholders: new Map<string, MacroCall>([
      [
        "GUID_0",
        {
          macro: testWithArgument,
          args: ["arg1"],
        },
      ],
    ]),
  },
];

/* **************************************************
 * USER MACRO FUNCTIONS
 ************************************************** */
function testNoMacroIdentifierSet(content: string): string {
  return `testNoMacroIdentifierSet`;
}

function testNoArgumentsNoContent(content: string): string {
  return `TNANC`;
}
testNoArgumentsNoContent[MACRO_IDENTIFIER] = "testNoArgumentsNoContent";

function testNoArguments(content: string): string {
  return `TNA_start_${content}_TNA_end`;
}
testNoArguments[MACRO_IDENTIFIER] = "testNoArguments";

function testWithArgument(content: string, arg1: string): string {
  return `TWA_start_${content} ${arg1}_TWA_end`;
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
  let result_placeholders: Map<string, MacroCall>;

  beforeEach(() => {
    result_placeholders = new Map();
  });

  testCases.forEach(({ description, markdown, embedded, placeholders }) => {
    it(description, () => {
      const result = embedTokens(
        markdown,
        macroRegex,
        macros,
        result_placeholders,
        GUID
      );
      expect(result).toBe(embedded);
      expect(result_placeholders).toEqual(placeholders);
    });
  });
});

describe("parseIntermediateMarkdown", () => {
  testCases.forEach(({ description, embedded, parsedMarkdown }) => {
    it(description, async () => {
      const result = await marked.parse(embedded);
      expect(result).toBe(parsedMarkdown);
    });
  });
});

describe("removeBlockTokenWrappers", () => {
  testCases.forEach(({ description, parsedMarkdown, removedBlock }) => {
    it(description, async () => {
      const result = removeBlockTokenWrappers(parsedMarkdown, GUID);
      expect(result).toBe(removedBlock);
    });
  });
});

describe("processMacro", () => {
  testCases.forEach(
    ({ description, removedBlock, processedOutput, placeholders }) => {
      if (!processedOutput) return;

      it(description, () => {
        const result = processMacro(removedBlock, GUID, placeholders);
        expect(result).toBe(processedOutput);
      });
    }
  );
});

/* TODO:
No args:
- Multiple macros same content

Args
- Single args
- Indefinite args
- Multiple macros with args same content
*/
