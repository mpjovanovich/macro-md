# macro-md

## Description

`macro-md` is a markdown post-processor that allows users to embed macros into a markdown document. These macros are simply JavaScript functions that are evaluated after the initial markdown compilation.

## Motivation

Traditional markdown provides a way to rapidly create web content using a succinct and readable syntax. By design, authors are limited to only those HTML constructs that markdown is capable of producing.

Moreover, markdown offers no way to set HTML attributes that may be used in conjunction with CSS or scripts to identify elements.

`macro-md` seeks to extend the capabilities of vanilla markdown by providing a lightweight flexible text-transformation tool that is integrated with the markdown compilation process.

Macros may be embedded into the markdown using the provided syntax (more below). The compiled markdown will then be passed to the macro:

```markdown
``demo{
# A

B **some text**.

_C._
}
```

## Use Cases

- `^insertDynamicStuff{}` = insert some dynamic content
- `^{...}` = align the content center
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
- `^mac1 mac2(80){` = space delineated list of macro calls, applied in left to right order.

Spacing does not matter:
- `^mac(a,b){` == ` ^ mac(  a,b )  {`

Casing does matter.
- `^mac(a,b){` != `^Mac(a,b){`

### Nested Macros

Macros may be nested, allowing for modular design:

```markdown
^macro1{ Do ^macro2{some} stuff. }
```

### Inline vs Block Macros

`macro-md` is a markdown post-processor, so content supplied to the macros is HTML. The context of a macro determines whether the returned is treated as inline or block content. A Macro that is preceded and followed by a line break is a block level macro. Anything else is an inline macro.

## API

### Functions

`macro-md` defines a single public entry point - the `parse` function:

```typescript
export async function parse(
  markdownPath: string,
  macroPath: string,
  macroDelimiter: string
): Promise<string> {
```

### Macro File Format

- The macro file may be any file that can be loaded with the JavaScript's global `import` function.
- Functions that are to be used as macros must have a "macroIdentifier" property assigned to them. This serves as a link to the identifier for the macro. The user may use the exported `MACRO_IDENTIFIER` constant, or simply provide a string literal - we won't tell anyone ;)
- These functions must take a string as the first parameter. `macro-md` will always pass the content that is wrapped in curly braces into this argument. Whether to use this argument is up to the user.
- Additional arguments supplied to user defined macros are optional.

## Usage Example

_API Call_

```javascript
import { parse } from 'macro-md';

const processedMarkdown = await parse(
  '/path/to/markdown.md',
  '/path/to/macros.js',
  '^'
);
```

_Macro Definition_

```javascript
export function wrap(content, wrapper) {
  return `${wrapper}${content}${wrapper}`;
}
wrap[MACRO_IDENTIFIER] = "wrap";
```

_Macro Call_

```markdown
This is some ^wrap(!){wrapped inline} content.

^wrap(!){

I'm wrapped block content

}
```
_Result_

```html
<p>This is some !wrapped inline! content.</p>

!<p>I'm wrapped block content</p>!
```

## Issue Reporting

Issues may be reported on the [GitHub Issues](https://github.com/mpjovanovich/macro-md/issues) page.

## Links and References

- [Markdown spec](https://commonmark.org/)
- [Markdown tester](https://spec.commonmark.org/dingus/)
- [markedjs package source](https://github.com/markedjs/marked)
- [markedjs highlighting package source](https://github.com/markedjs/marked-highlight)
