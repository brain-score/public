/* Interactive architecture explorer for the Brain-Score Unified Model Interface.
 *
 * Mirrors the real dispatch in core/brainscore_core/model_interface.py::
 * BrainScoreModel.process() and the compatibility contract in compatibility.py.
 * Pick a model archetype + an input event (+ a behavioral task), and it resolves
 * the exact call flow, the OutputEvent type, and any pre-flight failure — honestly,
 * including the incompatible combinations.
 */
(function () {
  'use strict';

  // MODALITY_PRIORITY tiebreak (single-modality dispatch), verbatim from core.
  const MODALITY_PRIORITY = ['vision', 'text', 'audio', 'video'];

  // ---- model archetypes: the capability profile each registration exposes ----
  // has: which dispatch slots / wrappers are present.
  //   activations = has an activations_model (internal layers readable). This alone enables BOTH
  //                 neural encoding AND behavioral readout — any open-weight model can fit a
  //                 logistic head on a chosen layer. Only closed/output-only models lack it.
  //   generation  = has generation_fn (instruction-following text out — the only behavioral path
  //                 a closed-weight API model has)
  //   action      = has action_fn (embodied closed loop)
  //   state_change= has state_change_fn (lesion/perturb)
  const MODELS = [
    { id: 'image', name: 'Image model', eg: 'CLIP ViT-B/32 · ResNet-50 · random-ViT (null)',
      wrappers: ['PytorchWrapper'], preprocessors: ['vision'], available: ['vision'], required: [],
      has: { activations: true, generation: false, action: false, state_change: false },
      blurb: 'A CNN/ViT wrapped by PytorchWrapper; forward hooks expose any layer.' },
    { id: 'language', name: 'Language model', eg: 'GPT-2',
      wrappers: ['TextWrapper'], preprocessors: ['text'], available: ['text'], required: ['text'],
      has: { activations: true, generation: false, action: false, state_change: false },
      blurb: 'TextWrapper tokenizes + runs the causal LM; required={text} hard-gates non-text benchmarks.' },
    { id: 'vlm', name: 'Vision-language model (VLM)', eg: 'Qwen2.5-VL · BLIP-2',
      wrappers: ['VLMVisionWrapper', 'TextWrapper'], preprocessors: ['vision', 'text'], available: ['vision', 'text'], required: [],
      has: { activations: true, generation: true, action: false, state_change: true },
      blurb: 'Two towers (flattened-patch vision + causal text). Often also instruction-following (generation_fn) and lesionable (state_change_fn); a natural VLA policy once an action_fn is wired.' },
    { id: 'video', name: 'Video model', eg: 'V-JEPA v1/v2 · VideoMAE',
      wrappers: ['VideoWrapper'], preprocessors: ['video'], available: ['video'], required: ['video'],
      has: { activations: true, generation: false, action: false, state_change: false },
      blurb: 'VideoWrapper consumes (B,T,C,H,W); returns time-resolved features.' },
    { id: 'audio', name: 'Audio model', eg: 'Wav2Vec2 · HuBERT · Whisper',
      wrappers: ['AudioWrapper'], preprocessors: ['audio'], available: ['audio'], required: ['audio'],
      has: { activations: true, generation: false, action: false, state_change: false },
      blurb: 'AudioWrapper resamples + runs an HF audio encoder; mean-time or time-series features.' },
    { id: 'av', name: 'Multimodal A+V model', eg: 'V-JEPA + Wav2Vec2',
      wrappers: ['VideoWrapper', 'AudioWrapper'], preprocessors: ['video', 'audio'], available: ['video', 'audio'], required: [],
      has: { activations: true, generation: false, action: false, state_change: false },
      regionModalityMap: true,
      blurb: 'Two preprocessors + region_modality_map routes each region to its tower. Needs multi_modality=True to use both at once.' },
    { id: 'api', name: 'Closed-weight API model', eg: 'Claude · GPT-4 · DeepSeek · OpenRouter',
      wrappers: [], preprocessors: ['vision', 'text'], available: ['vision', 'text'], required: [],
      has: { activations: false, generation: true, action: false, state_change: false },
      blurb: 'Output-only: generation_fn closure, activations_model=None. Behavioral (generation) out of the box; embodied only if the API exposes an action schema and you wire an action_fn.' },
    { id: 'embodied', name: 'Embodied policy', eg: 'game player · π0 robot policy',
      wrappers: [], preprocessors: [], available: [], required: [],
      has: { activations: false, generation: false, action: true, state_change: false },
      blurb: 'action_fn(EnvironmentStep) -> EnvironmentResponse. Drives the closed loop; no perceptual extraction.' }
  ];

  // ---- input events (what you hand to process) ----
  const INPUTS = [
    { id: 'image', name: 'Images', event: 'StimulusSet', modality: 'vision', column: 'image_file_name', perceptual: true },
    { id: 'text', name: 'Sentences', event: 'StimulusSet', modality: 'text', column: 'sentence', perceptual: true },
    { id: 'audio', name: 'Audio clips', event: 'StimulusSet', modality: 'audio', column: 'audio_path', perceptual: true },
    { id: 'video', name: 'Video clips', event: 'StimulusSet', modality: 'video', column: 'video_path', perceptual: true },
    { id: 'movie', name: 'Movie (video+audio+text)', event: 'MultimodalStimulusSet', modality: ['video', 'audio', 'text'], column: 'video_path / audio_path / sentence', perceptual: true },
    { id: 'lesion', name: 'Lesion spec', event: 'StateChange', modality: null, perceptual: false },
    { id: 'envstep', name: 'Environment step', event: 'EnvironmentStep', modality: null, perceptual: false }
  ];

  // ---- behavioral task modifier (only meaningful for perceptual inputs) ----
  const TASKS = [
    { id: 'neural', name: 'Neural encoding', desc: 'start_recording(region) → predict brain responses' },
    { id: 'readout', name: 'Behavioral readout', desc: 'fit a logistic head on a layer (fitting_stimuli)' },
    { id: 'generation', name: 'Behavioral generation', desc: 'TaskContext.instruction → generate → parse a label' }
  ];

  const NEURAL_BENCH = {
    vision: 'MajajHong2015 V4 / IT (vision · neural)',
    text: 'Pereira2018 sentences (language · neural)',
    audio: 'Lahner2024 auditory-ROI (audio · neural)',
    video: 'Lahner2024 BOLDMoments (video · neural)'
  };

  // ---- routing engine: mirror of process() + the pre-flight compatibility check ----
  const S = (kind, label, sub, contract) => ({ kind, label, sub, contract });
  const ok = (steps, output, bench, model) =>
    ({ ok: true, steps, output, bench, model });
  const err = (etype, msg, steps) => ({ ok: false, etype, msg, steps: steps || [] });

  function pickByPriority(mods) {
    for (const m of MODALITY_PRIORITY) if (mods.includes(m)) return m;
    return mods[0];
  }

  // vision and video are one visual family: an image is a one-frame clip, a video is sampled
  // frames. So any model with a visual tower consumes either — the wrapper adapts the temporal
  // shape. (Audio and text are their own modalities; no cross-consumption.)
  const isVisual = m => m === 'vision' || m === 'video';
  function consumes(model, mod) {
    return model.available.includes(mod) || (isVisual(mod) && model.available.some(isVisual));
  }
  // which preprocessor/tower actually runs for a consumed input modality
  function towerFor(model, mod) {
    return model.available.includes(mod) ? mod : (isVisual(mod) ? model.available.find(isVisual) : mod);
  }
  // note shown when an input is adapted to a different-shaped visual tower
  function adaptNote(inputMod, tower) {
    if (inputMod === tower) return '';
    return inputMod === 'vision' ? ' — a still is fed as a 1-frame clip' : ' — frames sampled from the clip';
  }
  // how a model consumes an input modality: 'direct' (native tower), 'adapter' (cross-visual —
  // works but needs a temporal-shape adapter, NOT out of the box), or 'none'.
  function consumeKind(model, mod) {
    if (model.available.includes(mod)) return 'direct';
    if (isVisual(mod) && model.available.some(isVisual)) return 'adapter';
    return 'none';
  }
  // description of the adapter a cross-visual input requires (keyed by the INPUT modality)
  function adapterNeed(inputMod) {
    return inputMod === 'video'
      ? 'a frame-sampling adapter — frames pooled, not a true temporal model'
      : 'a fixed-window adapter — a still padded to a 1-frame clip';
  }
  // tooltip for a movie where the model covers only some channels. If it has >1 native tower,
  // covering all of them needs multi_modality=True (single dispatch picks one via MODALITY_PRIORITY).
  function partialNeed(inMods, directMods) {
    const dropped = inMods.filter(m => !directMods.includes(m));
    return directMods.length > 1
      ? `covers ${directMods.join(' + ')} with multi_modality=True (single dispatch picks one via MODALITY_PRIORITY); ${dropped.join('/')} ignored — not the full benchmark`
      : `uses only the ${directMods[0]} channel; ${dropped.join('/')} ignored — not the full multimodal benchmark`;
  }
  // a model with ≥2 native towers matching a multimodal input naturally uses ALL of them (multi-route);
  // that's the sensible default, not the single-modality-priority fallback.
  function defaultMulti(model, input) {
    const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
    return inMods.length > 1 && inMods.filter(m => model.available.includes(m)).length > 1;
  }

  // ---- capability classifier: what the ROUTER can do, not just what's wired today ----
  // The dispatch is capability-agnostic — it routes an event to a slot. Whether that slot
  // is filled in the canonical registration is a wiring detail, not a limit of the interface.
  //   'routes' — the standard registration of this archetype handles it out of the box.
  //   'optin'  — the router dispatches it; wire ONE capability (a preprocessor / an _fn).
  //              No core change. This is the "theoretically possible" tier.
  //   'na'     — precluded by the archetype's substrate: a black-box (output-only) model has
  //              no internal activations to read for neural encoding, and no other tower to
  //              re-purpose. This is a genuine contract boundary, not a wiring gap.
  function capability(model, input) {
    const C = model.has;
    const whiteBox = C.activations;             // has readable/hookable internal layers

    if (input.event === 'StateChange') {        // lesion / perturbation — needs hookable internals
      if (C.state_change) return { tier: 'routes', out: 'PerturbationApplied' };
      if (whiteBox) return { tier: 'optin', out: 'PerturbationApplied',
        need: 'wire a state_change_fn — a forward-hook ablation works on any layer' };
      return { tier: 'na', out: 'PerturbationApplied', etype: 'NotImplementedError',
        need: 'no internal units to perturb — a lesion needs hookable activations, which an output-only / black-box policy has none of' };
    }
    if (input.event === 'EnvironmentStep') {    // embodied closed loop
      if (C.action) return { tier: 'routes', out: 'EnvironmentResponse' };
      // action_fn is an EXTERNAL closure (observation -> action), not an internal hook — so it can
      // wrap any model: generate the action (generative models) or add a policy head on the model's
      // features (white-box). The env is matched to what the model perceives.
      return { tier: 'optin', out: 'EnvironmentResponse',
        need: C.generation
          ? 'wire an action_fn — generate the action (VLA-style: emit action tokens / pick a move)'
          : 'wire an action_fn — a policy head mapping this model\'s features to an action' };
    }

    // perceptual input, neural-encoding lens (the matrix default). Neural encoding needs
    // internal activations, so an output-only model is a genuine n/a here regardless of which
    // modalities it can ingest for behavior — matches route()'s first check in the neural branch.
    if (!whiteBox) return { tier: 'na', out: 'NeuroidAssembly', etype: 'NotImplementedError',
      need: 'output-only model — no internal activations to read for neural encoding (score it behaviorally / by generation instead)' };

    const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
    const kinds = inMods.map(m => consumeKind(model, m));
    const directMods = inMods.filter((m, i) => kinds[i] === 'direct');
    const adapterMods = inMods.filter((m, i) => kinds[i] === 'adapter');
    if (!directMods.length && !adapterMods.length) return { tier: 'na', out: 'NeuroidAssembly', etype: 'CompatibilityError',
      need: `no ${inMods.join('/')} tower — pre-flight check_compatibility fails (required ⊄ available); a new backbone, not a wiring change` };
    if (inMods.length > 1) {   // multimodal input (movie): a single/few-tower model covers only part
      if (directMods.length) return { tier: 'partial', out: 'NeuroidAssembly', need: partialNeed(inMods, directMods) };
      return { tier: 'optin', out: 'NeuroidAssembly',
        need: `reads only the ${adapterMods.join('/')} track, and only via ${adapterNeed(adapterMods[0])}` };
    }
    if (directMods.length) return { tier: 'routes', out: 'NeuroidAssembly' };
    return { tier: 'optin', out: 'NeuroidAssembly', need: `needs ${adapterNeed(inMods[0])}` };
  }

  // Can a (model, perceptual input) produce a BehavioralAssembly? Two behavioral paths:
  //   readout    — fit a logistic head on a layer; available to ANY open-weight model (activations)
  //   generation — generation_fn; the only path a closed-weight API model has
  // So an open-weight model does behavior via readout out of the box; a closed API via generation.
  function behavioralCap(model, input) {
    const C = model.has;
    if (!(C.generation || C.activations)) return { tier: 'na', out: 'BehavioralAssembly', etype: 'NotImplementedError',
      need: 'no behavioral path — an open-weight model fits a readout on a layer; a closed API needs a generation_fn' };

    const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
    const kinds = inMods.map(m => consumeKind(model, m));
    const directMods = inMods.filter((m, i) => kinds[i] === 'direct');
    const adapterMods = inMods.filter((m, i) => kinds[i] === 'adapter');
    if (!directMods.length && !adapterMods.length) return { tier: 'na', out: 'BehavioralAssembly', etype: 'CompatibilityError',
      need: `no ${inMods.join('/')} tower — pre-flight check_compatibility fails (required ⊄ available)` };
    const via = C.generation ? 'generation' : 'readout';
    if (inMods.length > 1) {   // movie: covers only part of the multimodal input
      if (directMods.length) return { tier: 'partial', out: 'BehavioralAssembly', via, need: partialNeed(inMods, directMods) };
      return { tier: 'optin', out: 'BehavioralAssembly', via, need: `reads only the ${adapterMods.join('/')} track via ${adapterNeed(adapterMods[0])}` };
    }
    if (directMods.length) return { tier: 'routes', out: 'BehavioralAssembly', via };
    return { tier: 'optin', out: 'BehavioralAssembly', via, need: `needs ${adapterNeed(inMods[0])}` };
  }

  function route(model, input, task, multiModality) {
    const C = model.has;
    const procStep = S('event', 'process(input_event)', `you hand the model a ${input.event}`, 'Subject.process');

    // 1 — StateChange (lesion / perturbation)
    if (input.event === 'StateChange') {
      if (!C.state_change) {
        return err('NotImplementedError',
          `'${model.name}' has no state_change_fn registered, so it can't be lesioned/perturbed.`,
          [procStep, S('decision', 'isinstance(StateChange)', 'routes to state_change_fn — but none is registered')]);
      }
      return ok([
        procStep,
        S('decision', 'isinstance(StateChange) → state_change_fn', 'first dispatch branch'),
        S('fn', 'state_change_fn(state_change)', 'resolve Selection (which units) → apply Perturbation (zero / scale / replace)', 'BrainScoreModel.state_change_fn'),
        S('output', 'PerturbationApplied', 'carries a handle_id; process(StateChange(kind="reset", handle_id=…)) restores bit-for-bit')
      ], 'PerturbationApplied', 'Yeatman2021-induced_dyslexia (lesion the word-form units)', model);
    }

    // 2 — EnvironmentStep (embodied closed loop)
    if (input.event === 'EnvironmentStep') {
      if (!C.action) {
        return err('NotImplementedError',
          `'${model.name}' has no action_fn registered; embodied evaluation needs action_fn(env_step) -> EnvironmentResponse.`,
          [procStep, S('decision', 'isinstance(EnvironmentStep)', 'routes to action_fn — but none is registered')]);
      }
      return ok([
        procStep,
        S('decision', 'isinstance(EnvironmentStep) → action_fn', 'embodied dispatch branch'),
        S('fn', 'action_fn(env_step)', 'see the rendered frame + legal actions, reason, pick a move', 'BrainScoreModel.action_fn'),
        S('output', 'EnvironmentResponse', 'action index fed back to the env; loop repeats (no reset between ticks)')
      ], 'EnvironmentResponse', 'GridGame-reach / MiniGrid (closed-loop)', model);
    }

    // 3 — perceptual input (StimulusSet / MultimodalStimulusSet)
    const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
    const supported = inMods.filter(m => consumes(model, m));

    // 3a — behavioral generation path
    if (task === 'generation') {
      if (!C.generation) {
        return err('path unavailable',
          `'${model.name}' has no generation_fn — it is not a generative model. Score it by behavioral readout (any open-weight model fits a logistic head on a layer) instead.`,
          [procStep, S('decision', 'TaskContext.instruction + generation_fn?', 'no generation_fn → not a generative model')]);
      }
      if (supported.length === 0) {
        return err('CompatibilityError',
          `pre-flight check_compatibility fails: this input is {${inMods.join(', ')}} but the model only reads {${model.available.join(', ')}}.`,
          [procStep, S('decision', 'check_compatibility()', 'required modality ⊄ model.available')]);
      }
      return ok([
        procStep,
        S('check', 'check_compatibility() · check_memory()', 'pre-flight: modality/region subset, then extraction probe + metric-memory estimate'),
        S('decision', '_use_generation_for_task & instruction present', 'generation wins (prefer_path="auto")'),
        S('fn', '_generate_predictions(stimuli)', `read the ${pickByPriority(supported)} column → generation_fn(row, instruction, label_set) → parse a label`, 'BrainScoreModel._generate_predictions'),
        S('output', 'BehavioralAssembly', 'one-hot over label_set per stimulus')
      ], 'BehavioralAssembly', 'ROAR / Yeatman2021 (generation) · Rajalingham 2-AFC', model);
    }

    // 3b — behavioral readout path. Available to ANY open-weight model: fit a logistic head on a
    // chosen layer's activations. Only an output-only (no-activations) model can't take this path.
    if (task === 'readout') {
      if (!C.activations) {
        return err('NotImplementedError',
          `'${model.name}' is output-only (activations_model=None); a readout fits a logistic head on internal activations. Score it by behavioral generation instead.`,
          [procStep, S('decision', 'fitting_stimuli → readout head?', 'no internal activations to fit on')]);
      }
      if (supported.length === 0) {
        return err('CompatibilityError',
          `pre-flight check_compatibility fails: input {${inMods.join(', ')}} ⊄ model {${model.available.join(', ')}}.`,
          [procStep]);
      }
      const m = pickByPriority(supported);
      const rTower = towerFor(model, m);
      return ok([
        procStep,
        S('check', 'check_compatibility() · check_memory()', 'pre-flight'),
        S('decision', 'fitting_stimuli present → fit a readout head', 'any open-weight model: logistic head on a chosen layer'),
        S('fn', '_predict_probabilities(stimuli)', `preprocessors['${rTower}']${adaptNote(m, rTower)} → activations_model at the readout layer → fitted logistic head`, 'BrainScoreModel._predict_probabilities'),
        S('output', 'BehavioralAssembly', 'probabilities over label_set')
      ], 'BehavioralAssembly', 'ROAR / Yeatman2021 (readout)', model);
    }

    // 3c — neural encoding (default perceptual path)
    if (!C.activations) {
      return err('NotImplementedError',
        `'${model.name}' is output-only (activations_model=None) — it exposes no layer activations, so it can't run activation-based neural encoding. Score it behaviorally (generation) instead.`,
        [procStep, S('check', 'check_compatibility()', 'passes modality, but there is no activations_model to extract from')]);
    }
    if (supported.length === 0) {
      return err('CompatibilityError',
        `pre-flight check_compatibility fails: the benchmark requires {${inMods.join(', ')}} but model.available = {${model.available.join(', ')}}. The contract is benchmark.required ⊆ model.available.`,
        [procStep, S('check', 'check_compatibility()', 'required ⊄ available → fail fast, before any compute')]);
    }

    const useMulti = multiModality && supported.length > 1;
    const towers = useMulti ? supported : [pickByPriority(supported)];
    const steps = [
      procStep,
      S('check', 'check_compatibility() · check_memory()', 'pre-flight: modality+region subset, then extraction probe + metric-memory estimate'),
      S('decision', `_detect_modalities() → {${inMods.join(', ')}}`,
        useMulti ? `multi_modality=True → fan out to every supported tower {${towers.join(', ')}}`
                 : (supported.length > 1
                     ? `single-modality dispatch → MODALITY_PRIORITY (vision, text, audio, video) picks "${towers[0]}"; set multi_modality=True to use all of {${supported.join(', ')}}`
                     : (inMods.length > 1
                         ? `model has a tower only for "${supported[0]}"; reads that track, ignores the rest`
                         : 'single modality')))
    ];
    towers.forEach((mod, idx) => {
      const tower = towerFor(model, mod);
      const wrapperName = wrapperFor(model, tower);
      const routeTag = useMulti ? `${mod} route (${idx + 1}/${towers.length}) · ` : '';
      steps.push(S('fn', `preprocessors['${tower}'](stimuli)`, `${routeTag}modality-specific transform${adaptNote(mod, tower) || ' (resize/normalize · tokenize · resample)'}`, 'preprocessor callable'));
      steps.push(S('wrapper', `${wrapperName}(layers=region_layer_map)`,
        useMulti ? `parallel route ${idx + 1} of ${towers.length} — features concatenated at the end`
                 : 'one forward pass, hooks capture the recording layer(s)',
        wrapperName));
    });
    steps.push(S('output', 'NeuroidAssembly',
      useMulti ? '(presentation, neuroid) — concat across towers with a per-neuroid modality coord'
               : '(presentation, neuroid) with layer (+ region) coords'));

    const benchName = useMulti ? 'Algonauts2025 / Lahner multimodal (banded ridge over towers)'
      : (input.id === 'movie' ? `${NEURAL_BENCH[towers[0]]} — only the "${towers[0]}" tower ran` : NEURAL_BENCH[towers[0]]);
    return ok(steps, useMulti ? 'NeuroidAssembly (multi-tower)' : 'NeuroidAssembly', benchName, model);
  }

  function wrapperFor(model, modality) {
    const map = { vision: model.id === 'vlm' ? 'VLMVisionWrapper' : 'PytorchWrapper',
      text: 'TextWrapper', audio: 'AudioWrapper', video: 'VideoWrapper' };
    return map[modality] || 'PytorchWrapper';
  }

  // ---- example code snippet — specific to THIS model / input / task ----
  const REGION_FOR = { vision: 'IT', video: 'IT', text: 'language_system', audio: 'A1' };
  function snippet(model, input, task, result) {
    const id = `'${model.id}-model'`;
    const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
    const supported = inMods.filter(m => consumes(model, m));
    const stimVar = input.id === 'movie' ? 'movie' : 'stimulus_set';
    const modelRegion = model.available.length ? (REGION_FOR[pickByPriority(model.available)] || 'IT') : 'IT';

    if (input.event === 'StateChange') {
      if (!result.ok) return `m = load_model(${id})\n` +
        `m.process(StateChange(target=sel, perturbation=Perturbation('zero')))   # -> ${result.etype}`;
      return `m = load_model(${id})   # state_change_fn wired\n` +
        `handle = m.process(StateChange(target=sel, perturbation=Perturbation('zero')))\n` +
        `# … observe the deficit … then restore bit-for-bit:\n` +
        `m.process(StateChange(kind='reset', handle_id=handle.handle_id))`;
    }
    if (input.event === 'EnvironmentStep') {
      if (!result.ok) return `m = load_model(${id})\n` +
        `m.process(EnvironmentStep(observation=obs, step_num=t))   # -> ${result.etype}`;
      return `m = load_model(${id})   # action_fn wired\n` +
        `resp = m.process(EnvironmentStep(observation=obs, step_num=t))\n` +
        `env.step(int(resp.action))   # closed loop, no reset between ticks`;
    }
    if (task === 'generation') {
      if (!result.ok) return `m = load_model(${id})\n` +
        `m.start_task(TaskContext(task_type='probabilities', instruction='…', label_set=[...]))\n` +
        `m.process(${stimVar})   # -> ${result.etype}`;
      return `m = load_model(${id})   # generation_fn wired\n` +
        `m.start_task(TaskContext(task_type='probabilities',\n` +
        `                         instruction='Which category?', label_set=[...]))\n` +
        `assembly = m.process(${stimVar})   # -> BehavioralAssembly (a label per stimulus)`;
    }
    if (task === 'readout') {
      if (!result.ok) return `m = load_model(${id})\n` +
        `m.start_task(TaskContext(task_type='probabilities', fitting_stimuli=train))\n` +
        `m.process(${stimVar})   # -> ${result.etype}`;
      return `m = load_model(${id})\n` +
        `m.start_task(TaskContext(task_type='probabilities', fitting_stimuli=train))\n` +
        `assembly = m.process(${stimVar})   # -> BehavioralAssembly (logistic head fit on a layer)`;
    }
    // neural encoding
    if (!result.ok) return `m = load_model(${id})\n` +
      `m.start_recording('${modelRegion}')\n` +
      `m.process(${stimVar})   # -> ${result.etype}`;
    if (state.multi && supported.length > 1) {
      const regs = [...new Set(supported.map(m => REGION_FOR[m] || 'IT'))];
      return `m = load_model(${id})   # region_modality_map routes each region to its tower\n` +
        `m.start_recording([${regs.map(r => `'${r}'`).join(', ')}])\n` +
        `assembly = m.process(${stimVar}, multi_modality=True)   # -> NeuroidAssembly (${supported.join(' + ')} towers)`;
    }
    const runMod = supported.length ? pickByPriority(supported) : inMods[0];
    const rt = towerFor(model, runMod);
    let note;
    if (input.id === 'movie') note = `   # ${model.name} reads only the ${runMod} track of the movie`;
    else if (runMod !== rt) note = `   # ${runMod === 'vision' ? 'still fed as a 1-frame clip' : 'frames sampled from the clip'} -> NeuroidAssembly`;
    else note = `   # -> NeuroidAssembly`;
    return `m = load_model(${id})\n` +
      `m.start_recording('${REGION_FOR[runMod] || 'IT'}')\n` +
      `assembly = m.process(${stimVar})${note}`;
  }

  // ============================ rendering ============================
  const state = { model: 'vlm', input: 'image', task: 'neural', multi: false };
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

  // ---- minimal, dependency-free Python highlighter (operates on escaped text) ----
  const PY_KW = new Set(('def return if elif else for while in and or not is None True False class ' +
    'import from as with try except finally raise lambda yield pass break continue global nonlocal ' +
    'assert del await async').split(' '));
  const PY_BUILTIN = new Set(('self cls print len range dict list set tuple int float str bool bytes ' +
    'super property staticmethod classmethod isinstance issubclass getattr hasattr setattr enumerate ' +
    'zip map filter sorted').split(' '));
  function pyHighlight(src) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // order matters: comment before string so a '#' outside a string wins its line
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[A-Za-z_]\w*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      out += esc(src.slice(last, m.index));
      last = re.lastIndex;
      if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;        // comment
      else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;   // string
      else if (m[3]) out += `<span class="d">${m[3]}</span>`;        // decorator
      else if (m[4]) out += `<span class="n">${m[4]}</span>`;        // number
      else {                                                          // identifier
        const id = m[5];
        if (PY_KW.has(id)) out += `<span class="k">${id}</span>`;
        else if (PY_BUILTIN.has(id)) out += `<span class="b">${id}</span>`;
        else if (src[re.lastIndex] === '(') out += `<span class="f">${id}</span>`;
        else out += id;
      }
    }
    return out + esc(src.slice(last));
  }
  function highlightPython(codeEl) { if (codeEl) codeEl.innerHTML = pyHighlight(codeEl.textContent); }

  function renderControls() {
    const mWrap = $('#arch-models'); mWrap.innerHTML = '';
    MODELS.forEach(m => {
      const b = el('button', 'arch-chip' + (m.id === state.model ? ' on' : ''),
        `<b>${m.name}</b><span>${m.eg}</span>`);
      b.onclick = () => { state.model = m.id; state.multi = defaultMulti(m, INPUTS.find(i => i.id === state.input)); renderAll(); };
      mWrap.appendChild(b);
    });
    const iWrap = $('#arch-inputs'); iWrap.innerHTML = '';
    INPUTS.forEach(inp => {
      const b = el('button', 'arch-chip' + (inp.id === state.input ? ' on' : ''),
        `<b>${inp.name}</b><span>${inp.event}</span>`);
      b.onclick = () => { state.input = inp.id; state.multi = defaultMulti(MODELS.find(m => m.id === state.model), inp); renderAll(); };
      iWrap.appendChild(b);
    });
  }

  function renderTaskRow() {
    const input = INPUTS.find(i => i.id === state.input);
    const row = $('#arch-taskrow');
    if (!input.perceptual) { row.style.display = 'none'; return; }
    row.style.display = '';
    const tWrap = $('#arch-tasks'); tWrap.innerHTML = '';
    TASKS.forEach(t => {
      const b = el('button', 'arch-task' + (t.id === state.task ? ' on' : ''),
        `${t.name}<small>${t.desc}</small>`);
      b.onclick = () => { state.task = t.id; renderAll(); };
      tWrap.appendChild(b);
    });
    const mm = $('#arch-multi');
    mm.style.display = (input.id === 'movie' && state.task === 'neural') ? 'inline-flex' : 'none';
    $('#arch-multi-cb').checked = state.multi;
  }

  function renderFlow() {
    const model = MODELS.find(m => m.id === state.model);
    const input = INPUTS.find(i => i.id === state.input);
    const task = input.perceptual ? state.task : null;
    const result = route(model, input, task, state.multi);

    // The interactive router shows the HONEST current dispatch — routes to an OutputEvent, or the
    // real exception. (What ELSE is theoretically routable lives in the matrix, not here.)
    const v = $('#arch-verdict');
    if (result.ok) {
      // honest caveat: cross-visual runs through an adapter; a movie runs on only one channel
      let caveat = '';
      if (input.perceptual) {
        const inMods = Array.isArray(input.modality) ? input.modality : [input.modality];
        const direct = inMods.filter(m => model.available.includes(m));
        const adapter = inMods.filter(m => !model.available.includes(m) && isVisual(m) && model.available.some(isVisual));
        if (input.id === 'movie' && direct.length) caveat = ` — <b>partial</b>: uses only the ${direct.join(' + ')} channel${direct.length > 1 ? 's' : ''} of the movie`;
        else if (!direct.length && adapter.length) caveat = ` — via ${adapterNeed(adapter[0])}`;
      }
      v.className = 'arch-verdict ok';
      v.innerHTML = `<span class="vbadge">✓ routes</span> resolves to <code>${result.output}</code>${caveat}`;
    } else {
      v.className = 'arch-verdict bad';
      v.innerHTML = `<span class="vbadge">✗ ${result.etype}</span> ${result.msg}`;
    }

    const flow = $('#arch-flow'); flow.innerHTML = '';
    result.steps.forEach((st, i) => {
      const box = el('div', 'flow-box ' + st.kind);
      box.innerHTML = `<div class="fb-label">${st.label}</div>` +
        (st.sub ? `<div class="fb-sub">${st.sub}</div>` : '') +
        (st.contract ? `<div class="fb-contract">${st.contract}</div>` : '');
      flow.appendChild(box);
      if (i < result.steps.length - 1) flow.appendChild(el('div', 'flow-arrow', '↓'));
    });
    if (!result.ok) {
      const e = el('div', 'flow-box error');
      e.innerHTML = `<div class="fb-label">${result.etype}</div><div class="fb-sub">${result.msg}</div>`;
      flow.appendChild(el('div', 'flow-arrow', '↓'));
      flow.appendChild(e);
    }

    // meta: example benchmark + model blurb
    $('#arch-meta').innerHTML =
      `<div class="kv"><span>example test</span><b>${result.bench || '—'}</b></div>` +
      `<div class="kv"><span>this model is</span><b>${model.blurb}</b></div>` +
      `<div class="kv"><span>declares</span><b>available={${model.available.join(', ') || '∅'}}` +
      `${model.required.length ? ` · required={${model.required.join(', ')}}` : ''}` +
      ` · wrappers={${model.wrappers.join(', ') || 'none'}}</b></div>`;

    // code
    $('#arch-code').textContent = snippet(model, input, task, result);
    highlightPython($('#arch-code'));
  }

  function renderMatrix() {
    const wrap = $('#arch-matrix'); if (!wrap) return;
    let html = '<table class="arch-mtx"><thead><tr><th></th>';
    INPUTS.forEach(i => html += `<th>${i.name}</th>`);
    html += '</tr></thead><tbody>';
    // green = routes; green + ◐ = partial (only part of a multimodal input); green + * = not
    // out-of-the-box (adapter or wired capability). amber = CompatibilityError, grey = NotImplementedError.
    const clsFor = c => c.tier === 'na' ? (c.etype === 'CompatibilityError' ? 'cm-compat' : 'cm-na') : 'cm-ok';
    const markFor = c => c.tier === 'optin' ? '<span class="mtx-star">*</span>'
      : (c.tier === 'partial' ? '<span class="mtx-part">◐</span>' : '');
    const textFor = c => c.tier === 'na' ? c.etype : c.out.replace(' (multi-tower)', '') + markFor(c);
    const tipFor = c => c.tier === 'routes' ? `routes today → ${c.out}${c.via ? ' (' + c.via + ')' : ''}`
      : c.tier === 'partial' ? `partial — ${c.need}`
      : c.tier === 'optin' ? `not out-of-the-box — ${c.need}`
      : c.need;
    const pill = c => `<span class="pill ${clsFor(c)}" title="${tipFor(c).replace(/"/g, '&quot;')}">${textFor(c)}</span>`;

    MODELS.forEach(m => {
      html += `<tr><th>${m.name}</th>`;
      INPUTS.forEach(inp => {
        if (inp.perceptual) {
          // two reachable outputs: neural encoding (top) and behavior (bottom)
          const nc = capability(m, inp), bc = behavioralCap(m, inp);
          html += `<td class="cm-multi" data-m="${m.id}" data-i="${inp.id}">` +
            `<div class="mc">${pill(nc)}</div><div class="mc">${pill(bc)}</div></td>`;
        } else {
          const c = capability(m, inp);
          html += `<td class="${clsFor(c)}" data-m="${m.id}" data-i="${inp.id}" ` +
            `title="${tipFor(c).replace(/"/g, '&quot;')}">${textFor(c)}</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
    wrap.querySelectorAll('td[data-m]').forEach(td => {
      td.onclick = () => {
        state.model = td.dataset.m; state.input = td.dataset.i;
        const inp = INPUTS.find(i => i.id === state.input);
        if (inp.perceptual) {
          // land on a task that resolves: neural if reachable, else the model's behavioral path
          const m = MODELS.find(x => x.id === state.model);
          state.task = capability(m, inp).tier !== 'na' ? 'neural'
            : (m.has.generation ? 'generation' : 'readout');
          state.multi = defaultMulti(m, inp);   // multi-tower model on a movie → use all towers
        }
        renderAll();
        $('#arch-explorer').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  function renderAll() {
    renderControls();
    renderTaskRow();
    renderFlow();
    renderMatrix();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const cb = document.querySelector('#arch-multi-cb');
      if (cb) cb.addEventListener('change', e => { state.multi = e.target.checked; renderFlow(); });
      renderAll();
      // colorize the static Python blocks (the interactive #arch-code is handled in renderFlow)
      document.querySelectorAll('.arch-section pre.code > code:not(#arch-code)').forEach(highlightPython);
    });
  }

  // Expose the pure routing engine for tests (no DOM required).
  const __api = { route, capability, behavioralCap, snippet, MODELS, INPUTS, TASKS };
  if (typeof module !== 'undefined' && module.exports) module.exports = __api;
  if (typeof window !== 'undefined') window.__ARCH = __api;
})();
