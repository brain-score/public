/* Keep the complete experiment collection on the Overview. */
(function () {
  'use strict';
  const groups = {
    compare: ['response','moviebrain','rajalingham','scaling','generalize','gemma-scorecard','leaderboard','nulls','mechanics','models'],
    inspect: ['capabilities','api','tools','selection','ablation','layermapping','fusion','layercontrib','witness','percept','frontier'],
    'robotics-group': ['game']
  };
  const copy = {
    response: ['Compare models across input domains','Benchmark results','Each input names its model, benchmark, and score scale. Cortical maps show prediction accuracy; recorded responses are shown separately below.'],
    moviebrain: ['Compare recorded and predicted brain activity over time','Recorded response + model prediction','Recorded fMRI and predictions for one held-out segment. Colors show separately standardized responses; the curve reports spatial correlation.'],
    rajalingham: ['Compare object choices with human behavior','Behavioral experiments','Inspect simultaneous and sequential object matching. The display protocol and response method affect what each score measures.'],
    scaling: ['Compare model rankings across tasks','Model comparisons','Switch tasks to compare models on the same metric. Rankings and score scales differ between benchmarks.'],
    generalize: ['Check how results change across representations','Generalization experiments','Compare layer choice and feature dimension using the stated evaluation splits. These experiments test specific models and datasets.'],
    'gemma-scorecard': ['Run one model through several kinds of experiment','Model scorecard','Gemma results span behavior, game play, and neural prediction. Read each row on its own metric.'],
    leaderboard: ['Check local predictions against external evaluation','External evaluation','Challenge scores provide a separate check. In-distribution and out-of-distribution results describe different test sets.'],
    nulls: ['Measure what remains when the signal is removed','Controls','Timing shifts, shuffled inputs, and null models help establish what each score measures.'],
    mechanics: ['Inspect the task, readout, and control behind a score','Benchmark methods','Follow the evaluation paths and their baselines. Different readouts can answer different scientific questions.'],
    models: ['Explore the models used in these experiments','Model catalog','The catalog shows the model families and modalities exercised by this collection.'],
    capabilities: ['Use one model in many kinds of experiment','Capabilities','Compare neural responses and behavior, record activity, replay results, intervene, and study actions. Support depends on the model and experiment.'],
    api: ['Connect models and tools through public interfaces','Integration guide','Use process for a direct call and interact for a session. Extensions can live in their own packages.'],
    tools: ['Configure a model and choose its recording layers','Tool diagrams','Auto-setup and layer mapping support model integration. The diagrams describe the workflow; the experiments below show its results.'],
    selection: ['Find word-selective units across model layers','Unit selection','Select units using words and non-word controls, then inspect where they occur across the model.'],
    ablation: ['Test which model units matter for word decisions','Intervention results','Compare selected-unit and random-unit ablations, including the non-reading control. This model deficit differs from human dyslexia.'],
    layermapping: ['Compare ways to map model layers to brain responses','Layer mapping','Inspect the layer sweep, unit heatmap, readout comparisons, and dimension controls together.'],
    fusion: ['Test how combining modalities changes brain prediction','Multimodal experiments','Compare the fusion approaches and response curves on the stated dataset. More modalities do not guarantee a better score.'],
    layercontrib: ['Locate predictive signal across layers and modalities','Layer comparisons','Compare layer-wise brain-prediction correlations for each modality and model.'],
    witness: ['Record what the model received and returned','Run observation','Switch examples to inspect the inputs and responses captured during an experiment.'],
    percept: ['Inspect the input after model preprocessing','Input inspection','Compare the presented input, model tensor, and reconstructed view. Cropping and tokenization can change what reaches the model.'],
    frontier: ['Extend the toolbox to new research questions','Research directions','Human participation, stimulation, multi-subject sessions, and physiological readouts are directions for additional implementation and validation.'],
    game: ['Study actions in a controlled feedback loop','Game experiments','Inspect recorded play, model comparisons, and the interactive board. These game outcomes do not establish robotics performance.']
  };
  function el(tag, className, text) { const e=document.createElement(tag);e.className=className||'';if(text)e.textContent=text;return e; }
  for (const [group,ids] of Object.entries(groups)) {
    for (const id of ids) {
      const section=document.getElementById(id), [title,type,caption]=copy[id];
      section.classList.add('result-card','legacy-result');section.dataset.resultGroup=group;
      section.querySelector('h2').textContent=title;
      const label=el('div','result-head');label.append(el('span','evidence-tag',type),el('span','result-number'));
      section.prepend(label);
      const details=el('details','methods'),body=el('div','method-body');details.append(el('summary','','Methods & interpretation'),body);
      const lead=section.querySelector(':scope > .lead');if(lead)body.append(lead);
      // Keep every figure and table visible; only explanation moves into details.
      const prose=[...section.querySelectorAll('.reading-box,.reading,.raj-caveats,.tool-caption')];
      for(const node of prose){
        if(body.contains(node))continue;
        for(const visual of [...node.querySelectorAll('.figure-shell,table,figure,.flow')])node.before(visual);
        body.append(node);
      }
      section.querySelectorAll(':scope > .tool-eyebrow-row').forEach(n=>body.append(n));
      const sources=el('p','source-links');const a=el('a','','Result data');a.href='data.js';sources.append(a);body.append(sources);
      section.append(el('p','caption',caption),details);
      document.getElementById(group+'-results').append(section);
    }
  }
  const limits=document.getElementById('limitations');limits.className='collection-limits';
  const details=el('details','methods');details.append(el('summary','','Limits and interpretation of the full collection'));
  while(limits.firstChild)details.append(limits.firstChild);limits.append(details);
  document.getElementById('partners').before(limits);
  document.getElementById('retained-sections').remove();
  function index(){
    const root=document.getElementById('result-index');root.replaceChildren();
    for(const [group,label]of [['compare','Brains & behavior'],['inspect','Inspect & intervene'],['robotics-group','Robotics']]){
      const column=el('div','index-column');column.append(el('h2','',label));
      [...document.getElementById(group+'-results').children].filter(card=>!card.hidden).forEach((card,i)=>{
        card.querySelector('.result-number').textContent=String(i+1).padStart(2,'0');
        const shortNames={recordings:'Recorded responses','model-recordings':'Model responses before scoring','saved-activity':'Saved model activity',robotics:'DROID episode',recovery:'Policy recovery'};
        const a=el('a','',(document.body.dataset.aud==='executive'&&card.dataset.executiveLabel)||card.dataset.toc||shortNames[card.id]||card.querySelector('h2,h3').textContent);a.href='#'+card.id;column.append(a);
      });root.append(column);
    }
    if(window.Plotly)document.querySelectorAll('.js-plotly-plot').forEach(p=>{if(p.checkVisibility())Plotly.Plots.resize(p);});
  }
  window.addEventListener('umi-results-ready',index);
  document.addEventListener('umi-catalog-update',index);
})();
