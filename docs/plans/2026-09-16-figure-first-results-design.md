# Figure-first UMI Overview

The user chose three groups: compare with brains and behavior, inspect and
intervene, and robotics. Preserve the complete experiment collection in these
groups, alongside the new measured-response and DROID cards.

## Common result structure

Evidence label, finding headline, one context line, a large figure, a short
caption, and expandable methods/data. Executive and Technical share the same
results. Technical opens methods and adds integration notes. All existing
experiments and controls remain on the Overview, with their section bookmarks
preserved. The archive is an optional reference, not a prerequisite for finding
an existing result.

The main alternative was one short sequence of flagship results. Groups were
chosen to give new results a clear home. A dashboard with many summary tiles was
also considered; it would compete with the figures and repeat the old page's
navigation problem.

## Evidence rules

Use actual recordings and saved experiment outputs. No illustrative anatomy in
result cards. Distinguish recorded brain response, model prediction, prediction
accuracy, model activity, behavior, and integration tests. Missing values stay
missing. Use a neural heatmap when verified anatomical coordinates are unavailable.

The image and sentence display subsets are newly exported from cached source
assemblies. Movie maps are archived renders with their method, metadata, and
hashes retained; the raw movie arrays have not been regenerated. DROID uses real
recorded observations with an explicitly untrained test policy.

## Implementation and review

`catalog.js` organizes the original sections and moves supporting prose into
expandable methods. `results.js` supplies the additional source-backed cards
through a shared renderer. The Overview contains 26 cards and 25 Plotly charts.
`results.css` and `catalog.css` provide desktop and mobile layout.
`scripts/export_result_data.py` exports small
source-derived JSON files and dataset camera frames, with hashes. Fetch failures
show errors rather than placeholder results.

Verify exported neural cells against source IDs, preserving the missing-data
mask. Check plotted values, camera/frame controls, both reading views, keyboard
operation, old bookmarks, mobile overflow, and image loading. Review every result
visually. Compare section coverage against the original Overview and retain every
original result in both views. This is a local revision; no commit or deployment
is part of the task.

The reusable author guide is [RESULT_TEMPLATE.md](../../UMI/RESULT_TEMPLATE.md).
