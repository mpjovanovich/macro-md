import fs from "fs/promises";
import {
  MACRO_IDENTIFIER,
  MacroCall,
  MacroFunction,
  escapeRegExp,
  embedTokens,
  getMacroContent,
  loadMacros,
  parseMarkdown,
  processMacro,
  removeTokenWrappers,
} from "../src/macroLoader";
import { marked } from "marked";
import { assert } from "console";
import exp from "constants";

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
  macroContent?: string;
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
    macroContent: undefined,
    embedded: "start end",
    parsedMarkdown: "<p>start end</p>\n",
    removedBlock: "<p>start end</p>\n",
    processedOutput: "<p>start end</p>\n",
    placeholders: new Map<string, MacroCall>(),
  },
  {
    description: "inline macro, no content",
    markdown: "start ^testNoArgumentsNoContent{} end",
    macroContent: "",
    embedded: `start ${GUID}_0  ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0  ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0  ${GUID}_0 end</p>\n`,
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
    macroContent: "content",
    embedded: `start ${GUID}_0 content ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
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
    description:
      "inline macro, content with markdown syntax touching curly braces",
    markdown: "start ^testNoArguments{_content_} end",
    macroContent: "_content_",
    embedded: `start ${GUID}_0 _content_ ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0 <em>content</em> ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 <em>content</em> ${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TNA_start_<em>content</em>_TNA_end end</p>\n`,
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
    macroContent: "content",
    embedded: `${GUID}_0 content ${GUID}_0 end`,
    parsedMarkdown: `<p>${GUID}_0 content ${GUID}_0 end</p>\n`,
    removedBlock: `<p>${GUID}_0 content ${GUID}_0 end</p>\n`,
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
    macroContent: "content",
    embedded: `start ${GUID}_0 content ${GUID}_0`,
    parsedMarkdown: `<p>start ${GUID}_0 content ${GUID}_0</p>\n`,
    removedBlock: `<p>start ${GUID}_0 content ${GUID}_0</p>\n`,
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
    description: "nested inline macro",
    markdown:
      "outerstart ^testNoArguments{innerstart ^testNoArguments{content} innerend} outerend",
    macroContent: "innerstart ^testNoArguments{content} innerend",
    embedded: `outerstart ${GUID}_0 innerstart ${GUID}_1 content ${GUID}_1 innerend ${GUID}_0 outerend`,
    parsedMarkdown: `<p>outerstart ${GUID}_0 innerstart ${GUID}_1 content ${GUID}_1 innerend ${GUID}_0 outerend</p>\n`,
    removedBlock: `<p>outerstart ${GUID}_0 innerstart ${GUID}_1 content ${GUID}_1 innerend ${GUID}_0 outerend</p>\n`,
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
    macroContent: "first",
    embedded: `start ${GUID}_0 first ${GUID}_0 ${GUID}_1 second ${GUID}_1 end`,
    parsedMarkdown: `<p>start ${GUID}_0 first ${GUID}_0 ${GUID}_1 second ${GUID}_1 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 first ${GUID}_0 ${GUID}_1 second ${GUID}_1 end</p>\n`,
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

  // BLOCK
  {
    description: "block macro wrapping single line of content",
    markdown: "^testNoArguments{content}",
    macroContent: "content",
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
    description: "two subsequent block macros, each on own line",
    markdown: `^testNoArguments{first}\n^testNoArguments{second}`,
    macroContent: "first",
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
    description: "macro wrapping multiple lines of content",
    markdown: `^testNoArguments{\ncontent\n}`,
    macroContent: "\ncontent\n",
    embedded: `${GUID}_0\n\n\ncontent\n\n\n${GUID}_0\n`,
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

  // ARGUMENTS
  {
    description: "inline macro, single argument, no spacing",
    markdown: "start ^testWithArgument(arg1){content} end",
    macroContent: "content",
    embedded: `start ${GUID}_0 content ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
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
    macroContent: "content",
    embedded: `start ${GUID}_0 content ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 content ${GUID}_0 end</p>\n`,
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

  // MULTIPLE MACROS
  {
    description: "multiple macros - inline",
    markdown: "start ^testNoArguments testWithArgument(arg1){content} end",
    macroContent: "content",
    embedded: `start ${GUID}_0 ${GUID}_1 content ${GUID}_1 ${GUID}_0 end`,
    parsedMarkdown: `<p>start ${GUID}_0 ${GUID}_1 content ${GUID}_1 ${GUID}_0 end</p>\n`,
    removedBlock: `<p>start ${GUID}_0 ${GUID}_1 content ${GUID}_1 ${GUID}_0 end</p>\n`,
    processedOutput: `<p>start TNA_start_TWA_start_content arg1_TWA_end_TNA_end end</p>\n`,
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
          macro: testWithArgument,
          args: ["arg1"],
        },
      ],
    ]),
  },
  {
    description: "multiple macros - block",
    markdown: "^testNoArguments testWithArgument(arg1){content}",
    macroContent: "content",
    embedded: `${GUID}_0\n\n${GUID}_1\n\ncontent\n\n${GUID}_1\n\n${GUID}_0\n`,
    parsedMarkdown: `<p>${GUID}_0</p>\n<p>${GUID}_1</p>\n<p>content</p>\n<p>${GUID}_1</p>\n<p>${GUID}_0</p>\n`,
    removedBlock: `${GUID}_0\n${GUID}_1\n<p>content</p>\n${GUID}_1\n${GUID}_0\n`,
    processedOutput: `TNA_start_TWA_start_<p>content</p> arg1_TWA_end_TNA_end\n`,
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
          macro: testWithArgument,
          args: ["arg1"],
        },
      ],
    ]),
  },
  // TODO: Block test...
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
  const macroRegex = new RegExp(`${escapedMacroDelimiter}(.*?)\\{`, "g");
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

