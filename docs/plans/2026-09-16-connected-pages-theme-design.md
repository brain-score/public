# Consistent UMI pages and readable figures

## Scope

Apply the Overview's visual language to the UMI landing page, Architecture, and
experiment archive. Preserve every result and interaction. No commit, publication,
or release is part of this work.

A shared theme keeps navigation, typography, spacing, colors, and cards consistent.
Page-specific layouts remain: the landing page explains the interface, Architecture
supports engineers, and the Overview and archive retain the experiments.

## Figure rules

- Put a readable legend below every chart, outside the plotting area.
- Pair colors with names, marker shapes, line styles, or bar patterns.
- Use an ordered Cividis scale for response magnitude and relative layer scores.
  Use an orange–white–blue scale centered on zero for signed model activity.
- Show missing cells in gray. Preserve source values, missingness, and aggregation.
- State whether the plotted quantity is a count, response, correlation, accuracy,
  normalized score, or integration output. Start comparison bars at zero.
- Explain baseline lines and error bars next to the figure.
- Keep archived raster figures and their embedded legends intact; do not recolor
  measured images without the underlying arrays.
- Distinguish schematic timing diagrams from recorded experiment traces.

Architecture diagrams use named inputs, checks, model processing, and outputs.
The matrix states Ready, Partial, Setup, or the specific error in each cell. Color
is supplementary. Matrix cells support keyboard selection.

## Implementation

`theme.css` is shared by all four UMI pages. `figures.js` adapts chart styling and
constructs legends from the actual traces, without editing numerical arrays.
Both original and newly added plots use it. The data files remain unchanged.

## Review

Check all four pages at desktop and phone widths, every chart's legend, routing
controls, keyboard interaction, audience switches, chart tabs, and horizontal
scrolling in reference tables. Compare chart data before and after presentation
styling and verify the original Overview's section coverage.
