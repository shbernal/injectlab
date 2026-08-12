# Use policy

injectlab fabricates convincing press coverage and social posts attributed to real
organisations. That is normal and necessary for crisis exercises, and it is also the raw
material of a real hoax. This page is the long form of the position, stated plainly rather
than buried, because the design decisions below only make sense once the tension is named.

## What this is for

Authorised exercises, run with informed exercise controllers, under the usual exercise-safety
conventions. The `EXERCISE, EXERCISE, EXERCISE` framing goes on every artefact and on every
message carrying one, exactly as it does for a radio drill. Everyone who might see an artefact
should already know an exercise is running.

## What the tool does about it

**The disclaimer is on by default.** Every rendered asset carries a visible
`[EXERCISE, EXERCISE, EXERCISE]` banner, at the top and at the bottom. Two bands, not one,
because the realistic way an asset loses its framing is someone screenshotting the interesting
half out of an email, and the second band survives that.

`--disclaimer none` exists for designers who compose their own framing around the asset.

**The embedded provenance is not switchable.** Every PNG carries `tEXt` metadata saying:

```
Software           injectlab <version>
Comment            SYNTHETIC EXERCISE MATERIAL. Not a real publication.
                   Generated for a crisis exercise.
injectlab.kind     news, x-post, ...
injectlab.source   the outlet or platform id
```

This is written whether or not the visible bands are. The band serves the person looking at
the asset; the metadata serves whoever finds the file six months later with no idea where it
came from. Read it back with any PNG metadata tool, or `readProvenance` from
`@injectlab/core`.

**Marks and typefaces are approximations, never the real assets.** Outlets set their pages in
licensed typefaces and head them with trademarked logos, and neither is in this repository in
any form. What ships is a set of open-licensed typefaces chosen for visual proximity, and
mastheads either set in those faces or redrawn as simplified SVG. The verification badge on a
post is a circle with a check, not the platform's own scalloped mark.

A spec may supply its own masthead, with `masthead.path` or `masthead.url`. That is for a mark
the exercise designer holds the rights to: their own organisation's newsroom, or a fictional
outlet somebody drew for them. It changes nothing about what ships, and it is not a way to make
a bundled outlet more convincing. Pointing it at a downloaded logo does not make that logo
yours, and this page is still the answer to whether that is a good idea.

Every outlet carries a `fidelity` note saying what it approximates, in plain words. Read them
with `inject outlets --verbose`. They are written while the theme is authored rather than
afterwards, so they record each compromise at the moment it was made.

**Nothing is fetched at render time.** No network request of any kind. Live pages are read
only by a dev-only capture tool, only to inform a person or an agent authoring a theme, and
what it captures is never redistributed.

One thing can now reach the network, and it is deliberately not at render time.
`masthead.url` is fetched by the CLI before composing and embedded as a `data:` URI, so the
composed document is still self-contained and the browser still issues no request. It requires
`--allow-remote` from whoever runs the render, not from whoever wrote the spec, because those
are often different people. A URL also gives up the determinism guarantee, which is stated
plainly in `docs/spec-format.md` rather than buried.

## What will not be built

**No feature whose only purpose is to make an artefact harder to identify as synthetic.** If a
request amounts to removing the traces, the answer is no. Concretely, and not as an exhaustive
list:

- No option to strip the embedded provenance.
- No mode that reproduces a real masthead or a licensed typeface exactly.
- No generation of assets naming a real named individual as the author or the subject.
- No "make it look older" or metadata-forging features.

Improving fidelity by fetching the real logo or the real font is not an improvement. It is the
single change the whole arrangement exists to prevent.

## Practical advice for exercise designers

- **Use fictional company names**, as every demo and every example in this repository does.
  The moment an artefact names a real organisation, the cost of it escaping the exercise stops
  being yours.
- **Keep the bands on** unless you are placing the asset inside framing you control end to
  end, in a document that is itself marked.
- **Do not post artefacts anywhere public**, including internal channels that outlive the
  exercise, without the framing attached.
- **Delete the asset folder when the exercise is over.** They are cheap to regenerate from the
  specs, which is the reason the specs are the artefact worth keeping.
