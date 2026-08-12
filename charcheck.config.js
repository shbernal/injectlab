/**
 * charcheck, run against injectlab.
 *
 * The banned characters are built from their code points rather than written literally, for
 * the reason charcheck's own config gives: a literal here would be a finding in the file
 * that defines the rule against it.
 *
 * The scratch plan directory is not in any include glob, deliberately. It is working memory
 * and it is going to be deleted.
 */

const cp = (codePoint) => String.fromCodePoint(codePoint);

const DASHES = [cp(0x2014), cp(0x2015)];

const INVISIBLES = [
  cp(0x00ad), // soft hyphen
  cp(0x200b), // zero width space
  cp(0x200c), // zero width non-joiner
  cp(0x200d), // zero width joiner
  cp(0x200e), // left-to-right mark
  cp(0x200f), // right-to-left mark
  cp(0x2060), // word joiner
];

/** Written by tooling, never by hand. */
const GENERATED = ['dist/**', 'coverage/**', 'out/**', 'pnpm-lock.yaml'];

/** Captured third-party pages, kept out of git and read only while authoring an outlet. */
const REFERENCES = ['.references/**'];

const REWORD = 'Use a comma, a colon, or reword.';

export default {
  rules: [
    {
      // Prose a reader sees, not the shell commands and config snippets inside it.
      id: 'no-em-dash-in-prose',
      chars: DASHES,
      scope: 'markdown',
      message: REWORD,
      include: ['README.md', 'AGENTS.md', 'docs/**/*.md', 'packages/*/README.md'],
    },
    {
      // Text that can reach a reader, which for this project includes every headline,
      // standfirst and byline the renderer emits. Comments are left alone.
      id: 'no-em-dash-in-rendered-text',
      chars: DASHES,
      scope: 'strings',
      message: REWORD,
      include: ['packages/*/src/**/*.ts'],
    },
    // A `no-em-dash-in-demos` rule over `demos/**/*.{yaml,yml,json}` belongs here as soon as
    // there are demo specs. It is left out while the directory is empty, because charcheck
    // reports a rule that matches nothing, and a standing warning trains you to ignore
    // warnings.
    {
      id: 'no-invisibles',
      chars: INVISIBLES,
      message: 'Invisible character. Delete it.',
      // The second pattern is not redundant: dotted directories are only scanned when a
      // pattern names them, so the workflows would otherwise go unchecked.
      include: ['**/*.{ts,js,md,json,yaml,yml}', '.github/**/*.yml'],
      exclude: [...GENERATED, ...REFERENCES],
    },
    {
      id: 'no-em-dash-in-commit-msg',
      chars: DASHES,
      message: REWORD,
      include: ['<commit-msg>'],
    },
  ],
  ignore: [...GENERATED, ...REFERENCES],
};
