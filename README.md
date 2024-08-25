# macro-md

## Table of Contents

- [macro-md](#macro-md)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Motivation](#motivation)
  - [Installation](#installation)
  - [Example Usage](#example-usage)
  - [Use Cases](#use-cases)
  - [Syntax](#syntax)
    - [Macro Parts:](#macro-parts)
    - [Macro Formats:](#macro-formats)
    - [Nested Macros](#nested-macros)
    - [Inline vs Block Macros](#inline-vs-block-macros)
  - [API](#api)
    - [Functions](#functions)
    - [Macro File Format](#macro-file-format)
  - [Issue Reporting](#issue-reporting)
  - [Links and References](#links-and-references)

## Description

`macro-md` is a markdown post-processor that allows users to embed macros into a markdown document. These macros are simply JavaScript functions that are evaluated after the initial markdown compilation.

## Motivation

Traditional markdown provides a way to rapidly create web content using a succinct and readable syntax. By design, authors are limited to only those HTML constructs that markdown is capable of producing.

`macro-md` seeks to extend the capabilities of vanilla markdown by providing a lightweight flexible text-transformation tool that is integrated with the markdown compilation process.

Macros may be embedded into the markdown using the provided syntax. The compiled markdown will then be passed to the macro:

## Installation

`macro-md` is available as an npm package. To install, run:

```bash
npm install macro-md
```

## Example Usage

_Macro Definition_

```javascript
// macro.js
// Your macros go here.
export function wrap(content, wrapper) {
  return `${wrapper}${content}${wrapper}`;
}
wrap[MACRO_IDENTIFIER] = "wrap";
```

_API Call_

```javascript
import { parseFile } from "macro-md";

// Path to your JavaScript macro file
const macroFilePath = "./macro.js";

// Example markdown with embedded macro
const markdown = `
This is some wrapped ^wrap(!){_inline_} content.

^wrap(!){

I'm wrapped **block** content

}`;

// macro-md API call
const html = await parseString(markdown, macroFilePath, {
  macroDelimiter: "~~",
  useGitHubStyleIds: true,
  useHighlightJS: true,
});
```

_Result_

<!-- prettier-ignore-start -->
```html
<p>This is some wrapped !<em>inline</em>! content.</p>
!<p>I&#39;m wrapped <strong>block</strong> content</p>!
```
<!-- prettier-ignore-end -->

## Use Cases

- `^insertDynamicStuff{}` = insert some dynamic content
- `^C{...}` = align the content center
- `^demo{...}` = wrap the content in "demo" div
- `^+(my-class){...}` = add a class to first html child node
- `^fig(src,alt,caption){...}` = create a figure with caption.
- anything that can be done in JS!

## Syntax

### Macro Parts:

- macro delimiter
- identifier - name of the macro
- argument list (optional)
- content

### Macro Formats:

- `^mac{` = macro with no args
- `^mac(a,b){` = macro with args
- `^mac1 mac2(80){` = space delineated list of macro calls, applied in innermost to outermost order; `mac2` before `mac1`.

Spacing does not matter:

- `^mac(a,b){` == ` ^ mac(  a,b )  {`

Casing does matter.

- `^mac(a,b){` != `^Mac(a,b){`

### Nested Macros

_Note: This feature works for simple scenarios, as in the below, but is quite buggy once nesting gets complex. It will require a major release to fix related issues._

Macros may be nested, allowing for modular design:

```markdown
^macro1{ Do ^macro2{some} stuff. }
```

### Inline vs Block Macros

`macro-md` is a markdown post-processor, so content supplied to the macros is HTML. The context of a macro determines whether the returned is treated as inline or block content. A Macro that is preceded and followed by a line break is a block level macro. Anything else is an inline macro.

## API

### Functions

`macro-md` defines two public entry points - the `parseFile` and `parseString` functions:

```typescript
export async function parseFile(
  markdownPath: string,
  macroPath: string,
  options: Partial<MacroMDOptions> = defaultOptions
): Promise<string> {
```

```typescript
export async function parseString(
  markdown: string,
  macroPath: string,
  options: Partial<MacroMDOptions> = defaultOptions
): Promise<string> {
```

Additional options may be specified in the `MacroMDOptions` object:

```typescript
const defaultOptions: MacroMDOptions = {
  macroDelimiter: "^", // The character(s) that denote the start of a macro
  useGitHubStyleIds: false, // Whether to use GitHub style header ids
  useHighlightJS: false, // Whether to use highlight.js for code blocks
};
```

### Macro File Format

- The macro file may be any file that can be loaded with the JavaScript's global `import` function.
- Functions that are to be used as macros must have a "macroIdentifier" property assigned to them. This serves as a link to the identifier for the macro. The user may use the exported `MACRO_IDENTIFIER` constant, or simply provide a string literal - we won't tell anyone ;)
- These functions must take a string as the first parameter. `macro-md` will always pass the content that is wrapped in curly braces into this argument. Whether to use this argument is up to the user.
- Additional arguments supplied to user defined macros are optional.

## Issue Reporting

Issues may be reported on the [GitHub Issues](https://github.com/mpjovanovich/macro-md/issues) page.

## Links and References

- [Marked Demo](https://marked.js.org/demo). Not integrated with macro-md; included here for general markdown orientation.
- [Marked Source](https://github.com/markedjs/marked). Source code for the excellent markdown parsing library.
