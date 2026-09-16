"""Export the three measured readout strategies used in the Executive diagram.

Run with --workspace pointing to the Brain-Score Unified workspace.
This copies archived scores; it does not run or fit a model.
"""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--workspace', required=True, type=Path)
root = parser.parse_args().workspace.resolve()
source = root / 'unified/experiments/vjepa2_sweep'
out = Path(__file__).resolve().parents[1] / 'assets/results'
out.mkdir(exist_ok=True)
budget = json.loads((source / 'budget_curve_results.json').read_text())
banded = json.loads((source / 'banded_calibrate_results.json').read_text())
curve = budget['curve_normalized']
pooled = next(row for row in curve['pooled_layers'] if row['k'] == 256)
assert curve['whole_layer_r'] == banded['single_ridgecv']
sources = {}
for name in ('budget_curve_results.json', 'banded_calibrate_results.json',
             'run_budget_curve.py', 'run_banded_calibrate.py'):
    path = source / name
    sources[str(path.relative_to(root))] = hashlib.sha256(path.read_bytes()).hexdigest()
    (out / name).write_bytes(path.read_bytes())

data = {
    'model': budget['model'], 'benchmark': budget['benchmark'],
    'n_stimuli': budget['n_stimuli'], 'n_voxels': budget['n_voxels'],
    'metric': 'Median per-voxel prediction correlation divided by sqrt(split-half reliability)',
    'protocol': 'Same localizer/test split (localizer fraction 0.5, seed 0); fitting and feature selection use the localizer. Score on held-out clips.',
    'strategies': [
        {'id': 'single', 'title': 'All units from one layer',
         'selection': '1,024 units · layer 16', 'layers': [budget['best_layer']],
         'fit': 'Ridge', 'fit_note': 'Fit a prediction rule with limited weights.',
         'score': curve['whole_layer_r'],
         'source': 'budget_curve_results.json:curve_normalized.whole_layer_r'},
        {'id': 'composite', 'title': 'Selected units across layers',
         'selection': '256 units · pooled across 3 layers', 'layers': budget['top_layers'],
         'fit': 'Ridge', 'fit_note': 'Fit the same type of prediction rule.',
         'score': pooled['r'],
         'source': 'budget_curve_results.json:curve_normalized.pooled_layers[k=256].r'},
        {'id': 'all', 'title': 'All 24 layers + ridge',
         'selection': 'All units · 24 separate layer groups',
         'fit': 'Banded ridge', 'fit_note': 'Fit a rule that also weights each layer group.',
         'score': banded['banded_24_niter500'],
         'source': 'banded_calibrate_results.json:banded_24_niter500'}
    ],
    'limits': 'Feature counts and fitting methods differ. This is a comparison of practical readout choices, not a feature-budget-matched test. No confidence intervals or statistical significance established for these three scores. The composite pools selected existing units; it does not create averaged units. Layer glyphs are schematic; scores are archived measurements.',
    'sources_sha256': sources,
    'exporter_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
}
(out / 'layer-strategies.json').write_text(json.dumps(data, indent=2) + '\n')
print('Exported three measured strategies:', [s['score'] for s in data['strategies']])
