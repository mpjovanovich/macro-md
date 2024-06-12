# macro-md


## Description

macro-md allows users to embed macros into a markdown document that may be used to transform compiled markdown. These macros are simply JavaScript functions, and macro-md is the glue code that binds them to their textual tokens.


## Motivation 

Traditional markdown provides a way to rapidly create web content using a succinct and readable syntax; however, authors are limited to only those HTML constructs that markdown is capable of producing.

Moreover, markdown offers no way to set HTML attributes that may, for example, be used in conjunction with CSS to style elements or in conjunction with scripts to identify elements. 

macro-md seeks to alleviate these problems by providing a lightweight flexible text transformation tool that may be used in the markdown compilation process. 


## How it Works

Given the following...

```markdown

``demo{

# A

B **some text**.

C.

}

```
 
... we first compile the markdown inside of the curly braces, optionally running it through a highlighter after this, then pass it to a user defined macro identified by "demo" to transform the HTML output.


## Syntax

### Macro Parts: 

- macro delimiter
- identifier - name of the macro
- argument list (optional)
- content
  
### Macro Formats: 

  - ``mac{ = macro with no args
  - ``mac(a,b){ = macro with args
  - ``mac(*a){ = macro with indefinite array argument
  - ``mac1 mac2(80){ = Text between the macro delimiter and the opening curly brace is treated as a space delineated list of macro calls on the following content to be applied in left to right order.

\*Spacing does not matter.

\*Casing does matter.


## Examples 

TODO: examples

- Adding CSS class to elements by modifying the class attribute
- Adding id attributes to elements for use with scripts
- Wrapping several elements in a container
- Transforming text node

- ``< = align left
- ``> = align right
- ``^ = align center 
- ``demo = add class named demo.
- ``+(demo) = add class passed in as arg, "demo"
- ``img(src,alt,width){} = create image element
- ``fig(src,alt,caption){} = create a figure with caption.
- anything that can be done in JS!

## API

The user must define: 

- source file path
- macro file path

The user may define:

- macro_delimiter (default=``)
- use_highlighting (default=true)
- highlighter (default=pygmentize)
- max_depth (default=10) - depth of nested macros

As requirements change code wrapped in macros may be modified in a consistent way. 

Multiple output formats may also be obtained by passing in different macro scripts.

TODO: example


## Macro File Format

The macro file may contain any code that can run within the Node.js ecosystem, and must adhere to the following format:

TODO: skeleton 

The identifier may be any string, including the empty string. 

TODO: Content... Similar to react special prop for children. Can't remember what this is, see demos.

  SIMPLE EXAMPLE

  example 

  PARSE5 EXAMPLE 

  example 


## Nested Macros

Macros may be nested, allowing for modular design:

TODO: example

When the parser encounters an opening curly brace for the macro content it will then search for a corresponding closing curly brace, ignoring any pairs encountered along the way. If no closing brace is found a xxxx error is thrown.


## Full Demo Application

...todo...


## Issue Reporting

...todo...


## Links and References 

- Markdown spec: https://commonmark.org/

- Markdown tester - useful for learning markdown and checking rendering of tokens: https://spec.commonmark.org/dingus/

- markedjs package source: https://github.com/markedjs/marked

- markedjs highlighting package source: https://github.com/markedjs/marked-highlight

