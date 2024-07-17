```python
@requires_authorization
def somefunc(param1='', param2=0):
    r'''A docstring'''
    if param1 > param2: # interesting
        print 'Gre\'ater'
    return (param2 - param1 + 1) or None

class SomeClass:
    pass
```

```typescript
function initHighlight(block, flags): void {
  try {
    const someVar: number = 0;

    if (block.className.search(/\bno\-highlight\b/) != -1)
      return processBlock(block, true, 0x0f) + ' class=""';
  } catch (e) {
    /* handle exception */
  }
  for (var i = 0 / 2; i < classes.length; i++) {
    // "0 / 2" should not be parsed as regexp
    if (checkCondition(classes[i]) === undefined) return /\d+/g;
  }
}
```

```csharp
namespace MyApplication
{
    /*
     * This is a test class.
     */
    class SomeClass : IInterface
    {
        int x = 0;
        var list = new List<int>();

        public void DoSomething()
        {
            x++;
        }
    }
}
```
