import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "../src/macroLoader.js";

// Helper functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_MARKDOWN_FILE = path.join(__dirname, "./tmp/test_md.md");
const TEST_MACRO_FILE = path.join(__dirname, "./macro/testMacro.js");

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
function deleteTestMarkdownFile(): void {
  try {
    fs.unlinkSync(TEST_MARKDOWN_FILE);
  } catch (error) {
    if (
      error instanceof Error &&
      // If the error code is ENOENT, do nothing. The file does not exist, and that's okay.
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      let message = error.message;
      throw new Error(`Failed to delete markdown file: ${message}`);
    }
  }
}

/* **************************************************
 * TESTS
 ************************************************** */
describe("Macro Loader", () => {
  let markdown: string;
  let expected: string;

  beforeEach(() => {
    markdown = "";
    expected = "";
    deleteTestMarkdownFile();
  });

  it("produces basic markdown - no macros", async () => {
    markdown = `start end`;
    expected = "<p>start end</p>\n";
    createTestMarkdownFile(markdown);
    const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
    expect(result).to.equal(expected);
  });

  it("inline macro, no arguments, no content", async () => {
    markdown = `start ^testNoArgumentsNoContent{} end`;
    expected = "<p>start testNoArgumentsNoContent end</p>\n";
    createTestMarkdownFile(markdown);
    const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
    expect(result).to.equal(expected);
  });

  it("inline macro, no arguments, content", async () => {
    markdown = `start ^testNoArguments{content} end`;
    expected = "<p>start testNoArguments content end</p>\n";
    createTestMarkdownFile(markdown);
    const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
    expect(result).to.equal(expected);
  });

  it("inline macro, argument, no spacing", async () => {
    markdown = `start ^testWithArgument(arg){content} end`;
    expected = "<p>start testWithArgument content arg end</p>\n";
    createTestMarkdownFile(markdown);
    const result = await parse(TEST_MARKDOWN_FILE, TEST_MACRO_FILE, "^");
    expect(result).to.equal(expected);
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
