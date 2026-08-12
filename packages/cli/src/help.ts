/**
 * Help text.
 *
 * Every example is copy-pasteable and every company in one is fictional. Someone reading the
 * help of a tool that fabricates press coverage should not find a real organisation's name in
 * the first thing they see.
 */

export const RENDER_FLAGS = `
Render flags (shared by demo, news and render):
  --out <path>              file for one result, directory for many. Default: out
  --format png|html         html writes the composed document instead. Default: png
  --scale 1|2|3             device pixel ratio. Default: 2
  --variant desktop|mobile|card
  --disclaimer <text|none>  banner text. Default: [EXERCISE, EXERCISE, EXERCISE]
                            'none' omits the bands. Embedded PNG provenance is not affected.
  --disclaimer-style bold|band|quiet
                            how it is drawn. Default: bold
                              bold   red wording, no fill, top of the asset only
                              band   yellow band with red rules, top and bottom. The loudest,
                                     and the only one that survives a crop of the first line.
                              quiet  small grey letters over a hairline, top only
  --chars error|warn|off    what to do about banned characters. Default: error
  --allow-remote            permit fetching a masthead a spec names by URL. Off by default,
                            so rendering someone else's spec does not reach a host they chose.
  --json                    machine-readable result on stdout
  --quiet                   suppress progress output
`.trim();

export const MAIN = `
inject, generator of crisis-exercise stimuli

Usage:
  inject <command> [options]

Commands:
  demo                  render the built-in demo specs. Needs no arguments and no files.
  news                  render one article from flags
  render <spec...>      render one or more spec files
  outlets               list the outlets this build knows about
  init [file]           write a commented starter spec
  doctor                check that this machine can render

Run 'inject <command> --help' for the flags of one command.

Every generated asset carries an [EXERCISE, EXERCISE, EXERCISE] banner unless it is turned
off. --disclaimer-style band draws it at its loudest, top and bottom. Every PNG also carries
embedded metadata marking it as synthetic exercise material, and that is not switchable.
`.trim();

export const DEMO = `
inject demo, render the built-in demo specs

Usage:
  inject demo [--out <dir>]

The quickest way to see what this produces. One article per outlet, written into ./out by
default. Requires no spec file and no arguments.

Example:
  inject demo --out ./exercise-assets

${RENDER_FLAGS}
`.trim();

export const NEWS = `
inject news, render one article from flags

Usage:
  inject news --outlet <id> --headline <text> [options]

Required:
  --outlet <id>             see 'inject outlets'
  --headline <text>

Optional content:
  --standfirst <text>       the deck under the headline
  --byline <text>           the reporter's name, without 'By'
  --section <text>          defaults to the outlet's own default
  --published-at <iso>      ISO 8601 with an offset. Defaults to now, and says so.
  --url <url>               shown where a layout has an address bar
  --image <path>            local file, embedded into the page

Example:
  inject news --outlet bbc \\
    --headline "Northwind Logistics hit by ransomware, deliveries halted" \\
    --standfirst "The haulier says its depots are running on paper." \\
    --byline "Helen Morrow" \\
    --out ./out

${RENDER_FLAGS}
`.trim();

export const RENDER = `
inject render, render spec files

Usage:
  inject render <spec...> [options]

Reads YAML or JSON. A file may hold one inject or a top-level 'injects:' list. Unlike
'inject news', publishedAt is required in a file: a spec file is meant to reproduce.

Example:
  inject render exercise/*.yaml --out ./exercise-assets --json

${RENDER_FLAGS}
`.trim();

export const OUTLETS = `
inject outlets, list the outlets this build knows about

Usage:
  inject outlets [--verbose] [--json]

--verbose adds each outlet's fidelity note, which says what is approximated and what is not
the real asset. Worth reading before sending an artefact to anyone.
`.trim();

export const INIT = `
inject init, write a commented starter spec

Usage:
  inject init [file]

Defaults to inject.yaml in the working directory. Refuses to overwrite an existing file.
`.trim();

export const DOCTOR = `
inject doctor, check that this machine can render

Usage:
  inject doctor

Checks the Node version and whether a Chromium build is installed, and prints the command to
install one if it is not. This is the most likely first-run failure.
`.trim();

export const COMMAND_HELP: Record<string, string> = {
  demo: DEMO,
  news: NEWS,
  render: RENDER,
  outlets: OUTLETS,
  init: INIT,
  doctor: DOCTOR,
};
