import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "../src/macroLoader.js";
import sinon from "sinon";

// // test
// import { readFile } from "../src/macroLoader.js";

// Helper functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_MARKDOWN_FILE = "markdown.md";
const TEST_MACRO_FILE = path.join(__dirname, "./macro/testMacro.js");

/* **************************************************
 * TESTS
 ************************************************** */
describe("INTEGRATION TEST - FULL MACRO PARSE", () => {
  let existsSyncStub: sinon.SinonStub;
  let readFileSyncStub: sinon.SinonStub;

  beforeEach(function () {
    existsSyncStub = sinon.stub(fs, "existsSync").returns(true);
    readFileSyncStub = sinon.stub(fs, "readFileSync");
  });

  afterEach(() => {
    existsSyncStub.restore();
    readFileSyncStub.restore();
  });

  // Example of a parameterized test approach (if applicable)
  const testCases = [
    {
      description: "basic markdown - no macros",
      markdown: "start end",
      expected: "<p>start end</p>\n",
    },
    {
      description: "inline macro, no arguments, no content",
      markdown: "start ^testNoArgumentsNoContent{} end",
      expected: "<p>start testNoArgumentsNoContent end</p>\n",
    },
    {
      description: "inline macro, no arguments, content",
      markdown: "start ^testNoArguments{content} end",
      expected: "<p>start testNoArguments content end</p>\n",
    },
    {
      description: "inline macro, argument, no spacing",
      markdown: "start ^testWithArgument(arg1){content} end",
      expected: "<p>start testWithArgument content arg1 end</p>\n",
    },
  ];

  testCases.forEach(({ description, markdown, expected }) => {
    it(description, async () => {
      readFileSyncStub.withArgs(TEST_MARKDOWN_FILE).returns(markdown);
      const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
      expect(result).to.equal(expected);
    });
  });
});

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
