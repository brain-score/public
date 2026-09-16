/* A short, plain-language path through the same experiments as Technical. */
(function () {
  'use strict';
  const examples = [
    {id:'recordings',group:'compare',label:'Measured brain responses',title:'Start with real brain recordings',visual:'.result-visual',
      caption:'Researchers measured brain activity while monkeys saw images and people read sentences. Each square shows one recording site’s response to one image or sentence; lighter colors mean a stronger response, and gray means missing data. These recordings give us real observations to test AI models against.'},
    {id:'layermapping',group:'compare',label:'Choose what to record',title:'Choose which parts of a model predict the brain',visual:'#layer-strategy-figure',
      caption:'Using a video model, V-JEPA2, we predicted brain recordings from three selections of its internal units. The diagram shows what each method records, how it makes a prediction, and its score on clips left out of fitting. One whole layer nearly matches all 24 layers; a smaller, combined selection gives up some score. These are measured results for one model and dataset.'},
    {id:'model-recordings',group:'compare',label:'Then record the model',title:'Then record the model’s responses',visual:'.result-visual',
      caption:'We recorded a model’s internal activity for the same images or sentences shown above. Each column is the same input; each row is one model unit, a small internal component. Both are now tables of responses, ready for a benchmark to compare. We have not calculated a score here. Model units are not individual brain cells, and the colors use different numerical scales.'},
    {id:'moviebrain',group:'compare',label:'Predict brain activity',title:'Ask an AI model to predict a person’s brain activity',visual:'.mb-grid',
      caption:'A person watched a TV clip while their brain activity was recorded. Researchers used an AI model’s internal activity to predict recordings for a clip left out of the prediction model’s training. The images compare recorded and predicted patterns; each series is scaled separately, so compare patterns rather than signal amounts. Higher points on the line mean closer agreement. This tests which brain responses the model can explain.'},
    {id:'rajalingham',group:'compare',label:'Compare human choices',title:'Test whether people and AI find the same images difficult',visual:'#raj-plot',
      caption:'People and AI models chose which picture matched a target object. Higher bars mean the model’s pattern of easy and difficult images was more like people’s. Colors show how each choice was made. In these tests, asking it to reason step by step did not consistently improve the match.'},
    {id:'mechanics',group:'compare',label:'Compare ways to answer',title:'Compare different ways to obtain an answer',visual:'#allpaths-plot',
      caption:'We tested whether models could tell real words from invented ones, using three routes to a decision. Each point is one model, input, and route; higher is better. Scores are divided by a human reference, so 1.0 matches it and values above 1.0 exceed it. The same model can score differently depending on how its answer is obtained.'},
    {id:'witness',group:'inspect',label:'Record inputs and outputs',title:'Record what a model received and returned',visual:'#witness-grid',
      caption:'A recorder captured the board, instruction, and returned action at two steps of a grid-game test. Blue marks the player and green marks the goal; the text below each board records the input and response. This lets a researcher inspect what happened at each call. This example uses a rule-based test agent, so it demonstrates the recording tool rather than a learned ability.'},
    {id:'saved-activity',group:'inspect',label:'Revisit a saved experiment',title:'Inspect what happened inside a model after the run',visual:'.result-visual',
      caption:'During a robot-data test, we saved the activity of 12 internal model units across 119 observations. Each row is a unit and each column is an observation; the colors show positive and negative outputs. We can inspect this record without running the model again. This demonstrates recording and replay with an untrained test model, rather than a robot skill.'},
    {id:'ablation',group:'inspect',label:'Test cause and effect',title:'Switch off part of a model and measure what changes',visual:'#ablation-plot',
      caption:'Researchers asked an AI model to tell real words from invented ones, then switched off small internal components, called units, that responded strongly to words. Accuracy fell much more than when random units were switched off. The two lines show that difference: these selected units matter for this task. Small vertical bars show variation between two random selections. This is a model experiment, not a diagnosis of a human reading disorder.'},
    {id:'fusion',group:'inspect',label:'Combine sight, sound, and words',title:'Test whether combining senses improves brain prediction',visual:'#fusion-plot',
      caption:'Researchers used video, sound, and text from the same movies to predict recorded brain activity. Each bar shows how closely a model’s predictions matched those recordings; higher is better. Combining the three sources performed better here than using any one alone. The two combined approaches scored similarly, so a single multimodal model was not clearly better.'},
    {id:'robotics',group:'robotics-group',label:'Connect robotics data',title:'Bring robot cameras, state, and actions into one experiment',visual:'.result-visual',
      caption:'We passed camera images and robot positions from a real DROID demonstration through an untrained test model. The images show recorded camera views, and the line shows one of its proposed movement commands across 119 observations. This demonstrates a working connection for robotics research. It does not show a trained robot completing a task, and no physical robot was controlled.'},
    {id:'recovery',group:'robotics-group',label:'Restore the original output',title:'Change a model’s action, then restore it',visual:'.result-visual',
      caption:'We gave the test model the same robot observation three times: normally, with one internal processing stage (a layer) switched off, and after restoring it. Each group of bars represents a joint or the gripper. Switching off the layer changed the proposed commands; restoring it recovered every original value exactly. This checks that an intervention can be removed cleanly.'}
  ];
  const entries=[];
  const groups=['compare','inspect','robotics-group'];
  let originalOrder;
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
  function init(){
    originalOrder=Object.fromEntries(groups.map(id=>[id,[...document.getElementById(id+'-results').children]]));
    for(const example of examples){
      const card=document.getElementById(example.id);
      const target=card.querySelector(example.visual);
      const visual=target.classList.contains('js-plotly-plot')?target.closest('.figure-shell'):target;
      const placeholder=document.createComment('Original figure position');visual.before(placeholder);
      const technical=make('div','technical-body');
      [...card.childNodes].filter(e=>!e.classList?.contains('result-head')).forEach(e=>technical.append(e));
      const panel=make('div','executive-panel');
      const title=make('h2','',example.title),caption=make('p','executive-caption',example.caption);
      panel.append(title,caption);
      const link=make('a','full-experiment','See full experiment');link.href='?aud=technical#'+example.id;
      link.onclick=event=>{event.preventDefault();document.querySelector('[data-aud-button="technical"]').click();history.replaceState(null,'','#'+example.id);card.scrollIntoView();};
      panel.append(link);panel.hidden=true;card.append(technical,panel);
      entries.push({example,card,visual,placeholder,technical,panel,link});
    }
    const note=make('p','view-description');note.id='view-description';
    document.getElementById('result-index').before(note);
    apply();document.body.dataset.executiveReady='true';
  }
  function apply(){
    if(!originalOrder)return;
    const executive=document.body.dataset.aud==='executive';
    document.querySelectorAll('.result-card').forEach(card=>{card.hidden=executive&&!examples.some(e=>e.id===card.id);});
    for(const entry of entries){
      const {example,card,visual,placeholder,technical,panel,link}=entry;
      technical.hidden=executive;panel.hidden=!executive;
      if(executive)panel.insertBefore(visual,link);else placeholder.after(visual);
      card.dataset.executiveLabel=example.label;
    }
    for(const group of groups){
      const parent=document.getElementById(group+'-results');
      if(executive)examples.filter(e=>e.group===group).forEach(e=>parent.append(document.getElementById(e.id)));
      else originalOrder[group].forEach(card=>parent.append(card));
    }
    document.getElementById('view-description').textContent=executive
      ?'Twelve examples in three sections: compare with brains and behavior, inspect and intervene, and connect robotics. Start with recordings, then explore what you can measure and change.'
      :'The complete collection: all 27 examples, with methods, controls, and integration details.';
    document.getElementById('limitations').hidden=executive;
    document.dispatchEvent(new Event('umi-catalog-update'));
    requestAnimationFrame(()=>document.querySelectorAll('.js-plotly-plot').forEach(p=>{if(p.checkVisibility())Plotly.Plots.resize(p);}));
  }
  window.addEventListener('umi-results-ready',init,{once:true});
  window.addEventListener('umi-view-change',apply);
  function revealAnchor(){
    const card=document.getElementById(location.hash.slice(1))?.closest('.result-card');
    if(card?.hidden)document.querySelector('[data-aud-button="technical"]').click();
    if(card)card.scrollIntoView();
  }
  window.addEventListener('hashchange',revealAnchor);
  window.addEventListener('umi-results-ready',revealAnchor);
})();
