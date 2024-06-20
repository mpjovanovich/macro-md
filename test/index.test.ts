import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "../src/macroLoader.js";

// Helper functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_MARKDOWN_FILE = path.join(__dirname, "./tmp/test_md.md");
const TEST_MACRO_FILE = path.join(__dirname, "./tmp/test_macro.js");

const MACRO_TEMPLATE = `function test() {
  return "Parsed macro content";
}
test.macro_identifier = "test";
export default test;
`;

/* **************************************************
 * HELPERS
 ************************************************** */
function createTestMarkdownFile(content: string): void {
  try {
    fs.writeFileSync(TEST_MARKDOWN_FILE, content, { flag: "w" });
  } catch (error) {
    let message = error instanceof Error ? error.message : error;
    throw new Error(`Failed to create markdown file: ${message}`);
  }
}

function createTestMacroFile(content: string): void {
  try {
    fs.writeFileSync(TEST_MACRO_FILE, content);
  } catch (error) {
    let message = error instanceof Error ? error.message : error;
    throw new Error(`Failed to create macro file: ${message}`);
  }
}

/* **************************************************
 * TESTS
 ************************************************** */
describe("Macro Loader", () => {
  it("produces basic markdown - no macros", async () => {
    // Create test files
    createTestMarkdownFile("Content");
    createTestMacroFile(MACRO_TEMPLATE);

    // Parse markdown file
    const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");

    // Assert
    const expected = "<p>Content</p>\n";
    expect(result).to.equal(expected);
  });

  // More "it" tests will go here.
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
