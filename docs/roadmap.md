# Roadmap

Organised, not planned. Nothing here is committed to, and the order is not a queue. It exists
so that "could injectlab do X" has an answer other than a shrug.

## Known gaps in the spec model

Small, real, and each one noticed by comparing the model against how exercise designers
actually write stimuli.

- **`updatedAt`.** The biggest one. A crisis exercise runs on a story being _updated_, and a
  follow-up inject that reuses a headline with a new "Updated 14:02" line is one of the most
  natural things a designer wants. There is currently no way to express it.
- **Per-post times in a thread.** `thread` is a list of strings, so every post in one shares
  the inject's timestamp. This is the same underlying gap as `updatedAt`: one time per inject,
  where both cases want one per unit of content. Worth fixing together.
- **A subscriber flag.** The French daily layout shows its subscriber marker on every article,
  because it is layout furniture rather than a spec field. It should be neither always on nor
  always off.
- **`readTime`.** "5 min read". Cheap furniture whose absence is noticeable.
- **A kicker separate from the section.** Prior art keeps the two apart.

There is also no command that prints a platform's fidelity note. `inject outlets --verbose`
covers publications only, and X has one worth reading.

## More outlets

- **France**: Les Echos, Le Figaro, France Info, BFM TV, L'Usine Digitale, Le Parisien.
- **UK**: The Guardian, The Times, Financial Times, Sky News, The Register.
- **Germany**: Der Spiegel, Handelsblatt, FAZ, Heise.
- **US**: The New York Times, The Wall Street Journal, Reuters, Bloomberg, TechCrunch,
  BleepingComputer, Krebs on Security.
- **Sector and trade press**, which is often what actually breaks a cyber story first.
- Per-outlet mobile variants, once the desktop set is broad.

The third outlet was meant to settle whether a layout family is reusable or merely fits the
outlet it was written for. It did not: 20 Minutes brought a third family, `fr-online-freesheet`,
because a freesheet leads with a band of brand colour where a daily centres a wordmark over a
rule, and no amount of theme data turns one into the other. What it did settle is smaller and
still useful. The theme model absorbed the difference in everything below the arrangement,
gaining one field (`colors.onAccent`) and one date convention, and neither existing layout was
touched. The question moves to the fourth outlet, which should be a second daily.

## More channels

- **Telegram**: channel posts and forwarded-message views.
- **Leak-site pages**: the countdown-and-sample-data page a group publishes about a victim.
  The highest-value and by some distance the highest-sensitivity item here. The use policy is
  a blocking design input for it, not a footnote.
- **LinkedIn**: employee and executive posts, plus a company page statement.
- **Mastodon and Bluesky**, cheap once X exists.
- **Regulator and CERT bulletins**: ANSSI, CISA, NCSC, and a generic national-CERT layout.
- **Internal channels**: Slack and Teams message views, and a plain corporate email screenshot.
- **Broadcast**: a TV news lower-third still, and a radio or podcast transcript card.

## Output and workflow

- **A scenario file.** One document describing a whole exercise timeline, each inject carrying
  its release time, rendering the full asset set plus a chronogram in one command. This is the
  feature that turns an asset generator into an exercise builder, and it is the most likely
  thing to be built next.
- PDF output, and a press-clipping page combining several assets.
- Video: a scrolling article capture, a breaking-news ticker loop.
- Handing rendered assets straight to email drafts, or writing one `.eml` per inject.
- Deterministic randomisation: a seed, plus generators for plausible bylines, bodies and
  metrics.
- An assisted content mode that drafts a headline and standfirst from a scenario summary, with
  the character gate and the outlet's editorial conventions applied. Optional, off by default,
  and never required to use the tool.

## Engineering

- **A second render backend** (satori plus resvg) for the layouts that do not need a browser,
  removing the Chromium download for the common case. The `Renderer` interface exists for
  exactly this and should not grow before then.
- A visual regression harness that pins a Chromium build and compares stored PNGs, on one
  operating system only. The current tests deliberately never assert pixels.
- Publishing, with release automation.
- A documentation site with a live spec editor and a gallery of outlets. The gallery must carry
  the same disclaimer discipline as the tool itself.
- A `charcheck` preset exported for consumers, so a team can enforce these character rules on
  their own scenario repository.
- Anything that measurably lowers the cost of adding the twentieth outlet, once ten exist and
  the real cost is known rather than guessed.
