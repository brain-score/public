"""Export small, traceable display subsets from existing experiment records.

No inference, synthetic neural data, coordinate guessing, or surface projection.
Run with the qualification Python environment and --workspace pointing to the
Brain-Score Unified workspace. Original records remain unchanged.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
import xarray as xr

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--workspace', required=True, type=Path)
args = parser.parse_args()
root = args.workspace.resolve()
production = root / 'work/umi-production'
out = Path(__file__).resolve().parents[1] / 'assets/results'
out.mkdir(exist_ok=True)
sources = {}


def record(path):
    sources[str(path.relative_to(root))] = hashlib.sha256(path.read_bytes()).hexdigest()


def write(name, data):
    (out / name).write_text(json.dumps(data, indent=2, allow_nan=False) + '\n')


cache = production / 'artifacts/scientific-parity-2026-09-15/brainio'
image_path = next(cache.rglob('assy_dicarlo_MajajHong2015_public.nc'))
record(image_path)
with xr.open_dataset(image_path) as ds:
    a = ds['dicarlo.MajajHong2015.public']
    ids = list(dict.fromkeys(a.image_id.values.astype(str)))[:24]
    units = np.flatnonzero(a.region.values == 'IT')[:32]
    responses = np.stack([
        a.isel(presentation=np.flatnonzero(a.image_id.values == stimulus),
               neuroid=units, time_bin=0).astype(np.float64).mean('presentation').values
        for stimulus in ids
    ])
    assert responses.shape == (24, 32) and np.isfinite(responses).all()
    vision = dict(values=responses.T.tolist(), stimuli=ids,
                  units=a.neuroid_id.values[units].astype(str).tolist(),
                  source=image_path.name, sha256=sources[str(image_path.relative_to(root))],
                  selection='First 24 distinct images and first 32 IT recording sites in file order; float64 mean over available repetitions; 70-170 ms after onset.',
                  scale='Response in dataset units; no display normalization',
                  kind='recorded neural response', species='macaque')

text_path = next(cache.rglob('assy_Pereira2018_language.nc'))
record(text_path)
with xr.open_dataset(text_path) as ds:
    a = ds['data']
    presentations = np.flatnonzero(a.experiment.values == '243sentences')[:24]
    units = np.flatnonzero(a.subject.values == '018')[:32]
    responses = a.isel(presentation=presentations, neuroid=units).values
    assert responses.shape == (24, 32) and np.isfinite(responses).any()
    language = dict(values=[[float(v) if np.isfinite(v) else None for v in row]
                            for row in responses.T],
                    missing_values=int((~np.isfinite(responses)).sum()),
                    stimuli=a.stimulus_id.values[presentations].astype(str).tolist(),
                    units=a.neuroid_id.values[units].astype(str).tolist(),
                    source=text_path.name, sha256=sources[str(text_path.relative_to(root))],
                    selection='243-sentence experiment; first 24 sentences and first 32 voxels of subject 018 in file order.',
                    scale='Response in dataset units; no display normalization',
                    kind='recorded fMRI response', species='human')
write('neural-responses.json', {'vision': vision, 'language': language})

ablation = root / 'unified/brainscore/benchmarks/induced_dyslexia/reproduction/published_32b_2026-06-03.json'
record(ablation)
data = json.loads(ablation.read_text())
summary = data['summary']
fractions = ['0.0689', '0.15', '0.25']
write('ablation.json', dict(model=data['model_id'], seeds=data['seeds'],
                           percent=[0] + [float(f)*100 for f in fractions],
                           selected=[summary['baseline_roar']] + [summary[f]['vwf_roar'] for f in fractions],
                           random=[summary['baseline_roar']] + [summary[f]['random_roar'] for f in fractions],
                           random_sd=[0] + [summary[f]['random_sd'] for f in fractions],
                           source=ablation.name, sha256=sources[str(ablation.relative_to(root))]))

sys.path[:0] = [str(production / name) for name in ('core', 'unified')]
from brainscore.run_record import RunRecord
from brainscore_core.events import EnvironmentResponse
from PIL import Image

records = production / 'artifacts/droid-reference-2026-09-16/qualification'
episode = RunRecord(records / 'episode')
actions, targets, captures, camera_exported = [], [], [], False
for event in episode.events():
    payload = event.get('payload')
    if event['kind'] == 'output' and getattr(payload, 'channel', None) == 'motor':
        actions.append(payload.payload.action.tolist())
        targets.append(payload.meta['target'].tolist())
    elif event['kind'] == 'output' and isinstance(payload, dict) and 'layer' in payload:
        captures.append(np.asarray(payload['values']).reshape(-1).tolist())
    if not camera_exported and getattr(payload, 'observation', None) is not None:
        for name, frame in payload.observation['cameras'].items():
            Image.fromarray(frame.rgb).save(out / f'droid-{name}.png')
        camera_exported = True
intervention = [p.action.tolist() for p in RunRecord(records / 'intervention').outputs()
                if isinstance(p, EnvironmentResponse)]
assert len(actions) == len(targets) == len(captures) == 119
assert len(intervention) == 3
assert intervention[0] == intervention[2] and intervention[0] != intervention[1]
assert camera_exported
for directory in ('episode', 'intervention'):
    record(records / directory / 'manifest.json')
    record(records / directory / 'events.jsonl')
record(records / 'report.json')
write('droid.json', dict(actions=actions, targets=targets, captures=captures,
                        intervention=intervention, policy='untrained test network',
                        period_ms=1000/15, time_source='inferred from declared 15 Hz',
                        trained_policy_qualified=False))

for name in ('clipdual_meta.json',):
    source = root / 'unified/scripts/algonauts2025' / name
    record(source)
    write('movie.json', json.loads(source.read_text()))
record(root / 'unified/scripts/algonauts2025/predict_clip_bold_dual.py')
for directory in ('human', 'model_qwen', 'model_tribe'):
    for path in sorted((out.parent / 'movie_brain_real' / directory).glob('*.png')):
        record(path)
write('provenance.json', dict(sources=sources, source_files_unchanged=True,
                             display_files={p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                                            for p in sorted(out.iterdir())
                                            if p.is_file() and p.name != 'provenance.json'},
                             exporter_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                             note='Display subsets preserve measured values. Neither neural heatmap is an anatomical map or a model prediction.'))
print('Exported measured response subsets and saved experiment outputs')
