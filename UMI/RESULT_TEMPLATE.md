# A template for every UMI result

Use one result card for one finding. The headline and figure carry the message.
Executive selects twelve examples for readers new to the topic. Technical retains
the complete collection, methods, controls, and integration notes. Both views use
the same figures and source data.

## Preserve coverage

Keep every existing result and its controls in Technical. Executive shows a
curated selection with one primary figure per example; it does not delete or
replace the full experiment. Every Executive card links to the complete Technical
version. Keep stable section links and the three groups: brains and behavior,
inspection and intervention, and robotics. A direct link to an unfeatured result
opens Technical automatically.

`catalog.js` adapts the original experiment sections to this structure without
replacing their figures or controls. `results.js` adds source-backed result cards.

## Executive caption

Place the caption immediately below the headline, before the figure. Use about
45–75 words to explain three things without assuming scientific background:

1. What was done: the model, task, and comparison in everyday language.
2. What the reader sees: what rows, bars, lines, or colors represent.
3. What it means: the supported finding or capability, with any essential limit.

Define unfamiliar terms in context. Keep test-policy and schematic limitations
visible. Put detailed methods in the linked full experiment. `executive.js`
selects the examples and moves the existing figure between views; it does not
copy data or create a second chart.

## Full Technical card

1. **Evidence label:** recorded brain response, model prediction, prediction
   accuracy, measured behavior, model activity, or integration test.
2. **Headline:** one finding or capability, usually 8–12 words.
3. **Context:** model, dataset, and sample size in one line.
4. **Figure:** the main content, with axes, units, labels, and controls.
5. **Caption:** at most two short sentences; include the limitation needed to read
   the result correctly.

## Under “Methods & data”

- Dataset and model identifiers, checkpoint or run identity where available.
- Selection, aggregation, normalization, train/test split, and missing-data handling.
- What controls and error bars mean; which comparisons are justified.
- Downloadable figure data and its source hashes.
- One short “For builders” note explaining where to connect an integration.

## Choose a truthful figure

| Evidence | Figure |
| --- | --- |
| Recorded neural responses | Heatmap or response trace; surface only with verified spatial coordinates |
| Model prediction | Pair with the corresponding recording; label transformations and common axes |
| Prediction accuracy | Correlation or error plot; do not call it response amplitude |
| Behavior | Choices, errors, accuracy, or task outcomes with a control |
| Intervention | Baseline, intervention, control, and recovery where available |
| Robotics integration | Actual observations, declared action components, and saved traces |

Do not substitute a generic brain, guessed anatomy, synthetic activation, or a
different dataset when the required measurements are unavailable. A neural
recording can be shown as a heatmap without inventing a surface mapping. Keep
missing values missing and explain their color. A prediction from a test policy
is still a test-policy output, not learned robotics performance.

## Add a card

Add an entry to `records` in `results.js`. The shared `card()` function supplies
the structure; the figure renderer supplies only the visual and its controls.

```javascript
{
  id: 'stable-result-id',
  group: 'compare', // compare, inspect, or robotics-group
  type: 'Recorded neural responses',
  title: 'A short finding the figure directly supports',
  context: 'Model · dataset · sample size',
  caption: 'What the figure shows. The essential limitation.',
  methods: 'Selection, units, controls, transformations, and scope.',
  code: 'Where a builder connects this experiment or tool.',
  links: [{label: 'Figure data', href: 'assets/results/my-result.json'}],
  render: myFigureRenderer
}
```

Use Plotly for measured curves and heatmaps, or existing verified figure assets.
Do not put a paragraph inside the figure renderer. Reuse `plot()` and `buttons()`
for responsive layout and accessible controls. A load failure must show an error,
not a placeholder result.

## Before review

- Recompute displayed values from the retained source; record hashes.
- Verify that image captions describe the values actually rendered.
- Check both reading views at desktop and phone widths.
- Exercise controls by keyboard and confirm missing data remains visible.
- Check that the headline remains true without opening the methods.

`scripts/export_result_data.py` produces the current neural display subsets,
ablation curves, and DROID traces from local source records. It performs no model
inference and changes no original data. Movie maps are archived renders with the
original rendering method supplied alongside them; their raw arrays were not
regenerated in this revision.

## Shared theme and legends

Load `theme.css` on connected UMI pages and `figures.js` before chart renderers.
The shared chart adapter supplies a visible legend below each plot. Name every
trace in plain language; keep category names in axis labels or explicit legend
keys. Match the legend's markers, dashes, and bar patterns to the plot.

Use an ordered scale for magnitudes and a diverging scale centered at zero for
signed values. Label colorbars with the quantity; show missing cells in gray.
Start comparison bars at zero. Preserve numerical values when changing the
presentation. Retained raster figures keep their source colors and embedded
legends unless the underlying data supports a reproducible redraw.
