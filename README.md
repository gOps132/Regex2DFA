# Regex2DFA

## Regex to DFA Converter

A quickly vibecoded, interactive tool for converting regular expressions into deterministic finite automata (DFAs).

## Features

- Converts a regular expression into an abstract syntax tree (AST), a Thompson ε-NFA, a powerset DFA, and a minimized DFA.
- Visualizes the generated state machine with draggable states, zoom controls, and optional NFA-subset labels.
- Switches between the direct powerset DFA and the canonical minimized DFA.
- Simulates input strings step by step, highlighting the active state and transition and reporting whether the string is accepted or rejected.
- Generates sample accepted and rejected strings for quick verification.
- Displays the DFA transition table and formal 5-tuple `(Q, Σ, δ, q₀, F)`.
- Shows each stage of the conversion pipeline, including Thompson construction, subset construction, and Hopcroft minimization.
- Includes presets for common regular languages and validates regex syntax as you type.
- Exports the automaton as an SVG diagram, JSON machine definition, or LaTeX/TikZ code.

## Supported Regex Syntax

- Union: `+` or `|`
- Concatenation: implicit, as in `ab`
- Kleene star: `*`
- Grouping: `( ... )`
- Empty string: `e` or `ε`
- Empty set: `Ø` or `∅`

## Run Locally

```bash
bun install
bun run dev
```

Then open `http://localhost:3000`.

## Note

This tool is intended to support learning, not replace it. Doing it yourself before using this tool to check your work is highly recommended.

