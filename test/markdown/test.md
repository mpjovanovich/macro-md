<p class="demo">Demo:</p>

Logic.ly

~~fig{images/basic_logic_gates.png}

## Circuits

We can combine logic gates to create **circuits**.

These circuits can do things like:

- Arithmetic (addition, subtraction, etc.)
- Comparison (greater than, less than, equal)
- Memory storage
- ...

### Comparing Values

A **magnitude comparator** is a type of combinational circuit that compares two numbers.

~~exercise{

#### One bit magnitude comparator:

~~fig{images/one_bit_magnitude_comparator.png}

[One Bit Magnitude Comparator - Logicly](https://github.com/mpjovanovich/ivy_tech/blob/main/SDEV120_Computing_Logic/one_bit_magnitude_comparer.logicly)

**Problem 1:**

Assume that A = 1, B = 1.

For each output:

a) Translate the circuit into a boolean expression.
b) Plug the above values into the circuit and solve.

_Hint:_ Remember your truth tables and the fact that 1 = true and 0 = false.

~~summary( Output: A < B ) {

**a)**

- ¬A ∧ B

**b)**

- 0 ∧ 1 = False

}

~~summary( Output: A > B ) {

- A ∧ ¬B
- 1 ∧ 0 = False

}

~~summary( Output: A = B ) {

- ¬( (¬A ∧ B) ∨ (A ∧ ¬B) )
- A ∨ ¬B ∧ ¬A ∨ B
- A ∨ (¬B ∧ ¬A) ∨ B
- 1 ∨ (0 ∧ 0) ∨ 1
- 1 ∨ 0 ∨ 1 = True

}

**Problem 2:**

What is the boolean expression for the output of the circuit?

}
