# macro-md

## Description

macro-md is a markdown post-processor that allows users to embed macros into a markdown document. These macros are simply JavaScript functions that are evaluated after the initial markdown compilation.

## Motivation

Traditional markdown provides a way to rapidly create web content using a succinct and readable syntax. By design, authors are limited to only those HTML constructs that markdown is capable of producing.

Moreover, markdown offers no way to set HTML attributes that may be used in conjunction with CSS to style elements or in conjunction with scripts to identify elements.

macro-md seeks to extend the capabilities of vanilla markdown by providing a lightweight flexible text transformation tool that may be used along with the markdown compilation process.

## How it Works

Given the following...

```markdown
``demo{
# A

B **some text**.

C.
}
```

... we first compile the markdown inside of the curly braces then pass the resulting HTML to a user defined macro identified by "demo". The user defined macro may manipulate this content.

## Syntax

### Macro Parts:

- macro delimiter
- identifier - name of the macro
- argument list (optional)
- content

### Macro Formats:

- ` ``mac{ ` = macro with no args
- ` ``mac(a,b){ ` = macro with args
- ` ``mac(\*a){ ` = macro with indefinite array argument
- ` ``mac1 mac2(80){ ` = space delineated list of macro calls to be applied in left to right order.

\*Spacing does not matter:
- ` ``mac(a,b){ ` == ` mac(  a,b )  { `

\*Casing does matter.
- ` ``mac(a,b){ ` != `Mac(a,b){ `

## Examples 

### Use Cases

- ` ``insertDynamicStuff{} ` = insert some dynamic content
- ` ``^{...} ` = align the content center
- ` ``demo{...} ` = wrap the content in "demo" div
- ` ``+(my-class){...} ` = add a class to first html child node
- ` ``img(src,alt,width){...} ` = create an image element
- ` ``fig(src,alt,caption){...} ` = create a figure with caption.
- anything that can be done in JS!

## API

`macro-md` defines a single public entry point:

```typescript
export async function parse(
  markdownPath: string,
  macroPath: string,
  macroDelimiter: string
): Promise<string> {
```

## Macro File Format

- The macro file may be any file that can be loaded with the JavaScript's global `import` function.
- Functions that are to be used as macros must have a "macroIdentifier" property assigned to them. This serves as a link to the identifier for the macro. The user may use the exported `MACRO_IDENTIFIER` constant, or simply provide a string literal - we won't tell anyone ;)
- These functions must take a string as the first parameter. `macro-md` will always pass the content that is wrapped in curly braces into this argument. Whether to use this argument is up to the user.
- Additional arguments for user defined macros are optional.

_Example Macro Definition_

```javascript
export function wrap(content, wrapper) {
  return `${wrapper}${content}${wrapper}`;
}
wrap[MACRO_IDENTIFIER] = "wrap";
```

_Macro Call_

```markdown
This is some ``wrap(!){wrapped inline} content.

``wrap(!){
I'm wrapped block content
}
```
_Result_

```html
<p>This is some !wrapped inline! content.</p>

<p>I'm wrapped block content</p>
```

## Nested Macros

Macros may be nested, allowing for modular design:

TODO: example

When the parser encounters an opening curly brace for the macro content it will then search for a corresponding closing curly brace, ignoring any pairs encountered along the way. If no closing brace is found a xxxx error is thrown.

## Issue Reporting

...todo...

## Links and References

- Markdown spec: https://commonmark.org/

- Markdown tester: https://spec.commonmark.org/dingus/

- markedjs package source: https://github.com/markedjs/marked

- markedjs highlighting package source: https://github.com/markedjs/marked-highlight
