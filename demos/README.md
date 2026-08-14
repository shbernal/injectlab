# Demo specs

One scenario, five files. Northwind Logistics is fictional, as is every company named in any
of these files.

Render them all:

```bash
inject render demos/*.yaml --out ./out
```

Or render the same set with no files at all, which is what `inject demo` does.

| File                          | What it is                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| `bbc-ransomware.yaml`         | the UK broadsheet article: depots offline, regulator notified         |
| `lemonde-cyberattaque.yaml`   | the French daily, on a separate incident at a fictional energy group  |
| `20minutes-cyberattaque.yaml` | the same French incident an hour later, in the freesheet register     |
| `lesechos-cyberattaque.yaml`  | the same incident again at midday, read off the share price           |
| `x-rumour-thread.yaml`        | the rumour chain that ran three hours before the article, as a thread |

The set is deliberately one scenario rather than five unrelated samples. That is both a better
demonstration and a better template: an exercise is a sequence of stimuli about one event, and
the shape of that sequence is most of the work.

A reasonable order to release them into an exercise is the order they were written in the
scenario, not the order above: the rumour thread first, at 07:05, then the article at 09:14
once the company has said something.

The three French files are the same incident covered three times, at 10:40, at 11:25 and at
12:10. Rendered side by side they are the cheapest demonstration of what an outlet record
actually does: the copy differs by a sentence or two, and the pages do not look remotely
alike. The Les Echos file also shows the other half of it, which is that a business daily
picks different facts out of the same event: a cost per week and a share price where the
other two have a communiqué.

## Editing these

Copy one, change the fields, render it. Every field is documented in
[`docs/spec-format.md`](../docs/spec-format.md), and `inject init` writes a commented starter
if you would rather begin from scratch.

Two rules the tool enforces rather than suggests:

- `publishedAt` and `postedAt` need an offset. Without one they would be read against whatever
  time zone the rendering machine happened to be in, and the same spec would produce different
  assets.
- No em dashes or invisible characters in any text that reaches the page. The render stops and
  tells you the field, the position and a suggested rewrite.
