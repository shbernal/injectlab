# A worked example

A small cyber crisis exercise, from scenario to a folder of assets ready to attach to exercise
emails. Half an hour, most of it writing the copy.

Northwind Logistics is fictional. So is every other company here. Use fictional names in your
own exercises too: the moment an artefact names a real organisation, the cost of it escaping
the exercise stops being yours.

## The scenario

A haulier's depot systems go down overnight. It looks like an outage, turns out to be
ransomware, and the story escapes before the company has said anything. The crisis cell finds
out from a trade account on X, not from its own monitoring.

Three stimuli, released in this order:

| Time  | Inject                                        | What it does to the cell                         |
| ----- | --------------------------------------------- | ------------------------------------------------ |
| 07:05 | a trade account posts a rumour                | they learn something is wrong from outside       |
| 08:40 | the same account escalates it to "ransomware" | pressure to say something before they know       |
| 09:14 | a national broadcaster runs it                | the window for a controlled statement has closed |

## The specs

One directory, next to the scenario document, committed with it.

```
exercise-northwind/
  01-rumour.yaml
  02-broadcast.yaml
```

`01-rumour.yaml`, the thread. Two posts in one image, because that is how the cell would see
it:

```yaml
kind: x-post
author:
  name: Freight Watch UK
  handle: freightwatchuk
  verified: grey
postedAt: 2026-08-12T07:05:00Z
text: Hearing Northwind Logistics depots have been down since about 4am. Drivers being turned away at Daventry and Warrington. Anyone else seeing this?
thread:
  - 'Update: a second source says it is a ransomware incident, not a systems outage. Northwind have not said anything publicly yet.'
metrics:
  replies: 184
  reposts: 1240
  likes: 3820
  views: 412000
```

`02-broadcast.yaml`, the article:

```yaml
kind: news
outlet: bbc
section: Technology
headline: Northwind Logistics hit by ransomware, deliveries halted across the UK
standfirst: The company said it had taken systems offline as a precaution and was working with the National Cyber Security Centre.
byline: Technology reporter
publishedAt: 2026-08-12T09:14:00+01:00
body:
  - Northwind Logistics has taken its depot systems offline after what it described as a significant ransomware attack.
  - The regulator confirmed it had been notified and said it was in contact with the company.
```

## Building it

```bash
inject render exercise-northwind/*.yaml --out ./exercise-northwind/assets
```

```
wrote exercise-northwind/assets/01-x-freightwatchuk-hearing-northwind-logistics.png 1280x612
wrote exercise-northwind/assets/02-bbc-northwind-logistics-hit-by-ransomware.png 2400x1768
```

Attach each PNG to the exercise email that releases it, at the time in the table.

## Changing it

This is the part a browser tool cannot do. Someone decides the exercise should hit
manufacturing rather than logistics. Edit the two headlines, rerun the one command, and every
asset is regenerated and consistent. Nothing is redrawn by hand and nothing is left stale.

The same applies to running the exercise twice for two audiences with different company names:
copy the directory, change the name, rebuild.

## Iterating on a layout

`--format html` writes the composed document instead of screenshotting it, and launches no
browser:

```bash
inject render exercise-northwind/02-broadcast.yaml --format html --out ./preview
```

Open it, adjust, rerun. It is also the right thing to attach to a bug report.

## Checking before you send

```bash
inject outlets --verbose
```

Read the fidelity note for the outlet you used. It says what is approximated and what is not
the real asset, which is the thing you want to have read before an artefact leaves your
machine.

Every PNG also carries embedded metadata marking it as synthetic exercise material, whether or
not the visible banner is on. See [`use-policy.md`](./use-policy.md).

## Driving it from an agent

`--json` puts one object on stdout and every diagnostic on stderr:

```bash
inject render exercise-northwind/*.yaml --out ./assets --json
```

```json
{
  "ok": true,
  "outputs": [
    {
      "path": "assets/01-x-...png",
      "kind": "x-post",
      "source": "x",
      "bytes": 156163,
      "width": 1280,
      "height": 924
    }
  ],
  "findings": []
}
```

Exit codes are worth branching on: `3` means a banned character in the copy, which is a fault
in the prose rather than in the tooling, and the findings name the field and suggest a
rewrite. `4` means the spec did not validate. `2` means the command was wrong.
