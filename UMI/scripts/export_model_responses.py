"""Export model activations aligned by stimulus ID to the brain display subset.

Vision: local CPU FP32 inference on 24 public images, using a staged ResNet-18
checkpoint. Language: retained pre-metric GPT-2 activations, reordered by ID.
No metric, neural readout fit, display normalization, or private data is used.
"""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--workspace', type=Path, required=True)
args = parser.parse_args()
root = args.workspace.resolve()
production = root / 'work/umi-production'
out = Path(__file__).resolve().parents[1] / 'assets/results'
artifacts = production / 'artifacts/website-model-recordings-2026-09-16'
artifacts.mkdir(exist_ok=True)
os.environ.update(BS_INSTALL_DEPENDENCIES='no', RESULTCACHING_DISABLE='1',
                  HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1',
                  OMP_NUM_THREADS='4', OPENBLAS_NUM_THREADS='4')
sys.path[:0] = [str(production / name) for name in ('core', 'vision')]
import numpy as np
import torch
from torchvision.models import resnet18
from brainscore_vision.model_helpers.activations.pytorch import load_preprocess_images

sources = {}
def record(path):
    path = Path(path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    sources[str(path.relative_to(root))] = digest
    return digest

def write(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')

brain_path = out / 'neural-responses.json'
record(brain_path)
brain = json.loads(brain_path.read_text())
cache = production / 'artifacts/scientific-parity-2026-09-15/brainio'
csv_path = next(cache.rglob('stimulus_hvm-public.csv'))
image_dir = next(p for p in cache.rglob('stimulus_hvm-public') if p.is_dir())
record(csv_path)
with csv_path.open() as stream:
    rows = {r['image_id']: r for r in csv.DictReader(stream)}
ids = brain['vision']['stimuli']
paths = [image_dir / rows[stimulus]['filename'] for stimulus in ids]
for path in paths:
    record(path)
weights = production / 'artifacts/scientific-parity-2026-09-15/resnet18-f37072fd.pth'
checkpoint_sha = record(weights)
preprocessor = production / 'vision/brainscore_vision/model_helpers/activations/pytorch.py'
record(preprocessor)
torch.set_num_threads(4)
torch.set_num_interop_threads(1)
model = resnet18(weights=None)
model.load_state_dict(torch.load(weights, map_location='cpu', weights_only=True))
model.eval()
outputs = []
def capture(_module, _inputs, output):
    outputs.append(output.detach().cpu().numpy().copy())
hook = model.layer4.register_forward_hook(capture)
try:
    with torch.inference_mode():
        for start in range(0, len(paths), 4):
            inputs = load_preprocess_images([str(p) for p in paths[start:start + 4]], image_size=224)
            model(torch.from_numpy(inputs))
finally:
    hook.remove()
vision_raw = np.concatenate(outputs).reshape(24, -1)
assert vision_raw.shape == (24, 25088)
np.save(artifacts / 'resnet18-layer4.npy', vision_raw, allow_pickle=False)
write(artifacts / 'resnet18-stimuli.json', ids)
record(artifacts / 'resnet18-layer4.npy')
record(artifacts / 'resnet18-stimuli.json')

language_dir = production / 'artifacts/upstream-reference-2026-09-16/candidate-fixed/Pereira2018.243sentences-linear'
report_path = language_dir / 'report.json'
activation_path = language_dir / 'activations.npy'
record(report_path)
record(activation_path)
report = json.loads(report_path.read_text())
assert report['status'] == 'passed'
language_raw = np.load(activation_path, allow_pickle=False)
metric_input = report['metric_inputs'][0]
assert hashlib.sha256(np.ascontiguousarray(language_raw)).hexdigest() == metric_input['sha256']
source_ids = metric_input['stimulus_ids']
assert len(set(source_ids)) == len(source_ids)
lookup = {stimulus: i for i, stimulus in enumerate(source_ids)}
language_indices = [lookup[stimulus] for stimulus in brain['language']['stimuli']]
language_aligned = language_raw[language_indices]

result = {}
for domain, values, model_name, layer in (
    ('vision', vision_raw, 'ResNet-18', 'layer4'),
    ('language', language_aligned, 'GPT-2', 'transformer.h.11'),
):
    units = np.linspace(0, values.shape[1] - 1, 32, dtype=int)
    selected = values[:, units].T
    assert selected.shape == (32, 24) and np.isfinite(selected).all()
    result[domain] = dict(
        model=model_name, layer=layer, values=selected.tolist(),
        stimuli=brain[domain]['stimuli'], units=units.astype(str).tolist(),
        source_unit_count=values.shape[1], kind='model activation before metric',
        scale='Raw model output; no display normalization; not brain-response units',
        selection='32 evenly spaced unit indices, selected without looking at response values; 24 stimuli aligned by ID to the brain heatmap.',
    )
result['vision'].update(
    checkpoint_sha256=checkpoint_sha,
    preprocessing='Brain-Score load_preprocess_images: resize to 224x224, RGB tensor and ImageNet mean/std normalization.',
    extraction='CPU float32, evaluation mode, batch size 4; layer4 output flattened from channel × height × width (512×7×7).',
)
result['language'].update(
    checkpoint='gpt2 snapshot 607a30d783dfa663caf39e06633721c8d4cfcd7e',
    extraction='Saved CPU float32 metric input from GPT-2 transformer.h.11; final-token representation with the benchmark passage context. Reordered by stimulus ID, no new language inference.',
    source_row_indices=language_indices,
    source_array_sha256=metric_input['sha256'],
)
write(out / 'model-responses.json', result)
write(out / 'model-response-provenance.json', dict(
    sources=sources,
    exporter_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    display_sha256=hashlib.sha256((out / 'model-responses.json').read_bytes()).hexdigest(),
    torch_version=torch.__version__, numpy_version=np.__version__,
    inference_scope='24 public images on local CPU; language activations reused from a saved qualification run.',
    metric_applied=False, brain_readout_fitted=False,
    note='Columns match the brain display by stimulus ID. Model rows are independent units, not matched neurons. Color ranges are independent because units differ.',
))
print('Exported 32 × 24 model responses for each domain; stimulus IDs match brain display exactly.')
