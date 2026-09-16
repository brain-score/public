# Show brain recordings, then model recordings

Place model responses immediately after the existing brain response example in
Executive. Use the same 32-row by 24-column heatmap format, with linked input tabs.
This brings Executive to nine examples and retains all 27 cards in Technical.

## Evidence and alignment

- Brain responses are the existing measured MajajHong public and Pereira subsets.
- Vision model: pretrained ResNet-18, raw layer4 activations, 24 matching public
  images, local CPU FP32, existing Brain-Score preprocessing and staged checkpoint.
- Language model: saved GPT-2 transformer.h.11 activations captured before the
  qualification metric, reordered to match the 24 displayed sentences by ID.
- Select 32 evenly spaced model-unit indices without looking at response values.
- Columns refer to the same input in both panels. Rows do not imply matching brain
  cells and model units. Color ranges are independent; raw values are unchanged.
- No fitted brain prediction or metric is applied to these display subsets.

The next step in an evaluation is to fit and test a comparison under the benchmark's
split and controls. A visually similar matrix alone does not establish agreement.

## Implementation and verification

`export_model_responses.py` produces the display JSON and source hashes. It performs
only the small image run locally and reuses the saved sentence responses.
`responseHeatmap()` renders both panels with the same axes and geometry; changing
either input selector changes both. A separate audit verifies all 1,536 model
cells against retained arrays and checks every source hash and stimulus identity.

Local only. No commit, paid compute, or deployment.
