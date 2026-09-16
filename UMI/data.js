// Inlined results so the site opens from file:// without fetch/CORS issues.
// THIS FILE is the canonical data the site renders. (data/results.json is an
// earlier seed snapshot kept for reference; data/temporal_shift_null.json and
// data/nocache_roar.json are auxiliary snapshots and may use a different normalization
// (nocache_roar.json is ceiling-normalized, so its values differ from the raw scores rendered here).)
window.BSU_DATA = {
  "meta": {
    "title": "Brain-Score · A research framework on one unified model interface",
    "subtitle": "A neuroscientific toolbox for AI. Compare models with brain activity and human behavior, inspect what they do, and test how they change when you intervene.",
    "note": "UMI v2 is a development candidate. The examples below show working capabilities; broader production support is still being qualified.",
    "provenance": "Each example reports its own dataset, score scale, and limits. These experiments are separate from UMI v2 production qualification."
  },
  "hero_rotation": [
    {"model": "clip-vit-b-32", "benchmark": "MajajHong2015public.IT-pls", "comment": "# vision · neural: predict IT from image features"},
    {"model": "clip-vit-b-32", "benchmark": "Pereira2018.243sentences-linear", "comment": "# the SAME model, now a language benchmark"},
    {"model": "qwen2.5-vl-3b", "benchmark": "MajajHong2015public.IT-pls", "comment": "# a 3B VLM instead, identical call"},
    {"model": "gpt2", "benchmark": "Yeatman2021-lexical_decision-text", "comment": "# reading behavior, from strings alone"},
    {"model": "blip2-opt-2.7b", "benchmark": "MajajHong2015public.V4-pls", "comment": "# different model, different size, same three lines"},
    {"model": "vjepa1-vitl", "benchmark": "Lahner2024-fMRI-naturalistic-visualROI", "comment": "# video · naturalistic fMRI encoding"},
    {"model": "vjepa1-wav2vec2", "benchmark": "Lahner2024-fMRI-naturalistic-multimodal-visualROI", "comment": "# two towers (video + audio), one model object"},
    {"lines": [
      "from brainscore import load_model",
      "from brainscore.harnesses.gymnasium_harness import play_gym_episode",
      "model  = load_model(\"qwen2.5-vl-7b\")",
      "result = play_gym_episode(model, \"GridGame-5x5\")",
      "# embodied: the subject emits an action on the motor channel each tick"
    ]},
    {"lines": [
      "from brainscore import load_model, load_benchmark, apply_state_change",
      "model = load_model(\"qwen2.5-vl-3b\")",
      "apply_state_change(model, StateChange(target=vwf_units, perturbation=\"zero\"))  # lesion",
      "score = load_benchmark(\"Yeatman2021-lexical_decision-image\")(model)",
      "# perturbation: score the lesioned subject; model.reset() restores it"
    ]},
    {"model": "random-vit-b-32", "benchmark": "MajajHong2015public.IT-pls", "comment": "# even the null floor registers the same way"}
  ],
  "scaling": {
    "language_encoding": {
      "capability": "Predicting the brain: reading sentences (Pereira 2018)",
      "metric": "Brain-Score (share of the noise ceiling)",
      "models": ["random-vit", "CLIP-B32", "GPT-2", "BLIP-2", "Qwen-3B"],
      "scores": [0.439, 0.797, 0.835, 0.843, 0.927],
      "null_floor": 0.439,
      "reading": "How well each model predicts the brain's language network, with each sentence read in the context of its passage. Untrained features already score 0.44, because passage context alone carries structure the brain follows, so the bar to clear is high and that is the dashed line. The best model reaches 0.93 — about twice the floor. Nothing is pinned at the top any more, which matters: an earlier version of this chart used a different way of splitting the data for testing, one that let sentences from the same passage sit on both sides of the split. That leaks, it flattered every model, and the three largest all came out indistinguishable near the ceiling. The Brain-Score language team retired that method for exactly this reason. These numbers use the replacement, which holds out whole passages, and they are the ones comparable to the public leaderboard — we checked a model whose published figure we knew and reproduced it to three decimals. The ordering changed when we switched: BLIP-2 went from apparently first to third."
    },
    "it_encoding": {
      "capability": "Predicting the brain: seeing objects (MajajHong 2015)",
      "metric": "Brain-Score (share of the noise ceiling)",
      "models": ["random-vit", "Qwen-3B", "BLIP-2", "CLIP-B32"],
      "scores": [0.104, 0.315, 0.334, 0.374],
      "null_floor": 0.104,
      "reading": "How well each model predicts a high-level vision area (called IT). The surprise: bigger isn't better. CLIP, the smallest model here, predicts it best. What seems to matter is how the model was trained (CLIP learned by matching pictures to their captions), not its size. The gaps are small and we haven't formally tested whether they're real, so read this as suggestive; a result that doesn't climb with size is a reason to scrutinize the test, not a headline."
    },
    "video_encoding": {
      "capability": "Predicting the brain: watching video (Lahner 2024 BOLDMoments)",
      "metric": "Brain-Score (share of the noise ceiling)",
      "models": ["BLIP-2", "Qwen-3B", "VideoMAE", "V-JEPA2", "CLIP-B32", "V-JEPA1"],
      "scores": [0.250, 0.312, 0.445, 0.587, 0.634, 0.731],
      "ci_lo": [0.2464, 0.3075, 0.4393, 0.5802, 0.6288, 0.7272],
      "ci_hi": [0.2534, 0.3157, 0.4518, 0.5923, 0.6381, 0.7377],
      "null_floor": 0.0685,
      "reading": "How well each model predicts a brain watching short videos. The standout is V-JEPA v1, a video model trained to predict its own internal picture of a scene rather than to reproduce the exact pixels (VideoMAE, which does the pixel version, lands lower). So how a video model is trained matters more than whether it handles motion 'natively.' One honesty note: an earlier ranking had CLIP ahead of V-JEPA v2, and we checked whether that was just an unlucky choice of which internal layer to read. It wasn't (we tried every layer; the gap is real). The error bars are 95% bootstrap intervals over voxels: they don't overlap between V-JEPA v1, CLIP, and V-JEPA v2, so that ordering is a real difference, not noise. These scores ARE adjusted for how noisy the brain data is: each one is divided by the noise ceiling, the best score any model could possibly reach given how much the recordings themselves vary between repeats of the same clip. V-JEPA v1's 0.73 means it gets about 73% of the way to that ceiling. (That is 73% of the achievable match, not 73% of the signal explained -- squaring it gives the variance-explained figure, nearer 53%.) The adjustment puts these on the same footing as the object-vision and sentence-reading tests above."
    },
    "behavior_roar": {
      "capability": "Behavior: real vs. fake words (ROAR / Yeatman 2021)",
      "metric": "Brain-Score (share of the human ceiling)",
      "models": ["chance", "random-vit", "CLIP-B32", "BLIP-2", "GPT-2", "Qwen-3B"],
      "scores": [0.617, 0.666, 0.838, 0.974, 0.999, 1.147],
      "null_floor": 0.666,
      "reading": "Can each model tell real words from fake ones, the task used to screen for dyslexia? These are scored the way the benchmark reports them: as a share of the human ceiling, so 1.0 means matching the average person. Pure guessing lands at 0.62 and an untrained model barely beats it (0.67). GPT-2, a text-only model that never sees images, reaches 1.00 \u2014 dead level with humans \u2014 which tells us this task is really about knowing letter patterns, not about vision. Qwen, which answers by writing out its choice, goes past the line at 1.15: above 1.0 simply means it beat the average human, not that anything is broken."
    },
    "embodied_game": {
      "capability": "Playing: grid video game",
      "metric": "win rate",
      "models": ["random moves", "Qwen-VL 3B (CoT)", "Qwen-VL 7B (CoT)", "Gemma-4 12B (CoT)", "DeepSeek-R1 (ASCII)", "perfect player"],
      "scores": [0.20, 0.0, 0.53, 1.0, 0.87, 1.0],
      "null_floor": 0.20,
      "reading": "Can a model play a simple maze-style video game, looking at the board, picking a move, seeing what happens, then repeating? Moving at random wins about 1 in 5 (the floor); a perfect player wins every one (the 'oracle' ceiling). The three vision models all look at the same picture of the board: the small one (3B) fails completely (0.0), the medium one (7B), using chain-of-thought (CoT), wins about half (0.53), and the large one (12B) wins them all (1.0). Hand the board to a text-only model as an ASCII grid instead of an image (DeepSeek-R1) and it wins most (0.87). The lesson: for the smaller models the hard part isn't planning the route, it's seeing the board clearly from the picture, and that problem fades as the models get bigger. (15 games per model.)"
    },
    "multimodal_algonauts": {
      "capability": "Predicting the brain: watching a movie (Algonauts 2025 / CNeuroMod)",
      "metric": "raw correlation, NOT ceiling-normalized — compare bars to each other only",
      "models": ["text-only", "video-only", "audio-only", "combined", "banded (per-sense)"],
      "scores": [0.120, 0.150, 0.157, 0.186, 0.213],
      "null_floor": 0.05,
      "reading": "Predicting a brain watching a full movie, with picture, sound, and dialogue all at once. Each sense on its own predicts the brain a little (0.12–0.16); combining all three does better (0.19); and a smarter way of combining them, which lets each sense pull its own weight, does best (0.21). That matches the published benchmark's own baseline (about 0.20–0.25). The best published result reaches about 0.32 using a single native multimodal model. Whether that extra comes from the model itself or from a more polished pipeline, we haven't tested head-to-head. Worth knowing: an earlier version of this scored near zero, not because the senses don't help but because the model's features and the brain scans weren't lined up in time. Fixing the timing brought it up into the published range."
    },
    "whole_brain_encoding": {
      "capability": "Predicting the brain: listening to stories, everywhere at once (LeBel 2023)",
      "metric": "raw correlation, NOT ceiling-normalized — compare bars to each other only",
      "models": ["GPT-2 (124M)", "Qwen3.6 (27B)"],
      "scores": [0.1013, 0.1318],
      "null_floor": 0.0032,
      "reading": "Every other brain test on this page aims at one patch of cortex that was picked in advance because we expected the model to do well there. This one aims at all of it: 20,484 locations across the whole cortex of a person listening to stories, with nothing filtered out. Most of the brain turns out to be barely predictable from what a language model knows, and a minority is predicted well — that lopsided spread is the reason to look everywhere instead of at one region, and it is invisible if you only report the region you chose. Scrambling when each word was heard drops the score to nothing (the dashed line), so the models are genuinely tracking the story as it unfolds rather than its general flavour. Two models, 220-fold apart in size: the 27-billion one wins by about 30%. Real, but a long way short of what the size difference might suggest. If we narrow the same predictions down to just the parts of cortex known to handle language, both models do roughly twice as well there (0.20 for the small one), which is the sanity check that the whole-cortex number is diluted by regions that were never going to be predictable, not broken."
    }
  },
  "capability_status": {
    "note": "Evidence varies by capability. This table distinguishes scored examples from structural tests and demos; it is not a production support guarantee.",
    "rows": [
      {
        "capability": "Vision neural encoding",
        "example": "MajajHong2015 V4/IT",
        "status": "validated",
        "evidence": "Baseline manifest plus slow replay test preserve the anchored leaderboard scores."
      },
      {
        "capability": "Language neural encoding",
        "example": "Pereira2018",
        "status": "validated",
        "evidence": "Same regression-baseline path as vision; normal CI checks manifest shape, slow tier re-scores."
      },
      {
        "capability": "Behavioral lexical decision",
        "example": "ROAR / Yeatman2021",
        "status": "validated",
        "evidence": "Registered image/text variants, shared split, ceiling, and CLIP-above-chance scoring are tested."
      },
      {
        "capability": "Video neural encoding",
        "example": "Lahner2024 BOLDMoments",
        "status": "EC2-only",
        "evidence": "Local tests verify registration, temporal preprocessing, and V-JEPA wiring; full scoring is EC2-only."
      },
      {
        "capability": "Audio wrapper",
        "example": "Wav2Vec2-style features",
        "status": "structurally-tested",
        "evidence": "Construction, stimulus columns, aggregation, truncation, and cache keys are unit-tested without weights."
      },
      {
        "capability": "Audio+video fMRI",
        "example": "Lahner2024 multimodal",
        "status": "EC2-only",
        "evidence": "Registry, mode validation, null controls, and modality tagging are local; real forward/data runs are EC2-only."
      },
      {
        "capability": "Movie multimodal fMRI",
        "example": "Algonauts2025 / CNeuroMod",
        "status": "EC2-only",
        "evidence": "Twelve benchmark entries and scoring kernels are guarded locally; the data assembly is about 100 GB on EC2."
      },
      {
        "capability": "State-change perturbation",
        "example": "apply_state_change(...)",
        "status": "structurally-tested",
        "evidence": "Hook install, indexed ablation, concurrent handles, and reset are tested on a toy torch model."
      },
      {
        "capability": "Embodied action",
        "example": "GridGame action_fn",
        "status": "demo-only",
        "evidence": "Floor, ceiling, deterministic boards, and registration are tested; the game is an interface demo."
      },
      {
        "capability": "Closed-weight API behavior",
        "example": "OpenRouter / OpenAI-compatible",
        "status": "structurally-tested",
        "evidence": "Provider registration, lazy model construction, parsing, image payloads, and cache behavior are mocked locally."
      }
    ]
  },
  "limitations": {
    "title": "What to keep in mind",
    "items": [
      "On the IT vision test, the scores don't climb neatly with model size. We read that as a reason to scrutinize the test, not as a finding about scaling.",
      "The headline 'V-JEPA beats CLIP on video' only holds after a particular scoring choice and picking the best internal layer; change those and the ranking can move. (One related worry we ruled out: V-JEPA's second version trailing CLIP is real, not an artifact of which layer we read. We checked every layer.)",
      "On the video test, carefully picking the 'best' neurons barely beats picking at random: the brain signal is spread across many neurons, so cherry-picking doesn't help here. (This is the opposite of the reading-neurons experiment, where the chosen neurons genuinely mattered.)",
      "The video-game size comparison (small → medium → large) is only 15 games on a small board, a clear trend but a demonstration, not a precise law. And it's one specific game; a harder maze game gives very different numbers and isn't interchangeable.",
      "The 'brain map' visual that places model neurons on a cortex layout has only been checked on made-up test data, not real brain scans, and isn't part of any scored test.",
      "We reach the published movie-prediction range but not the very best published number (~0.32). We haven't run the controlled experiment that would say whether that gap is the model or the pipeline.",
      "Scores on this page are not all on one scale. Some are adjusted for how noisy each spot in the brain is and some are not; a few are accuracies or win rates rather than brain predictions at all. Each plot and table states its own scale, and that label is the one to trust — do not compare a number from one section against a number from another unless both say the same thing. Where a figure quotes a published result alongside ours, assume the two were computed differently unless it says otherwise. We also don't yet have error bars, so small differences between models may not be meaningful. We also don't yet have error bars, so small differences between models may not be meaningful.",
      "The 'dyslexia' effect depends on model size: it doesn't show up in the small model, barely in the medium, and clearly only in the large (32B) one. The original study saw it in an even larger model with an even gentler nudge; we haven't run that largest model."
    ]
  },
  "temporal_shift_validation": {
    "title": "A timing sanity-check, run on real brain scans",
    "subtitle": "One person watching movies in a scanner: 50,000 brain snapshots (one roughly every 1.5 seconds), matched against what an AI saw in the video",
    "shifts": [-12, -6, -3, 0, 3, 6, 12, 18],
    "scores": [0.024, 0.035, 0.055, 0.120, 0.132, 0.078, 0.040, 0.036],
    "true_delay": 3,
    "shuffle_floor": 0.009,
    "reading": "A check that we're lining things up in time correctly. When you see or hear something, your brain's response shows up in a scanner a few seconds late, because blood flow takes time to catch up to the neurons. So the AI's read on each moment of the movie only matches the brain scans when we nudge it forward by that few-second delay. The match is strongest at exactly that nudge (about 4.5 seconds) and falls off when we slide it too early or too late, in both directions. If the match had nothing to do with the movie, this curve would be flat. It isn't, which is the reassurance we wanted. (The dashed line is the match score after we deliberately scramble the timing, i.e. the no-signal floor.)"
  },
  "movie_brain": {
    "title": "Predict brain activity during a movie",
    "subtitle": "Compare recorded brain activity with a model’s prediction for a held-out movie clip. Step through the snapshots to explore the result. Agreement is measured by correlation, not by visual similarity between the maps.",
    "human": "assets/movie_brain_real/human/bold_",
    "tabs": [
      {"id": "qwen", "label": "MIRAGE (Qwen3-Omni)", "model": "assets/movie_brain_real/model_qwen/bold_", "per_tr_r": [0.1957, -0.0535, 0.1526, 0.1402, 0.3138, 0.4096, 0.374], "mean_r": 0.219},
      {"id": "tribe", "label": "Three-encoder comparison stack", "model": "assets/movie_brain_real/model_tribe/bold_", "per_tr_r": [0.2825, 0.2102, 0.2143, 0.2169, 0.0562, 0.2749, 0.2863], "mean_r": 0.220}
    ],
    "n": 7,
    "tr_sec": 1.49,
    "cachebust": "14",
    "transcript": ["spoken", "dialogue", "from", "the", "clip", "(not", "shown)"],
    "times": [29.8, 31.3, 32.8, 34.3, 35.8, 37.2, 38.7],
    "note": "Red = a spot more active than this clip's average; blue = less active. Both brains are drawn on the same scale so you can compare them side by side; what matters is the shape of the response (which areas light up where), not the exact brightness. How close they are is captured by the single match score (≈0.22); it's measured over just 7 brain snapshots here, so treat it as rough, since the model was tuned on far more data than this short window.",
    "reading": "The encoding fit excludes this Friends segment. Recorded fMRI and each prediction are standardized separately, then displayed on a shared color range. The curves report spatial correlations across parcels; they do not establish matched response amplitudes. MIRAGE uses Qwen3-Omni features. The comparison stack uses separate video, audio, and text encoders. These are archived renders; the raw arrays were not regenerated for this page revision.",
    "caption": "Seven snapshots, 1.49 seconds apart, from friends_s01e02a. The recording and predictions use the same times. Source code and metadata: assets/results/predict_clip_bold_dual.py and assets/results/movie.json."
  },
  "leaderboard": {
    "title": "Check predictions against external evaluation",
    "subtitle": "The Algonauts organizers scored held-out movie predictions. Compare that result with our local estimate; other benchmarks use different score scales.",
    "indist_title": "New episodes of a familiar show",
    "indist_bars": [
      {"label": "challenge baseline", "v": 0.20},
      {"label": "our model", "v": 0.229, "ours": true},
      {"label": "best published", "v": 0.31}
    ],
    "indist_note": "Score = how well the predicted brain response matches the real one across the brain (0 = chance). On new episodes of a show the model had seen other episodes of, it clears the challenge's own published baseline; the best published result uses a purpose-built model.",
    "ood_title": "Six films it had never seen",
    "ood_bars": [
      {"label": "Chaplin (silent B&W)", "v": 0.063},
      {"label": "Wheel of Time", "v": 0.104},
      {"label": "Planet Earth", "v": 0.120},
      {"label": "Passepartout", "v": 0.125},
      {"label": "Pulp Fiction", "v": 0.144},
      {"label": "Mononoke (anime)", "v": 0.162}
    ],
    "ood_avg": 0.120,
    "ood_top": 0.23,
    "ood_note": "Average across films 0.12 (dashed line); the best published out-of-distribution result is about 0.23. Hardest on the silent black-and-white Chaplin clip (no dialogue, and footage unlike anything modern encoders are built for) and easiest on the animated film.",
    "reading": "Two things matter here. **First, our own numbers held up under someone else's grading:** before submitting we measured 0.213 across parcels on held-out episodes (0.237 if you average rather than take the middle value), and the organizers graded the submission at 0.229 on their own metric. Those are consistent, though not a like-for-like match, since our summary and theirs are computed differently. The reassurance is that nothing moved much once someone else did the grading. The same model clears the challenge's published baseline on familiar material (0.23 vs about 0.20). **Second, the honest gap:** on genuinely new films the score roughly halves (0.12), well short of the best published ~0.23. That out-of-distribution gap is exactly where a stronger video encoder, or a purpose-built multimodal model like the challenge winner, earns its keep, and it's the next thing we're wiring in. The result to take away: one model, assembled the same way as everything else on this page, lands on a public neuroscience leaderboard above its baseline.",
    "caption": "How it was built: trained to predict four people's brain responses to earlier Friends episodes from the same picture + sound + dialogue features, then asked to predict held-out Season 7 episodes (the 'familiar show' test) and six entirely new films (the 'never seen' test). Scores are the challenge's own metric: a correlation between predicted and recorded brain activity, averaged across the brain and the four people."
  },
  "nulls": {
    "description": "Every test on this page comes with a deliberately broken version of itself (the same test, but with the real signal stripped out one specific way) so we know what a null-model score looks like. A good model has to clearly beat that floor; otherwise its score is just luck or bookkeeping. Here's the broken version we use for each kind of test, and the specific mistake it's designed to catch.",
    "entries": [
      {"capability": "predicting brain activity", "null": "an untrained model, or scrambled trials", "what_it_catches": "the test accidentally leaking the answer, or a predictor that's too flexible and overfits"},
      {"capability": "behavior (e.g. real vs. fake words)", "null": "pure guessing", "what_it_catches": "an easy task, or a predictor that memorizes the training set"},
      {"capability": "movies / multiple senses over time", "null": "deliberately mis-time the AI vs. the brain", "what_it_catches": "a match that's a timing coincidence; it must fall apart when mis-timed"},
      {"capability": "switching off neurons (the dyslexia test)", "null": "switch off the same number of random neurons", "what_it_catches": "general clumsy damage masquerading as a specific, targeted effect"},
      {"capability": "picking out special neurons", "null": "pick the same number at random", "what_it_catches": "claiming a group is special when random ones work just as well"},
      {"capability": "playing the video game", "null": "move at random", "what_it_catches": "a game so easy that flailing wins"}
    ]
  },
  "ablation": {
    "capability": "Giving an AI 'dyslexia' on purpose, by switching off its word-selective units (reproducing Honarmand et al. 2026)",
    "protocol": "Identify word-selective units, disable them, and repeat the task. Compare with disabling the same number of random units. No retraining is involved.",
    "mask_pct": [0, 6.9, 15, 25],
    "vwf_roar": [0.975, 0.963, 0.925, 0.537],
    "vwf_roar_sd": [0.0, 0.0, 0.0, 0.0],
    "random_roar": [0.975, 0.956, 0.938, 0.887],
    "random_roar_sd": [0.0, 0.006, 0.037, 0.075],
    "vwf_control": [0.87, 0.87, 0.87, 0.80],
    "random_control": [0.87, 0.87, 0.80, 0.80],
    "threshold": 0.65,
    "dissociation_note": "In the 32B experiment, word-decision accuracy falls from 0.98 to 0.54; the non-reading control falls from 0.87 to 0.80. The model mainly loses its ability to reject invented words. This differs from human dyslexia.",
    "brain_caption": "The highlighted visual word form area is an anatomical reference. This illustration does not locate model units in a human brain.",
    "scale_note": "The effect depends on model size. The 32B experiment shows a larger deficit than the tested 3B and 7B models.",
    "reading": "Disabling word-selective units reduces word-decision accuracy more than disabling random units. In the 32B run, accuracy falls to 0.54 versus 0.89 for the random control. A repeat reaches 0.51; one original selection setting was not recorded. The control uses only two random selections.\n\nThese curves come from a separate experiment, not the later built-in benchmark. The built-in 3B test shows a smaller deficit and does not cross its threshold. Neither result establishes a model of human dyslexia."
  },
  "selection": {
    "capability": "Gathering a model's 'reading' neurons from wherever they live",
    "layers": ["layer 5", "layer 10", "layer 16", "layer 20"],
    "selected_counts": [3, 50, 120, 18],
    "units_per_layer": 1024,
    "reading": "A model is built in stacked layers, like an assembly line. Instead of assuming the neurons we care about all sit in one layer, we let the tool collect them from wherever they actually are and treat that scattered group as a single functional unit. Here the model's word-word-selective units cluster in the middle-to-late layers, peaking around layer 16, which is where, in this kind of network, words have been recognized but not yet turned back into output."
  },
  "tools": {
    "title": "Tools for setting up an experiment",
    "subtitle": "Configure a supported model, choose layers to record, and compare readouts. Custom models may need an adapter and model-specific setup.",
    "autoreg": {
      "tag": "Tool 1 · Plug a model in",
      "name": "Auto-setup",
      "caption": "For supported models, auto-setup proposes the input processing and recording layers. Review that setup before scoring a new model."
    },
    "layermap": {
      "tag": "Tool 2 · Match a layer to a brain area",
      "name": "Layer mapping",
      "caption": "Compare layers on training data, then evaluate the chosen readout on held-out data."
    }
  },
  "layer_mapping": {
    "title": "Choose which model features to record",
    "subtitle": "Compare whole layers with selected units. Each readout uses held-out clips, the same score scale, and a random-unit control.",
    "approaches_title": "How well each way of reading the model scores, as you give it more neurons",
    "metric_note": "Scores are prediction correlations adjusted for measurement noise: each brain recording site’s correlation is divided by its estimated noise ceiling, then the median is reported. Higher is better; 1.0 is the estimated ceiling, not a strict mathematical maximum.",
    "per_layer_r": [0.2426, 0.2483, 0.2561, 0.2685, 0.2672, 0.269, 0.276, 0.2888, 0.2917, 0.3033, 0.326, 0.3383, 0.3608, 0.3777, 0.4033, 0.4054, 0.4107, 0.4026, 0.3885, 0.3811, 0.3752, 0.3384, 0.3298, 0.3219],
    "best_layer": 16,
    "best_r": 0.4107,
    "current_layer": 16,
    "budget_curve": {
      "x_title": "number of neurons used to read the model",
      "y_title": "ceiling-normalized score (0–1)",
      "budgets": [16, 32, 64, 100, 128, 256, 512, 1024],
      "within": [0.6224, 0.6645, 0.6992, 0.7200, 0.7307, 0.7470, 0.7689, 0.7765],
      "within_random": [0.4672, 0.5873, 0.6566, 0.7023, 0.7169, 0.7485, 0.7685, 0.7765],
      "pooled": [0.5451, 0.6337, 0.6968, 0.7147, 0.7221, 0.7453, 0.7625, 0.7668],
      "pooled_random": [0.4572, 0.5760, 0.6527, 0.6917, 0.7062, 0.7386, 0.7574, 0.7681],
      "whole_layer": 0.7765,
      "several_layers": 0.7711,
      "crossover_k": 256
    },
    "table_title": "The four ways to read the model, ranked (now an apples-to-apples comparison)",
    "strategies_table": [
      {"name": "Standard — read the whole best layer", "features": 1024, "score": 0.776, "best": true},
      {"name": "Several whole layers (top 3 combined)", "features": 3072, "score": 0.771},
      {"name": "Best neurons in one layer (256 of them)", "features": 256, "score": 0.747},
      {"name": "Best neurons pooled across layers (256)", "features": 256, "score": 0.745}
    ],
    "heatmap_img": "assets/vjepa2_unit_heatmap.png",
    "cachebust": "2",
    "heatmap_caption": "A map of how strongly each individual neuron, layer by layer, tracks the brain (brighter = better). Note this panel alone is measured differently from every score elsewhere on the page: it is each neuron's direct correlation with its best-matching voxel, not a fitted, held-out prediction, and it is not ceiling-divided \u2014 so read it as a map of where signal sits, not as a score. The best neurons sit in the middle-to-late layers, but the curve on the right shows the twist: once you read a few hundred of them together, hand-picking the best stops mattering, because the signal is spread across the whole layer.",
    "reading": "The whole best layer scores 0.7765. A compact selection of 256 units pooled across three layers scores 0.7453. Calibrated banded ridge across all 24 layers reaches 0.7846, a small observed gain whose uncertainty was not measured. These choices use different feature counts and fitting methods. Use the budget curve to compare selections at the same feature count.",
    "deep_dive": {
      "title": "Going deeper: is one layer really enough? (three stress-tests; where these cards show a score it is ceiling-normalized, unlike the raw layer-sweep chart above — the middle card is a count of dimensions, not a score)",
      "lead": "\"One layer is plenty\" is a surprising result, so we checked it three ways, and they all point to the same simple reason.",
      "cards": [
        {"stat": "+0.01", "title": "Combine all 24 layers with banded ridge", "body": "Banded ridge tunes the contribution of each layer using cross-validation. In the calibrated run, all 24 layers score 0.7846 versus 0.7765 for one layer. This small observed difference does not establish statistical significance."},
        {"stat": "≈14", "title": "effective dimensions in the signal", "body": "This brain area's response to the clips boils down to only about 14 effective dimensions, and the model's features are about the same width (≈13). One layer already captures them, which is exactly why one layer is enough and why a random handful of neurons does nearly as well."},
        {"stat": "0.78 → 0.01", "title": "Scramble test (sanity check)", "body": "Shuffle which clip goes with which brain response, and the score collapses to almost nothing. Proof that the scores above are real signal, not the method finding shapes in noise."}
      ],
      "pc_chart": {
        "title": "How well the model predicts each of the brain's main patterns",
        "x_title": "the brain's patterns, most common → least",
        "y_title": "raw correlation (not ceiling-normalized)",
        "labels": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
        "r": [0.78,0.86,0.84,0.79,0.71,0.60,0.73,0.74,0.61,0.53,0.68,0.61,0.54,0.63,0.64,0.32,0.29,0.53,0.44,0.48],
        "caption": "The model nails the brain's most prominent patterns (the first four at 78–86%) and fades out toward the rarer ones. In total about 35 of the brain's patterns are predictable; that handful is the entire brain-matching signal, which is why one well-chosen layer captures it all."
      }
    }
  },
  "generalize": {
    "title": "Check the method across datasets",
    "subtitle": "Compare layer mapping across six brain datasets and five model families, including a larger dataset.",
    "dim_title": "The brain signal stays simple, no matter how much data you throw at it",
    "dim_note": "Each brain area's response to images boils down to only about 10–22 effective dimensions. Feeding the analysis 25× more pictures (243 → 6,000) doesn't raise that number, so it's a real property of the brain, not a shortage of data. This is exactly why a single well-chosen model layer is enough to capture it, everywhere we looked.",
    "dim_bars": [
      {"label": "reading sentences", "n": 243, "dim": 21.5},
      {"label": "natural scenes (NSD)", "n": 515, "dim": 20.1},
      {"label": "short video", "n": 1026, "dim": 14.0},
      {"label": "objects", "n": 3200, "dim": 16.3},
      {"label": "7T natural scenes", "n": 6000, "dim": 14.3}
    ],
    "hier_title": "Deeper brain areas line up with deeper model layers",
    "hier_note": "When a dataset covers the full visual ladder, V1 (first stop) through IT (last), the brain's processing stages match the model's: early areas align with early layers, late areas with late layers. A plain image-recognition network (a CNN) shows it most cleanly; an image-text model (CLIP) shows a flatter, compressed version. (This is why one benchmark with only late areas couldn't see it: you need the whole ladder.)",
    "hier_rois": ["V1", "V2", "V4", "IT"],
    "hier_lines": [
      {"name": "CNN (ResNet-50)", "depth": [0.0, 0.0, 0.33, 0.67], "color": "#1f9d57"},
      {"name": "image model (CLIP)", "depth": [0.36, 0.36, 0.36, 0.45], "color": "#2f6bff"}
    ],
    "reading": "Three findings held across every dataset, model, and scale we tried. (1) The brain's response to images is LOW-DIMENSIONAL, about 10–22 effective dimensions per area, and pouring in 12× more high-quality data (a 7-Tesla scanner, 6,000 images) didn't budge it. We even confirmed it replicates across separate people. (2) Because the signal is that simple, a single well-chosen layer captures essentially all of it; elaborate 'combine many layers' or 'hand-pick the best neurons' schemes barely help. (3) Deeper brain areas match deeper model layers (V1→IT lines up with early→late), cleanest for a plain CNN. The one twist worth flagging: HOW you score matters. Measuring 'can the model predict the brain' versus 'does the model's internal geometry match the brain' can flip which model looks most brain-like, and even whether hand-picking neurons helps (it helps for vision, hurts for language). So the honest move is to report both."
  },
  "fusion_compare": {
    "title": "Compare ways to combine vision, audio, and text",
    "subtitle": "Compare features from three specialist encoders with features from one multimodal model. The downstream predictor is held fixed.",
    "appr_title": "How well each option predicts the brain (each at its best setting)",
    "bars": [
      {"name": "V-JEPA-2+Wav2Vec-Bert+Llama (TRIBEv2), best layers", "kind": "posthoc", "fusion": "post-hoc", "dim": 5120, "r": 0.1564, "extract_min": 29.6},
      {"name": "Qwen3-Omni-30B (MIRAGE), best layer (42)", "kind": "native", "fusion": "native", "dim": 2048, "r": 0.1546, "extract_min": 67.7},
      {"name": "V-JEPA-2 video (best L14)", "kind": "modality", "fusion": "unimodal", "dim": 1024, "r": 0.127, "extract_min": 26.8},
      {"name": "Wav2Vec-Bert audio (best L12)", "kind": "modality", "fusion": "unimodal", "dim": 1024, "r": 0.1238, "extract_min": 1.6},
      {"name": "Llama-3.2-3B text (best L14)", "kind": "modality", "fusion": "unimodal", "dim": 3072, "r": 0.079, "extract_min": 1.2}
    ],
    "reading": "Answer: it's a tie. The three separate encoders combined score 0.156; the single native multimodal model scores 0.155, too close to call. So mixing the senses inside a single (much larger) model doesn't beat three strong specialists here. A wrinkle worth flagging, because it shows why care matters: our first pass made the combined model look slightly ahead, but that was a measurement slip. We'd been reading the audio specialist at the wrong internal spot (its very last stage), where it predicts the brain poorly (0.088); reading it at its best stage nearly doubles its score (0.124) and the apparent lead vanishes. Of the three senses, the picture and the sound carry most of the signal (0.127 and 0.124); the dialogue carries less (0.079), which makes sense for a Friends clip that's mostly driven by what you see and hear. Bottom line: a well-tuned set of separate specialists matches the big native multimodal model, and costs far less to run (about 30 minutes on an ordinary GPU vs. over an hour on four high-end ones).",
    "caveat": "The tie can't be pinned entirely on 'mixing the senses,' because the two sides are different models of different sizes, so 'a strong specialist stack ties the native multimodal model' is the fair reading, not 'mixing the senses is useless.' For clean proof that mixing DOES help, see the curve below: it reads the SAME native multimodal model at successive internal stages, so nothing changes except how much the senses have been combined, and the prediction climbs from 0.123 (before they're mixed) to 0.155 (after). So mixing helps inside the model; it just ends up only matching the three separate encoders, because each specialist is individually stronger than that model's own built-in sense-detectors. All the scores here (~0.15) are floors, not final numbers: they use one person and a small slice of the data, a single internal stage per model, and a simple predictor rather than a fully-trained one.",
    "within_qwen": {
      "layers": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48],
      "r": [0.1233, 0.127, 0.1281, 0.1303, 0.1323, 0.1353, 0.1383, 0.1388, 0.1387, 0.1412, 0.1437, 0.1477, 0.1499, 0.1511, 0.152, 0.1531, 0.1524, 0.1532, 0.1534, 0.1529, 0.1542, 0.1546, 0.1537, 0.1522, 0.1429],
      "peak_layer": 42, "fusion_off_r": 0.1233, "peak_r": 0.1546
    },
    "curve_caption": "Reading the one native multimodal model at successive internal stages (left = early, right = late). At the very start, before it has combined the picture, sound, and words, it predicts the brain worst (0.123). As you go deeper and the senses get mixed together, the prediction steadily improves, peaking near the end (0.155). The climb is the value of combining the senses, and because it's the exact same model start to finish, nothing else can explain it. (It dips at the very last stage, where the model shifts to its own job of predicting the next word.)"
  },
  "models_glossary": {
    "title": "The models, in plain terms",
    "subtitle": "A quick who's-who of every AI model on this page and what it's built to do",
    "models": [
      {"name": "CLIP", "kind": "small image model", "desc": "A small, fast model that learned by matching photos to their captions. Handles images well and is our lightweight baseline, and, surprisingly, often the most brain-like on vision."},
      {"name": "BLIP-2", "kind": "image-captioning model", "desc": "A larger model built to describe pictures in words. It's good at captioning but wasn't trained to follow instructions, so it can't reliably answer a direct question."},
      {"name": "Qwen2.5-VL (3B / 7B / 32B)", "kind": "vision-language model (VLM)", "desc": "A model that looks at images and answers questions about them, in three sizes (small / medium / large). The strongest reader here, and the one big enough to show the 'dyslexia' effect when we switch off its word-selective units."},
      {"name": "GPT-2", "kind": "text-only model", "desc": "A small model that only reads text, with no vision at all. Notably, it tells real words from fake ones as well as humans do, working purely from the letters."},
      {"name": "V-JEPA / V-JEPA2", "kind": "video models", "desc": "Video models that learned by predicting their own internal picture of a scene (rather than the exact pixels). The best at predicting a brain watching video."},
      {"name": "VideoMAE", "kind": "video model", "desc": "A video model that learned by reproducing exact pixels. Handles motion, but its pixel-copying training transfers less well to predicting the brain."},
      {"name": "Wav2Vec2 · MiniLM", "kind": "a sound model + a text model", "desc": "The audio encoder (a speech/sound model) and the text encoder (a sentence-embedding model), used with a video encoder to predict a brain watching a full movie."},
      {"name": "random-ViT", "kind": "sanity-check floor", "desc": "An untrained model with the same wiring as CLIP, but its connections are random noise. Shows how high a score you can get from nothing (~0.54 on the word task)."},
      {"name": "chance", "kind": "sanity-check floor", "desc": "A 'model' that just guesses, ignoring its input entirely. The rock-bottom floor, 0.50 on a yes/no task."},
      {"name": "oracle", "kind": "perfect-player ceiling", "desc": "A built-in cheat that always makes the perfect move in the video game. Defines the best possible score: the ceiling everything else is measured against."}
    ]
  },
  "embodied_game": {
    "title": "Test a model that acts on what it sees",
    "subtitle": "The model sees a board, chooses a move, and receives the next observation. This grid-game demo tests an action loop; it does not establish brain alignment or robotics performance.",
    "models": ["random moves", "Qwen-VL 3B (CoT)", "Qwen-VL 7B (CoT)", "Gemma-4 12B (CoT)", "DeepSeek-R1 (ASCII)", "perfect player"],
    "success": [0.20, 0.0, 0.533, 1.0, 0.867, 1.0],
    "colors": ["#9aa0a6", "#d8483b", "#e0a13b", "#2a8c6a", "#7c4dff", "#1f9d57"],
    "null_floor": 0.20,
    "reading": "Two findings. (1) HOW you ask matters: when the medium model is forced to answer in one word it wins only 13% of games; let it use chain-of-thought and it wins 53%. (2) BIGGER MODELS SEE BETTER: the three VLMs, all looking at the same picture of the board and all using chain-of-thought, win 0% (small), 53% (medium), and 100% (large). Hand the very same board to a text-only model as an ASCII grid instead of an image, and it wins 87%. So for the smaller models the bottleneck isn't figuring out the right move, it's reading the board off the picture in the first place, and that clears up as the models get bigger."
  },
  "layer_contribution": {
    "title": "Find which layers predict brain activity",
    "subtitle": "Compare layers within the audio, text, and video encoders. Brighter cells indicate higher brain-prediction scores.",
    "order": ["audio", "text", "video"],
    "labels": ["sound (Wav2Vec2)", "words (MiniLM)", "video (CLIP)"],
    "values": {
      "audio": [0.129, 0.143, 0.148, 0.149, 0.148, 0.146, 0.149, 0.152, 0.152, 0.146, 0.137, 0.13, 0.119],
      "text": [0.107, 0.124, 0.129, 0.129, 0.126, 0.124, 0.117],
      "video": [0.041, 0.053, 0.056, 0.07, 0.094, 0.11, 0.117, 0.126, 0.131, 0.145, 0.161, 0.166, 0.168]
    },
    "reading": "The three models don't carry their brain-like signal in the same place. The words model is most brain-like early on (around its 3rd layer), the sound model in its middle (layer 7), and the video model right at the very end (its last layer). Each square is measured directly (how well that one layer predicts the brain) and each row is scaled to show its own shape, so you're comparing where each model peaks, not which model wins."
  },
  "all_paths": {
    "title": "Compare different ways to obtain an answer",
    "subtitle": "Run the word task using internal features, generated answers, or both, where the model supports them.",
    "chance": 0.617,
    "null_floor": 0.666,
    "pathColors": {"readout": "#3b7dd8", "generation": "#e0a13b", "instr-readout": "#7c5bff"},
    "models": ["chance", "random-ViT", "CLIP", "GPT-2", "BLIP-2", "Qwen"],
    "rows": [
      {"model": "CLIP", "input": "image", "path": "readout", "score": 0.838},
      {"model": "BLIP-2", "input": "image", "path": "readout", "score": 0.974},
      {"model": "BLIP-2", "input": "image", "path": "generation", "score": 0.617},
      {"model": "BLIP-2", "input": "text", "path": "generation", "score": 0.592},
      {"model": "BLIP-2", "input": "image + instruct", "path": "instr-readout", "score": 1.134},
      {"model": "Qwen", "input": "image", "path": "readout", "score": 0.912},
      {"model": "Qwen", "input": "image", "path": "generation", "score": 1.147},
      {"model": "Qwen", "input": "text", "path": "generation", "score": 1.159},
      {"model": "Qwen", "input": "image + instruct", "path": "instr-readout", "score": 1.208},
      {"model": "GPT-2", "input": "text", "path": "readout", "score": 0.999},
      {"model": "GPT-2", "input": "text", "path": "generation", "score": 1.048},
      {"model": "random-ViT", "input": "image", "path": "readout", "score": 0.666},
      {"model": "chance", "input": "—", "path": "readout", "score": 0.617}
    ],
    "reading": "The same model can score differently depending on how its decision is obtained. Qwen scores 0.912 from image features, 1.147 from a written answer to the image, and 1.208 from features recorded with task instructions. The last method records instructed activity; it is not a chain-of-thought experiment. GPT-2 uses word likelihoods instead of written answers for the output route. All values are accuracy divided by the human reference (about 81.1% correct), so they can exceed 1.0. Inputs and fitting procedures differ; these points do not isolate a single cause."
  },
  "benchmark_mechanics": {
    "title": "Inside a benchmark",
    "subtitle": "Follow the word-decision task from stimulus to response and score.",
    "task": "Each trial shows a picture of a letter string, a real word like 'animal' or a fake one like 'accastant', and the model has to decide which it is. There are 400 practice trials and 100 graded ones; scoring below 65% is the threshold a person would be flagged as dyslexic.",
    "paths": [
      {"name": "Reading its features", "models": "CLIP, GPT-2, any model", "how": "We look at the model's internal response to each letter string and train a simple yes/no rule on the 400 practice trials, then test it. The model never says a word; its internal response just has to look different for real words versus fake ones."},
      {"name": "Writing an answer", "models": "Qwen, BLIP-2, instruction-following models", "how": "We show the image and literally ask 'is this a real word?', then read the model's written reply. This only works for models trained to follow instructions, and it's the path the original dyslexia study used."}
    ],
    "floors": [
      {"label": "guessing", "value": 0.617},
      {"label": "untrained model", "value": 0.666},
      {"label": "CLIP", "value": 0.838}
    ],
    "answer": "CLIP reaches 0.84 of the human ceiling by the first route, reading its features, even though it can't write an answer. Its caption-matching training left it sensitive to what real words look like. The honest way to read that 0.84 is against the floors: pure guessing is 0.62 and an untrained model is 0.67, so CLIP's score is +0.17 of genuine learned word-knowledge above what you'd get for free, not the scoring trick overfitting."
  },
  "inputs": [
    {"type": "image", "score": "0.374", "scored_with": "CLIP ViT-B/32", "scale": "share of the noise ceiling (untrained floor 0.104)", "cortex": "cortex_image.png", "example": "a natural photograph", "benchmark": "MajajHong2015public.IT-pls — monkey inferior-temporal recordings", "desc": "A still photo. The model returns its response to each photo and we ask how much of the recorded IT response that predicts."},
    {"type": "text", "score": "0.927", "scored_with": "Qwen2.5-VL-3B", "scale": "share of the noise ceiling (untrained floor 0.439)", "cortex": "cortex_text.png", "example": "a sentence", "benchmark": "Pereira2018.243sentences-ridge — human language-network fMRI", "desc": "A written sentence. The model returns its response to each sentence, scored against the language network's."},
    {"type": "audio", "score": "0.157", "scored_with": "Wav2Vec2-base", "scale": "raw correlation, not ceiling-divided", "cortex": "cortex_audio.png", "example": "a speech / environmental sound clip", "benchmark": "Algonauts2025-friends-sub01, sound tower only", "desc": "A sound clip. Sound alone already predicts a meaningful slice of the movie-watching response."},
    {"type": "video", "score": "0.731", "scored_with": "V-JEPA v1 ViT-L", "scale": "share of the noise ceiling (measured 2026-07-31)", "cortex": "cortex_real_video_left_lateral.png", "cortex_measured": true, "example": "a 3-second clip", "benchmark": "Lahner2024-fMRI-naturalistic-visualROI — BOLDMoments", "desc": "A short video. The best video model here beats the best still-image model on the same voxels."},
    {"type": "video + audio", "score": "0.461", "scored_with": "V-JEPA v1 + Wav2Vec2", "scale": "raw correlation, not ceiling-divided", "cortex": "cortex_real_videoaudio_left_lateral.png", "cortex_measured": true, "example": "a 3-second clip with its soundtrack", "benchmark": "Lahner2024-fMRI-naturalistic-multimodal-visualROI", "desc": "Picture and sound handed to one model with two towers. On visual voxels this scores BELOW video alone: the sound features dilute the fit rather than adding to it. We report it because it is what happened."},
    {"type": "video + audio + text", "score": "0.213", "scored_with": "CLIP + Wav2Vec2 + MiniLM", "scale": "raw correlation, not ceiling-divided", "cortex": "cortex_videoaudiotext.png", "example": "a movie scene with dialogue + subtitles", "benchmark": "Algonauts2025-friends-sub01, all three towers", "desc": "The full movie experience: picture, sound, and dialogue. Here combining does help, unlike the pairing above — but only once each sense gets its own weighting."},
    {"type": "a live loop", "score": "1.00", "scored_with": "Gemma-4-12B (step-by-step)", "scale": "win rate (random-move floor 0.20)", "cortex": null, "example": "one frame of a game board, then whatever the model's move produces next", "benchmark": "GridGame-reach-5x5 — closed-loop, one tick at a time", "desc": "The only entry here that genuinely streams. The model sees a frame, picks a move, the world updates, and the next frame depends on what it just did — so the input cannot be prepared in advance the way a fixed set of clips can. Frames go in and actions come back over the same hand-off, tick after tick, for as long as the episode lasts."}, {"type": "hours of continuous viewing", "score": "0.213", "scored_with": "CLIP + Wav2Vec2 + MiniLM", "scale": "raw correlation, not ceiling-divided", "cortex": "cortex_videoaudiotext.png", "example": "six seasons of a TV show plus several films, sampled at the brain's own rate", "benchmark": "Algonauts2025-friends-sub01 — 162,671 brain snapshots", "desc": "Not a clip at a time: many hours of episodes and films, each sampled once per brain snapshot (one every 1.49 s), so what is scored is a time course rather than a handful of separate clips. The model answers per snapshot. The frames are handed over as one large set, not fed in live — the benchmark is time-resolved, but it is not yet a real-time stream."}
  ],
  "witness": {
    "title": "Record what happened during an experiment",
    "subtitle": "Capture inputs, responses, and available internal activity while a test runs. Use the record to inspect model behavior.",
    "modes": ["recording brain-like activity", "reading its features", "writing an answer", "taking an action", "switching neurons off"],
    "panels": [
      {"img": "assets/witness_game_0.png", "caption": "Call 0: the recorder saves the board and navigation instruction. The test agent returns action 1: down."},
      {"img": "assets/witness_game_2.png", "caption": "Call 2: the recorder saves the updated board and the returned action 3: right, toward the goal."}
    ],
    "reading": "We attach a quiet observer that, for the length of a test, notes one entry every time the model is handed something. Because every capability flows through that single point, this one observer covers them all: the same kind of record whether the model is looking at images, reading sentences, playing a game, or having its neurons switched off."
  },
  "percept": {
    "title": "See the input after preprocessing",
    "subtitle": "Inspect the image after resizing, cropping, and normalization. This can reveal information lost before it reaches the model.",
    "tabs": [
      {
        "id": "crop",
        "label": "Shrink & crop",
        "columns": ["what we showed", "raw form (not viewable)", "what the model saw"],
        "rows": [
          {"label": "Wide 640×360", "presented": "assets/percept/0_presented.png", "tensor": "assets/percept/0_tensor.png", "percept": "assets/percept/0_percept.png", "note": "The crop to a square throws away the green left edge and gold right edge entirely; the model never saw them. The top and bottom survive."},
          {"label": "Tall 360×640", "presented": "assets/percept/1_presented.png", "tensor": "assets/percept/1_tensor.png", "percept": "assets/percept/1_percept.png", "note": "Now it's the top and bottom that get cut and the left/right edges that survive: the crop flips depending on the picture's shape."},
          {"label": "Square 360×360", "presented": "assets/percept/2_presented.png", "tensor": "assets/percept/2_tensor.png", "percept": "assets/percept/2_percept.png", "note": "A square picture needs no cropping; all four edges survive, only the shrink happens. The colours come back faithfully once we undo the colour-adjustment."}
        ],
        "reading": "Left = the picture we handed in. Middle = the colour-adjusted form the model actually works in, false-coloured and not meant for human eyes, which is exactly why we have to reconstruct it. Right = our reconstruction, undoing the colour-adjustment. Compare left and right: the crop genuinely removes pieces of the picture (the labelled edges), so 'what we showed' and 'what the model saw' are not the same image.",
        "caveat": "This panel uses CLIP's exact shrink-and-crop recipe; that's a property of the preparation step, not the model's intelligence, so no actual model weights are needed to demonstrate it. The tool captures this same picture on a real model; it shows the input going in, not the model's internal thoughts afterward."
      },
      {
        "id": "rajalingham",
        "label": "Rajalingham 2018 matching task",
        "columns": ["what we showed", "raw form (not viewable)", "what the model saw"],
        "rows": [
          {"label": "Trial 0 (502×586)", "presented": "assets/raj2afc_montage_0.png", "tensor": "assets/percept/raj0_tensor.png", "percept": "assets/percept/raj0_percept.png", "note": "The crop trims the 'SAMPLE' caption at the top and the 'LEFT'/'RIGHT' captions at the bottom, but the sample picture and both choices survive untouched."},
          {"label": "Trial 2 (502×586)", "presented": "assets/raj2afc_montage_2.png", "tensor": "assets/percept/raj1_tensor.png", "percept": "assets/percept/raj1_percept.png", "note": "Same layout, same trim. Everything needed to make the choice survives; only the text captions at the very top and bottom are cut."}
        ],
        "reading": "This is the picture CLIP actually saw on the object-matching task. The shrink-and-crop trims the text captions at the top and bottom ('SAMPLE', 'LEFT', 'RIGHT') while the sample picture and the two choices come through intact. So the model made its choice from the pictures themselves, not by reading the printed labels, something you'd only know by reconstructing what it really took in.",
        "caveat": "This is specifically CLIP's view. The chat-style models (Qwen, Gemma) don't crop to a square; they shrink the whole thing, so they saw the full picture including every caption. This panel doesn't represent what those models saw."
      },
      {
        "id": "multimodal",
        "label": "Image + words together",
        "columns": ["what we showed", "the form it's stored in", "what the model saw"],
        "rows": [
          {"kind": "image", "label": "The picture side", "presented": "assets/percept/mm_vision_presented.png", "tensor": "assets/percept/mm_vision_tensor.png", "percept": "assets/percept/mm_vision_percept.png", "note": "The picture branch: shrunk and colour-adjusted, then undone for viewing. This, a wrench on a mountainside, is exactly what the model's 'eyes' took in."},
          {"kind": "text", "label": "The words side", "presented": "\"a photo of a wrench on a mountainside\"", "tensor": "[49406, 320, 1125, 539, 320, 30980, 525, 320, 14547, 1145, 49407, … ]  ·  padded out to a fixed length", "percept": "<start> a photo of a wrench on a mountainside <end>  … <end> repeated as padding", "note": "Before a model reads text it chops it into pieces and turns them into numbers. 'wrench' becomes one piece; 'mountainside' is split into two ('mountain' + 'side'). It also tacks on start/end markers and pads to a fixed length, and that's exactly what the model read."}
        ],
        "reading": "A model that handles BOTH a picture and a caption (here CLIP) takes them in through two doors at once. The tool listens at both, catching the picture as pixels and the caption as the numbered word-pieces the model actually reads, and shows each back in its own way: undo the colour-adjustment for the picture, turn the numbers back into words for the text. One mechanism, every kind of input; on a video-and-sound model the same approach would hand back sampled frames and a sound wave.",
        "caveat": "The text 'what the model saw' is the numbered pieces turned back into words, faithful to what the model read (the markers, the split words, the padding), but it's the words reconstructed from those pieces, not an actual picture. Sound comes back as a sound wave, which for some models can't be perfectly turned back into the original audio."
      }
    ]
  },
  "rajalingham": {
    "title": "Compare model choices with human choices",
    "subtitle": "Show a target, then ask the model to choose the matching object. The score measures whether models and people find the same images difficult. These raw scores use different response methods and cannot be compared directly with the normalized public leaderboard.",
    "metric": "i2n raw (image-level, vs the human pool)",
    "binary_ceiling": 0.33,
    "readout_band": "~0.30-0.50",
    "rows": [
      {"model": "random null", "mode": "—", "acc": 0.510, "frac_left": null, "i2n": -0.028, "kind": "null"},
      {"model": "CLIP", "mode": "similarity", "acc": 0.662, "frac_left": 0.49, "i2n": 0.061, "kind": "feature"},
      {"model": "Qwen-VL-3B", "mode": "CoT", "acc": 0.497, "frac_left": null, "i2n": 0.006, "kind": "cot"},
      {"model": "Qwen-VL-3B", "mode": "direct", "acc": 0.634, "frac_left": 0.85, "i2n": 0.064, "kind": "direct"},
      {"model": "Qwen-VL-3B", "mode": "direct + 4-shot", "acc": 0.506, "frac_left": 0.99, "i2n": 0.010, "kind": "fewshot"},
      {"model": "Qwen-VL-7B", "mode": "CoT", "acc": 0.562, "frac_left": 0.89, "i2n": 0.031, "kind": "cot"},
      {"model": "Qwen-VL-7B", "mode": "direct", "acc": 0.859, "frac_left": 0.47, "i2n": 0.163, "kind": "direct"},
      {"model": "Qwen-VL-7B", "mode": "direct + 4-shot", "acc": 0.785, "frac_left": 0.63, "i2n": 0.154, "kind": "fewshot"},
      {"model": "Gemma-4-12B", "mode": "direct", "acc": 0.846, "frac_left": 0.45, "i2n": 0.146, "kind": "direct"},
      {"model": "Gemma-4-12B", "mode": "direct + 4-shot", "acc": 0.853, "frac_left": 0.43, "i2n": 0.100, "kind": "fewshot"}
    ],
    "montages": ["assets/raj2afc_montage_0.png", "assets/raj2afc_montage_2.png"],
    "kindColors": {"null": "#9aa0a6", "feature": "#1f9d57", "cot": "#d8483b", "direct": "#2f6bff", "fewshot": "#c6810f"},
    "findings": [
      "How you ask is everything. Answering directly beats chain-of-thought here, and not by a little: making the medium model reason step by step roughly halves its score (0.16 → 0.03) and makes it blurt 'LEFT' almost every time. That is the opposite of the video game, where chain-of-thought was essential. Reasoning helps when there's a plan to work out, but it gets in the way of just seeing. (We confirmed this by re-running with the choices flipped left/right: the direct version genuinely perceives, the think-out-loud version is basically guessing once you account for its left-leaning habit.)",
      "Bigger models see better. Answering directly, the small model is weak and biased; the medium and large ones are unbiased and genuinely good. A capable model can do this task cold, with no practice.",
      "Practice HURTS here, the opposite of what you'd expect for people. Showing four solved examples first dropped the small model to pure guessing and pulled the large one down too. This visual matching task doesn't benefit from worked examples the way text tasks do.",
      "The approach that wins is probably still the old one: training a small dedicated decision-rule on the model's features. We cannot put a number on the size of that win from this page, because the published readout range is ceiling-divided and our 0.16 is not. A purpose-built rule beats prompting; closing that gap by prompting alone would take actually retraining the model, not a few examples."
    ],
    "reading": "The same task, scored the same way, along three independent dials: model size (small → medium → large), how we ask (think-out-loud vs. answer directly), and how much help we give (none → a few examples → a trained decision-rule). A model that gives one answer per picture cannot pass about 0.33 on this score, so read every bar against that limit. We caught a left/right answering bias by tracking how often each model said 'left', and removed it with a balanced re-run.",
    "caveats": [
      "The big caveat: the original people and monkeys chose between clean, canonical object pictures; our choices are messier, harder renders of the same objects. So the models are doing a HARDER version than the humans we compare them to: a low score mixes 'couldn't see it' with 'was given a tougher picture'. The absolute numbers are floors; the comparisons WITHIN this page (direct vs. think-out-loud, size, practice) all use the same pictures and are the trustworthy part.",
      "The trained-rule range (0.30–0.50) is the original benchmark's published number, not re-measured on this small image set; it anchors the scale but isn't a strict apples-to-apples comparison.",
      "We haven't computed error bars yet: with only 120 images, the large-model vs. medium-model gap may not be real, so read the tiers, not the exact decimals.",
      "The 'practice hurts' result might partly be a quirk of how we showed multiple images at once (the small model just kept saying 'left'); it needs one more control before we'd call it a fact."
    ],
    "sequential": {
      "title": "The task, the way the people and monkeys actually saw it",
      "subtitle": "The real task is one-at-a-time: a brief look at the target, then it is hidden, and only THEN do the two choices appear, so you have to hold the target in memory and pick the match. That is the exact sequence the people and monkeys saw. We trace it step by step, because the interesting question is what the model loses when it has to remember the target rather than stare at it. Same model, same 2,505 trials.",
      "trace": [
        {"img": "assets/raj_seq_sample.png", "cap": "1 · target shown, then hidden", "kind": "img"},
        {"text": "the model describes it in its own words, then the target is gone", "cap": "2 · the bottleneck: remember it", "kind": "text"},
        {"img": "assets/raj_seq_choices.png", "cap": "3 · choices appear; target is GONE, so it must match from memory", "kind": "img"}
      ],
      "conditions": [
        {"label": "guessing (floor)", "i2n": -0.028, "kind": "null"},
        {"label": "from memory: target hidden, match from its own description", "i2n": 0.097, "kind": "seq"},
        {"label": "target still on screen: choose with it in view", "i2n": 0.170, "kind": "seq"},
        {"label": "all three on screen at once (a simplification)", "i2n": 0.163, "kind": "sim"}
      ],
      "kindColors": {"null": "#9aa6b8", "seq": "#7c4dff", "sim": "#2f6bff"},
      "reading": "What costs the model is losing sight of the target, not seeing things one at a time. The only fully realistic version, where the target is gone and the model must choose from its own remembered description, drops the score by about 40% (to 0.097). Putting the target into words throws away the fine visual detail the match needs (the descriptions were perfectly fluent, e.g. 'a sculpture of a person in mid-air, diving or jumping', and the model gave a clean left/right answer on all but 5 of 2,505 trials). When the target stays on screen, splitting the task into steps costs almost nothing (0.170 ≈ 0.163), so showing all three at once isn't inflating the score just by keeping everything visible.",
      "caveat": "The small edge of 'target on screen' over 'all at once' is probably just the left/right answering bias again, so treat them as equal. Keeping the target on screen isn't a true test of memory, so the from-memory version is the meaningful realistic one. A balanced re-run would tighten the numbers."
    }
  },
  "gemma_scorecard": {
    "title": "Use one model in several experiments",
    "subtitle": "The recorded Gemma-4-12B experiments span object choices, word decisions, a game, and brain prediction. They demonstrate coverage, not a universal model ranking.",
    "rows": [
      {"capability": "Seeing · behavior", "benchmark": "Object matching", "metric": "raw human–model consistency (i2n)", "score": "0.146", "status": "done", "note": "answering directly, no left/right bias; on par with the medium Qwen model"},
      {"capability": "Reading · behavior", "benchmark": "Real vs. fake words", "metric": "accuracy", "score": "0.86", "status": "done", "note": "above the human average; not dyslexic, gets fake words right every time, real words 72%"},
      {"capability": "Playing · video game", "benchmark": "Grid game", "metric": "win rate", "score": "1.00", "status": "done", "note": "won all 15 games perfectly with chain-of-thought, topping the size ladder. On a much harder maze game it scores 0; the two games aren't interchangeable."},
      {"capability": "Seeing · brain", "benchmark": "Predicting vision areas", "metric": "raw correlation (not ceiling-normalized)", "score": "V4 0.40 · IT 0.53", "status": "done", "note": "its unusual no-separate-vision design needed a new connector, built and checked this session; the 0.53 is in CLIP's league when both are measured our way; the public leaderboard divides by a noise ceiling and ours does not, so it is not comparable to a leaderboard number at all"}
    ],
    "reading": "Because Gemma-4 has no separate vision part (pixels feed straight into the main model) predicting brain activity from it needed a new little connector, which we built and checked this session. After that, all four kinds of test ran from the one setup: the object-matching task, the word task, the video game (a clean sweep, topping the size ladder), and predicting vision-area brain activity (0.40 and 0.53). Wire a model in once, test it on everything, even a model design that is only days old."
  }
};