describe("getMacroContent", () => {
  testCases.forEach(({ description, markdown, macroContent }) => {
    if (macroContent === undefined) return;

    it(description, () => {
      let match = macroRegex.exec(markdown);
      if (!match) throw new Error("No match found in markdown.");

      // Start will be the first character after the macro identifier,
      // end will be the closing curly brace.
      const { start, end } = getMacroContent(markdown, macroRegex, match);
      expect(markdown.substring(start, end)).toBe(macroContent);
    });
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
        GUID,
        { index: 0 }
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

describe("removeTokenWrappers", () => {
  testCases.forEach(({ description, parsedMarkdown, removedBlock }) => {
    it(description, async () => {
      const result = removeTokenWrappers(parsedMarkdown, GUID);
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

describe("MacroMDOptions", () => {
  describe("parseString with custom macroDelimiter", () => {
    let result_placeholders: Map<string, MacroCall>;

    beforeEach(() => {
      result_placeholders = new Map();
    });

    it("processes markdown string using custom macroDelimiter", async () => {
      let markdown = "start %testNoArguments{content} end";
      const macroDelimiter = "%";
      const escapedMacroDelimiter = escapeRegExp(macroDelimiter);
      const macroRegex = new RegExp(`${escapedMacroDelimiter}(.*?)\\{`, "g");
      const expected = `start ${GUID}_0 content ${GUID}_0 end`;

      const result = embedTokens(
        markdown,
        macroRegex,
        macros,
        result_placeholders,
        GUID,
        { index: 0 }
      );

      expect(result).toBe(expected);
    });

    it("does not include ids when useGitHubStyleIds=false", async () => {
      const markdown = "# Test";
      const expected = `<h1>Test</h1>\n`;
      let result = await parseMarkdown(markdown, false, false);
      expect(result).toBe(expected);
    });

    it("includes ids when useGitHubStyleIds=true", async () => {
      const markdown = "# Test";
      const expected = `<h1 id="test">Test</h1>\n`;
      let result = await parseMarkdown(markdown, true, false);
      expect(result).toBe(expected);
    });

    it("should remove open and close hyphens when using GitHub style IDs", async () => {
      const markdown = "# Conjunction (AND)";
      const result = await parseMarkdown(markdown, true, false);
      expect(result).toContain(
        '<h1 id="conjunction-and">Conjunction (AND)</h1>'
      );
    });
  });
});

/* TODO:
- Indefinite args
*/
