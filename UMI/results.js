/* Shared result cards. Every figure declares what its values represent. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = async name => {
    const response = await fetch('assets/results/' + name);
    if (!response.ok) throw Error('Could not load ' + name);
    return response.json();
  };
  const source = name => ({label: 'Figure data', href: 'assets/results/' + name});
  const records = [
    {id:'recordings', group:'compare', type:'Recorded neural responses', title:'Start with the responses recorded from the brain', context:'MajajHong 2015 · macaque IT  /  Pereira 2018 · human language network',
     caption:'Each cell is a measured response. Gray cells are missing data. These fixed subsets show recordings, not model predictions or anatomical illustrations.',
     methods:'Image responses average available repetitions from 70–170 ms after onset. The sentence panel uses subject 018. Both show the first 24 stimuli and 32 recording sites in file order, in the dataset’s stored units. No display normalization or inferred brain coordinates are used. These subsets are not benchmark scores.',
     code:'Compare model features with these recordings using the benchmark’s train/test split and metric. A heatmap alone does not establish model agreement.', links:[source('neural-responses.json')], render:neural},
    {id:'model-recordings', group:'compare', type:'Model activity before scoring', title:'Then record the model’s responses', context:'ResNet-18 for images · GPT-2 for sentences · the same 24 inputs as the brain recordings',
     caption:'Columns match the brain heatmap by input ID. Rows are sampled model units, not matched brain cells. Values are raw activations with independent color ranges; no prediction fit or metric has been applied here.',
     methods:'Vision: a staged pretrained ResNet-18 checkpoint, local CPU FP32 inference on the 24 public images, layer4 flattened in channel/height/width order after the Brain-Score image preprocessor. Language: saved GPT-2 transformer.h.11 final-token activations with benchmark passage context, captured at the metric input and reordered by stimulus ID. Each panel selects 32 evenly spaced unit indices without examining response values. The heatmaps are display subsets; benchmark fitting and evaluation require the full data and appropriate held-out splits.',
     code:'Record model features before passing the aligned model and brain assemblies to a metric. Keep stimulus IDs, layer identity, preprocessing, context, units, and any fitted transformations in the run record.',
     links:[source('model-responses.json')], provenance:'model-response-provenance.json',render:modelRecordings},
    {id:'moviebrain', group:'compare', type:'Recorded response + model prediction', title:'Compare recorded and predicted brain activity over time', context:'Algonauts / Courtois NeuroMod · subject 01 · 7 snapshots from a held-out Friends segment',
     caption:'Recorded fMRI and model predictions for the same clip. The curve reports spatial correlation at each snapshot; colors show separately standardized responses.',
     methods:'Existing experiment: friends_s01e02a, TRs 20–26, 1.49 seconds apart. The renderer standardizes the recorded and each predicted series separately, then uses one color range. Amplitudes therefore cannot be compared in original fMRI units. The encoding fit excludes this segment; pretrained-model exposure is not established. The displayed maps are archived renders, not newly regenerated from raw arrays.',
     code:'Align predictions and recordings by run, timestamp, and parcel. Preserve the held-out segment and the preprocessing used by the rendering script.',links:[source('movie.json'),{label:'Rendering method',href:'assets/results/predict_clip_bold_dual.py'}],render:movie},
    {id:'ablation',group:'inspect',type:'Measured model behavior',title:'Disabling word-selective units reduces word-decision accuracy',context:'Qwen2.5-VL-32B · real versus invented words · selected-unit and random-unit ablations',
     caption:'The selected-unit deficit exceeds the random control. Error bars show spread across two random selections; the deficit differs from human dyslexia.',
     methods:'Original 32B experiment, June 2026. Random-control error bars are standard deviations over two seeds, not confidence intervals. The selected-unit line is deterministic. At 25% ablation the model still recognizes real words; invented-word rejection fails. A later repeat reaches 0.51 rather than 0.54 because an original selection setting was not recorded.',
     code:'Use a scoped intervention, run the same task and control conditions, then remove the intervention before reuse.',links:[source('ablation.json'),{label:'Original experiment',href:'assets/results/ablation-original.json'}],render:ablation},
    {id:'saved-activity',group:'inspect',type:'Recorded model activity',title:'Inspect a saved run without calling the model again',context:'12 layer units · 119 observations · untrained PyTorch test policy on a real DROID episode',
     caption:'Every column comes from a saved layer capture. This plot is read from the run record with no new policy calls.',
     methods:'Layer 0 of a seeded, untrained test network. The qualification saved 119 layer captures and 119 actions. Record reading checks event and array hashes. This is model activity, not brain activity, and does not demonstrate a trained policy’s task performance.',
     code:'Attach ActivationWindow to the supported backend during inference. Save captures with RunRecorder; read them later through RunRecord.outputs().',links:[source('droid.json')],render:captures},
    {id:'robotics',group:'robotics-group',type:'Real robot dataset · untrained policy',title:'Carry cameras, robot state, and actions through one experiment',context:'DROID 100 sample · one 119-step episode · exterior and wrist cameras',
     caption:'Actual dataset frames and saved policy outputs. The test policy validates the integration; its actions do not demonstrate learned task performance.',
     methods:'Official droid_100/1.0.0 shard 00009 of 00031, checksum verified. Actions use seven joint-velocity components plus gripper position. The policy sees the selected external camera, wrist camera, robot state, and instruction; demonstration targets are excluded. Time is inferred from a declared 15 Hz period. No robot is controlled by this run.',
     code:'DroidPolicy maps observations to policy.infer(request). The policy owns preprocessing and reset. Declare units, bounds, camera choice, and action horizon in your integration.',links:[source('droid.json'),{label:'Qualification record',href:'assets/results/droid-qualification.json'}],render:robotics},
    {id:'recovery',group:'robotics-group',type:'Measured policy intervention',title:'Change a policy’s action, then recover the original output',context:'Same recorded observation · baseline, zeroed layer, and recovery · untrained test policy',
     caption:'Zeroing one layer changes the action. Removing the intervention restores all eight original output values exactly.',
     methods:'A fixed observation is processed three times with reset between conditions. The intervention zeros layer 0 of the untrained test policy. Recovery matches the baseline element for element. This tests intervention cleanup; it does not establish a scientific mechanism or physical task success.',
     code:'Use intervene(model, state_change) around the experimental condition. Reset policy state and random state as required for a paired comparison.',links:[source('droid.json')],render:recovery}
  ];
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function card(record, index) {
    const article = node('article','result-card'); article.id = record.id;
    const head = node('div','result-head');head.append(node('span','evidence-tag',record.type),node('span','result-number',String(index+1).padStart(2,'0')));
    const figure = node('figure');const visual = node('div','result-visual');visual.id=record.id+'-visual';
    figure.append(visual,node('figcaption','caption',record.caption));
    const details=node('details','methods');details.append(node('summary','', 'Methods & data'));
    const body=node('div','method-body');body.append(node('p','',record.methods));
    const links=node('p','source-links');
    for (const link of [...record.links,{label:'Provenance',href:'assets/results/'+(record.provenance||'provenance.json')}]) {const a=node('a','',link.label);a.href=link.href;links.append(a);}
    const engineering=node('div','technical-note');engineering.append(node('strong','','For builders'),node('p','',record.code));
    body.append(links,engineering);details.append(body);
    article.append(head,node('h3','',record.title),node('p','context',record.context),figure,details);
    $(record.group+'-results').append(article);return visual;
  }
  function plot(parent, traces, layout={}) {
    const el=node('div','plot');parent.append(el);
    if(layout.height)el.style.height=layout.height+'px';
    if (!window.Plotly) throw Error('The chart library could not be loaded. Figure data remains available below.');
    return Plotly.newPlot(el,traces,{paper_bgcolor:'white',plot_bgcolor:'white',font:{family:'Arial, sans-serif',size:12,color:'#566277'},margin:{l:65,r:28,t:15,b:55},xaxis:{automargin:true},yaxis:{automargin:true},...layout},{responsive:true,displayModeBar:false});
  }
  function buttons(parent, labels, callback) {
    const row=node('div','control-row');parent.append(row);
    labels.forEach((label,index)=>{const b=node('button','',label);b.type='button';b.setAttribute('aria-pressed',String(index===0));b.onclick=()=>{row.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));callback(index);};row.append(b);});return row;
  }
  function clearPlots(parent) {
    if(window.Plotly)parent.querySelectorAll('.js-plotly-plot').forEach(el=>Plotly.purge(el));
    parent.replaceChildren();
  }
  const droidPromise=data('droid.json');
  const responsePanels=[];
  let responseDomain=0;
  async function selectResponseDomain(index){
    responseDomain=index;
    await Promise.all(responsePanels.map(panel=>panel.draw(index)));
  }
  async function responseHeatmap(parent,kind){
    const measured=await data(kind==='brain'?'neural-responses.json':'model-responses.json');
    const label=node('p','plot-label'),holder=node('div');
    const controls=buttons(parent,['Image responses','Sentence responses'],selectResponseDomain);
    controls.setAttribute('aria-label',kind==='brain'?'Brain recording inputs':'Model recording inputs');
    async function draw(index){
      const d=index?measured.language:measured.vision;clearPlots(holder);
      const model=kind==='model';
      const source=model?d.model+' · '+d.layer:index?'Human fMRI':'Macaque IT';
      label.textContent=source+' · same 24 '+(index?'sentences':'images')+' · 32 '+(model?'model units':'recording sites')+' · '+(model?'raw activations':'dataset units');
      controls.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      await plot(holder,[{type:'heatmap',name:model?'Model activations before scoring':'Recorded neural responses',z:d.values,x:Array.from({length:24},(_,i)=>i+1),y:d.units,colorscale:'Cividis',hoverongaps:false,colorbar:{title:{text:model?'Activation':'Response'},thickness:12},customdata:d.units.map(()=>d.stimuli),hovertemplate:'Input %{x}<br>ID %{customdata}<br>'+(model?'Model unit':'Recording site')+' %{y}<br>'+(model?'Activation':'Response')+' %{z:.4f}<extra></extra>'}],{plot_bgcolor:'#e8ecf3',xaxis:{title:'Input in display subset',dtick:4},yaxis:{title:model?'Model unit':index?'Voxel':'Recording site',showticklabels:false}});
    }
    responsePanels.push({draw});parent.append(label,holder);await draw(responseDomain);
  }
  async function neural(parent){await responseHeatmap(parent,'brain');}
  async function modelRecordings(parent){await responseHeatmap(parent,'model');}
  async function layerStrategies(){
    const figure=node('figure','layer-strategy-figure');figure.id='layer-strategy-figure';
    $('layermapping').querySelector('h2').after(figure);
    try{
      const d=await data('layer-strategies.json');
      figure.append(node('p','strategy-context','V-JEPA2 · Lahner 2024 visual-brain recordings · same held-out clips'));
      const headings=node('div','strategy-headings');
      ['1. Select units to record','2. Fit a brain prediction','3. Compare with recordings'].forEach(t=>headings.append(node('strong','',t)));
      figure.append(headings);
      for(const s of d.strategies){
        const row=node('div','strategy-row '+s.id);row.dataset.strategy=s.id;row.dataset.score=s.score;
        const selection=node('div','strategy-selection');selection.append(node('h3','',s.title),node('p','',s.selection));
        const labels=s.id==='all'?['Layers 0–7','Layers 8–15','Layers 16–23']:['Layer 14','Layer 15','Layer 16'];
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 290 90');svg.setAttribute('role','img');svg.setAttribute('aria-label',s.title+'. Colored dots show recorded units; gray dots show units not selected. Schematic, not unit counts.');
        const part=(tag,attrs,text)=>{const el=document.createElementNS(svg.namespaceURI,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;svg.append(el);return el;};
        labels.forEach((label,i)=>{
          const y=15+i*29;part('text',{x:0,y:y+4,fill:'#566277','font-size':11},label);
          for(let j=0;j<6;j++){
            const selected=s.id==='all'||(s.id==='single'?i===2:(j+i)%3===0);
            part('circle',{cx:111+j*22,cy:y,r:6,fill:selected?'var(--strategy-color)':'#e1e6ed',stroke:selected?'var(--strategy-color)':'#bdc7d4'});
          }
          if(s.id!=='single'||i===2)part('path',{d:`M 239 ${y} H 250 V 44 H 275`,fill:'none',stroke:'var(--strategy-color)','stroke-width':1.5});
        });
        part('path',{d:'M 270 39 L 276 44 L 270 49',fill:'none',stroke:'var(--strategy-color)','stroke-width':1.5});
        selection.append(svg);
        const fit=node('div','strategy-fit');fit.append(node('strong','',s.fit),node('p','',s.fit_note));
        const score=node('div','strategy-score');score.append(node('span','strategy-score-label','Brain-prediction score'),node('strong','strategy-value',s.score.toFixed(4)));
        const track=node('div','strategy-track'),bar=node('div','strategy-bar');bar.style.width=s.score*100+'%';track.setAttribute('aria-hidden','true');track.append(bar);score.append(track);
        const axis=node('div','strategy-axis');['0','0.5','1.0'].forEach(t=>axis.append(node('span','',t)));score.append(axis);
        row.append(selection,fit,score);figure.append(row);
      }
      const legend=node('div','strategy-legend');
      for(const [cls,label]of [['selected','Recorded units'],['unselected','Units not selected']]){
        const item=node('span'),dot=node('i',cls);dot.setAttribute('aria-hidden','true');item.append(dot,document.createTextNode(label));legend.append(item);
      }
      legend.append(node('span','','Dots illustrate selection, not activity or exact unit counts.'));figure.append(legend);
      figure.append(node('figcaption','caption','Higher scores mean closer brain predictions, adjusted for measurement noise. All 24 layers score 0.0081 higher than one layer in this run; the uncertainty of that difference was not measured. Feature counts and fitting methods differ. The composite pools existing units from three layers.'));
      const details=node('details','methods');details.append(node('summary','','Diagram methods & measured data'));
      const body=node('div','method-body');body.append(node('p','',d.protocol+' '+d.metric+'. Ridge limits prediction weights to reduce overfitting; its strength is tuned separately for each brain recording site. Banded ridge additionally tunes layer-group weights using cross-validation (500 search iterations here).'));
      const links=node('p','source-links');for(const [name,label]of [['layer-strategies.json','Figure data & provenance'],['budget_curve_results.json','Whole-layer and pooled-unit scores'],['banded_calibrate_results.json','All-layer score']]){const a=node('a','',label);a.href='assets/results/'+name;links.append(a);}body.append(links);details.append(body);figure.append(details);
    }catch(error){figure.append(node('p','load-error',error.message));console.error(error);}
  }
  async function movie(parent) {
    const d=await data('movie.json');let frame=0,model='qwen';
    const pair=node('div','brain-pair'), human=node('div'),predicted=node('div');
    const hi=node('img'),pi=node('img');hi.alt='Recorded fMRI response';pi.alt='Model-predicted fMRI response';human.append(node('h4','','Recorded fMRI'),hi);predicted.append(node('h4','','Model prediction'),pi);pair.append(human,predicted);
    const controls=node('div','control-row');const time=node('label');time.htmlFor='snapshot';const scrub=node('input');scrub.type='range';scrub.id='snapshot';scrub.min=0;scrub.max=6;scrub.step=1;scrub.value=0;scrub.setAttribute('aria-label','Brain snapshot');controls.append(time,scrub);
    const holder=node('div');
    const update=()=>{const suffix=String(frame).padStart(3,'0')+'.png';hi.src='assets/movie_brain_real/human/bold_'+suffix;pi.src='assets/movie_brain_real/model_'+model+'/bold_'+suffix;time.textContent='Snapshot '+(frame+1)+' / 7 · '+d.times[frame]+' s';};
    async function chart(){clearPlots(holder);await plot(holder,[{type:'scatter',mode:'lines+markers',x:d.times,y:d[model].per_tr_r,line:{color:'#285ee8'},hovertemplate:'%{x} s<br>r = %{y:.4f}<extra></extra>'}],{height:210,margin:{l:65,r:20,t:12,b:50},xaxis:{title:'Time within recorded segment (s)'},yaxis:{title:'Spatial r',range:[-.1,.5]}});}
    buttons(parent,['Qwen3-Omni','Three-encoder stack'],async index=>{model=index?'tribe':'qwen';update();await chart();});parent.append(pair,controls,holder);scrub.oninput=()=>{frame=Number(scrub.value);update();};update();await chart();
  }
  async function ablation(parent) {
    const d=await data('ablation.json');
    await plot(parent,[{x:d.percent,y:d.selected,name:'Word-selective units',mode:'lines+markers',line:{color:'#c75938',width:3}},{x:d.percent,y:d.random,name:'Random units',mode:'lines+markers',line:{color:'#285ee8',width:3},error_y:{type:'data',array:d.random_sd,visible:true}}],{xaxis:{title:'Units disabled (%)',range:[-1,27]},yaxis:{title:'Word-decision accuracy',range:[0,1.04],tickformat:'.0%'},legend:{orientation:'h',x:0,y:1.15},margin:{l:65,r:20,t:55,b:55}});
  }
  async function captures(parent) {
    const d=await droidPromise;const values=d.captures[0].map((_,unit)=>d.captures.map(row=>row[unit]));
    await plot(parent,[{type:'heatmap',name:'Saved layer output',z:values,x:d.captures.map((_,i)=>i+1),y:values.map((_,i)=>i),colorscale:'RdBu',zmid:0,colorbar:{title:{text:'Layer output'},thickness:12},hovertemplate:'Step %{x}<br>Unit %{y}<br>Output %{z:.4f}<extra></extra>'}],{xaxis:{title:'Recorded step'},yaxis:{title:'Layer unit'}});
  }
  async function robotics(parent) {
    const d=await droidPromise;const grid=node('div','camera-grid');
    for(const [name,label] of [['exterior_1','Exterior 1'],['exterior_2','Exterior 2'],['wrist','Wrist']]){const frame=node('div');const img=node('img');img.src='assets/results/droid-'+name+'.png';img.alt=label+' camera, first recorded DROID step';frame.append(node('h4','',label),img);grid.append(frame);}
    parent.append(grid);const row=node('div','control-row'),label=node('label','','Action component');label.htmlFor='action-component';const select=node('select');select.id='action-component';for(let i=0;i<8;i++){const o=node('option','',i===7?'Gripper position':'Joint '+(i+1)+' velocity');o.value=i;select.append(o);}row.append(label,select);parent.append(row);const holder=node('div');parent.append(holder);
    async function draw(){const component=Number(select.value);clearPlots(holder);await plot(holder,[{x:d.actions.map((_,i)=>i+1),y:d.actions.map(a=>a[component]),type:'scatter',name:select.options[select.selectedIndex].textContent,mode:'lines',line:{color:'#167b78'},hovertemplate:'Step %{x}<br>Output %{y:.4f}<extra></extra>'}],{height:250,xaxis:{title:'Recorded step'},yaxis:{title:'Normalized command'}});}select.onchange=draw;await draw();
    const stats=node('div','mini-stats');for(const [value,labelText]of [['119','saved actions'],['119','layer captures'],['0','model calls during replay']]){const s=node('span');s.append(node('b','',value),node('span','',labelText));stats.append(s);}parent.append(stats);
  }
  async function recovery(parent) {
    const d=await droidPromise;
    await plot(parent,d.intervention.map((values,i)=>({type:'bar',x:['J1','J2','J3','J4','J5','J6','J7','Gripper'],y:values,name:['Baseline','Layer zeroed','Recovered'][i],marker:{color:['#285ee8','#c45132','#167b78'][i],pattern:{shape:['','/','x'][i]}}})),{barmode:'group',xaxis:{title:'Action component'},yaxis:{title:'Normalized command'},legend:{orientation:'h',x:0,y:1.15},margin:{l:65,r:20,t:55,b:55}});
  }
  let view='executive';
  function applyView(next,persist=false){view=next;document.body.dataset.aud=view;document.querySelectorAll('[data-aud-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.audButton===view)));document.querySelectorAll('.technical-note,#builder').forEach(el=>el.hidden=view!=='technical');document.querySelectorAll('details.methods').forEach(el=>el.open=view==='technical');if(persist){try{localStorage.setItem('bsu-audience',view);}catch(error){}const url=new URL(location.href);url.searchParams.set('aud',view);history.replaceState(null,'',url);}window.dispatchEvent(new Event('umi-view-change'));if(window.Plotly)document.querySelectorAll('.js-plotly-plot').forEach(el=>{if(el.checkVisibility())Plotly.Plots.resize(el);});}
  document.querySelectorAll('[data-aud-button]').forEach(b=>b.onclick=()=>applyView(b.dataset.audButton,true));
  let saved;try{saved=localStorage.getItem('bsu-audience');}catch(error){}
  const requested=new URLSearchParams(location.search).get('aud')||saved;
  const renders=records.filter(r=>!document.getElementById(r.id)).map((r,i)=>{const target=card(r,i);return r.render(target).catch(error=>{target.replaceChildren(node('p','load-error',error.message));console.error(error);});});
  renders.push(layerStrategies());
  applyView(requested==='technical'||requested==='board'?'technical':'executive');
  await Promise.all(renders);document.body.dataset.ready='true';
  window.dispatchEvent(new Event('umi-results-ready'));
  const oldId=location.hash.slice(1);
  const aliases={};
  const target=document.getElementById(aliases[oldId]||oldId);
  if(oldId==='api')applyView('technical',true);
  if(target)target.scrollIntoView();
  else if(['frontier','rajalingham','game','scaling','generalize','selection','layermapping','fusion','witness','percept','gemma-scorecard','nulls','leaderboard','layercontrib','mechanics','models'].includes(oldId)) {
    const archive=new URL('experiments.html',location.href);archive.search=location.search;archive.hash=location.hash;location.replace(archive);
  }
})();
