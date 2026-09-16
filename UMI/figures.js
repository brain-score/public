/* Shared chart presentation. Numerical values and source data are never changed. */
(function () {
  'use strict';
  if (!window.Plotly) return;
  const C={blue:'#285ee8',teal:'#167b78',orange:'#c45132',purple:'#7653a6',gray:'#798598',gold:'#a36516',cyan:'#258ca5'};
  const palette={
    '#2f6bff':C.blue,'#5b8cff':C.blue,'#5b8def':C.blue,'#3b7dd8':C.blue,
    '#1f9d57':C.teal,'#3bb273':C.teal,'#d8483b':C.orange,'#c75938':C.orange,
    '#7c4dff':C.purple,'#7c5bff':C.purple,'#6a3d9a':C.purple,
    '#9aa0a6':C.gray,'#b9c2d6':C.gray,'#c6810f':C.gold,'#e0a13b':C.gold
  };
  const recolor=value=>Array.isArray(value)?value.map(recolor):palette[value]||value;
  window.UMI_FIGURE_COLOR=recolor;
  const defaults={
    'lc-plot':['Relative layer score'], 'mech-floors-plot':['Human-normalized word-decision score'],
    'scaling-plot':['Random-feature baseline','Model score'], 'game-plot':['Games won'],
    'selection-plot':['Word-selective units'], 'lm-sweep-plot':['Layer score','Best layer','Layer used in benchmark'],
    'dd-pc-plot':['Brain-pattern prediction'], 'gen-dim-plot':['Effective dimensions'],
    'lb-indist-plot':['Challenge score'], 'lb-ood-plot':['Challenge score'],
    'fusion-plot':['Feature-source comparison'], 'fusion-curve-plot':['Layer score','Before fusion','Peak after fusion'],
    'shift-plot':['Shifted model predictions'], 'mb-rcurve':['Predicted vs recorded fMRI']
  };
  const hints={
    'lc-plot':'Each row is divided by its own maximum. Compare the location of the peak, not absolute scores between rows. Gray cells mean no layer exists.',
    'mech-floors-plot':'Accuracy divided by the human reference, not raw accuracy. Baselines show what can be achieved without the proposed signal.',
    'allpaths-plot':'Accuracy divided by the human reference (about 81.1% correct). A score above 1 exceeds that reference; it does not mean over 100% correct. Hover over points to see the input type.',
    'scaling-plot':'Compare models within the selected task. The dashed line is that task’s baseline; score scales differ between tasks.',
    'game-plot':'Height is the fraction of games won. The dotted line marks the random baseline.',
    'ablation-plot':'Higher means more correct word decisions. Error bars show standard deviation over two random selections, not confidence intervals.',
    'ablation-dissoc-plot':'Compare baseline and intervention within each task. The dashed threshold is specific to the word task.',
    'selection-plot':'Height counts selected units; it is not an accuracy score.',
    'lm-sweep-plot':'Higher correlation means better prediction. The star marks the best layer in this sweep; the open circle marks the benchmark’s layer.',
    'lm-budget-plot':'Compare methods at the same number of units. Dotted lines use whole layers; the dashed line uses randomly selected units.',
    'dd-pc-plot':'Each bar is one brain-response pattern. Colors distinguish correlation bands; they do not mark statistical significance.',
    'gen-dim-plot':'Height is a dimension count. This is not a benchmark score.',
    'gen-hier-plot':'Follow each model across brain areas. Depth is relative to that model, from input (0) to output (1).',
    'lb-indist-plot':'Higher is better on the organizer’s metric. Highlighted bars are this project’s submissions.',
    'lb-ood-plot':'These results use a different test distribution. The dashed line is the stated in-distribution reference.',
    'fusion-plot':'Colors distinguish how features are combined. Higher correlation means better brain prediction; full model names appear in the table and hover labels.',
    'fusion-curve-plot':'Follow prediction accuracy through the model. Layer 0 is before modalities mix; the star marks the observed peak.',
    'shift-plot':'Zero shift keeps the original alignment. Compare shifted predictions with the no-signal reference.',
    'raj-plot':'Color identifies the response method, also written beside each bar. Higher raw i2n means closer agreement with human image-level difficulty.',
    'raj-seq-plot':'Each row uses a different target-display protocol. Higher raw i2n means closer agreement with human image-level difficulty.',
    'mb-rcurve':'Spatial correlation at each displayed snapshot. This measures pattern agreement, not response amplitude.'
  };
  const dash=['solid','dash','dot','dashdot'];
  const symbols=['circle','square','diamond','triangle-up','cross'];
  const glyph={'circle':'●','square':'■','diamond':'◆','triangle-up':'▲','cross':'+','star':'★','circle-open':'○'};
  function categoryKeys(id,trace){
    if(!Array.isArray(trace.marker?.color))return null;
    const colors=trace.marker.color;
    let labelFor;
    if(id==='raj-plot')return [
      {color:C.teal,label:'Feature similarity',description:'Compare the model’s pattern of activity for each picture. Choose the option whose pattern is closest to the target’s. No written answer is generated.'},
      {color:C.blue,label:'Direct answer',description:'Ask the model to reply with just LEFT or RIGHT.'},
      {color:C.orange,label:'Chain of thought (CoT)',description:'Ask for a brief written explanation before the final LEFT or RIGHT answer.'},
      {color:C.gold,label:'Four examples in prompt',description:'Show four solved examples, then ask for a direct answer to a new trial. The model is not retrained.'},
      {color:C.gray,label:'Random baseline',description:'Choose LEFT or RIGHT at random as a reference.'}
    ].filter(item=>colors.includes(item.color));
    if(id==='fusion-plot')labelFor=color=>({[C.gray]:'Single modality',[C.blue]:'Combine separate encoders',[C.orange]:'Native multimodal model'})[color];
    if(id==='lb-indist-plot')labelFor=color=>color===C.purple?'This project':'Other submissions';
    if(id==='dd-pc-plot')labelFor=color=>({[C.teal]:'r ≥ 0.50',[C.purple]:'0.20 ≤ r < 0.50',[C.gray]:'r < 0.20'})[color];
    if(id==='mech-floors-plot')labelFor=color=>color===C.gray?'Baseline':'Model';
    if(!labelFor)return [...new Set(colors)].map(color=>({color,label:colors.map((c,i)=>c===color?(trace.orientation==='h'?trace.y[i]:trace.x[i]):null).filter(Boolean).join(' · ')}));
    return [...new Set(colors)].map(color=>({label:labelFor(color)||'Other',color}));
  }
  function keyItem(item){
    const span=document.createElement('span'),swatch=document.createElement('i');
    swatch.className='key-swatch'+(item.line?' is-line '+(item.dash==='solid'?'':item.dash||''):'');
    swatch.style.setProperty('--key-color',item.color);swatch.setAttribute('aria-hidden','true');
    if(item.pattern)swatch.classList.add(item.pattern==='/'?'pattern-slash':'pattern-cross');
    if(item.symbol){const marker=document.createElement('i');marker.className='key-marker';marker.textContent=glyph[item.symbol]||'●';swatch.append(marker);}
    if(item.description){
      const copy=document.createElement('span'),label=document.createElement('strong'),description=document.createElement('span');
      copy.className='method-key-copy';label.textContent=item.label;
      description.className='method-key-description';description.textContent=item.description;
      copy.append(label,description);span.append(swatch,copy);
    }else span.append(swatch,document.createTextNode(item.label));
    return span;
  }
  function annotate(chart,traces,layout){
    const shell=chart.parentElement;
    shell.querySelectorAll(':scope > .figure-key,:scope > .figure-hint').forEach(e=>e.remove());
    const key=document.createElement('div');key.className='figure-key';key.setAttribute('aria-label','Figure legend');
    const title=document.createElement('span');title.className='key-title';title.textContent=chart.id==='raj-plot'?'How the model chooses':'Key';key.append(title);
    if(chart.id==='raj-plot')key.classList.add('method-legend');
    if(traces[0]?.type==='heatmap'){
      const text=document.createElement('span');text.textContent=chart.id==='lc-plot'?'Dark = lower score · light = peak · gray = missing':traces[0].zmid===0?'Orange = negative · white = zero · blue = positive':traces[0].name==='Model activations before scoring'?'Dark = lower activation · light = higher activation':'Dark = lower response · light = higher response · light gray = missing';key.append(text);
    }else traces.forEach(trace=>{
      const categories=categoryKeys(chart.id,trace);
      if(categories){categories.forEach(item=>key.append(keyItem(item)));return;}
      const color=trace.line?.color||trace.marker?.color||C.blue;
      const description=chart.id==='allpaths-plot'?{
        'Read internal activity':'Train a simple real/fake decision rule on recorded features.',
        'Use the model’s output':'Read its written answer, or use word likelihoods for GPT-2.',
        'Read activity with instructions':'Add task instructions, then train the decision rule on the recorded features.'
      }[trace.name]:undefined;
      key.append(keyItem({label:trace.name,description,color:Array.isArray(color)?color[0]:color,line:trace.type!=='bar'&&trace.mode?.includes('lines'),dash:trace.line?.dash||'solid',symbol:trace.mode?.includes('markers')?trace.marker?.symbol||'circle':null,pattern:trace.marker?.pattern?.shape}));
    });
    (layout.shapes||[]).filter(s=>s.type==='line'&&s.y0===s.y1).forEach(shape=>{
      const annotation=(layout.annotations||[]).find(a=>typeof a.y==='number'&&Math.abs(a.y-shape.y0)<1e-8);
      const label=annotation?.text?.replace(/<[^>]*>/g,' ')||'Reference line';
      key.append(keyItem({label,color:shape.line?.color||C.gray,line:true,dash:shape.line?.dash}));
    });
    if(chart.id==='allpaths-plot'){
      const note=document.createElement('span');note.className='input-pair-note';
      note.textContent='Paired squares: image input on the left, text input on the right. Hover or tap a point for details.';key.append(note);
    }
    shell.append(key);
    const hint=hints[chart.id];if(hint){const p=document.createElement('p');p.className='figure-hint';p.textContent=hint;shell.append(p);}
    chart.setAttribute('role','img');chart.setAttribute('aria-label',(traces.map(t=>t.name).join('; '))+(hint?'. '+hint:''));
  }
  const observedWidths=new WeakMap();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(entries=>{
    for(const entry of entries){
      const width=entry.contentRect.width;
      if(width<=0||observedWidths.get(entry.target)===width)continue;
      observedWidths.set(entry.target,width);
      const chart=entry.target.querySelector(':scope > .js-plotly-plot');
      if(chart?._fullLayout)requestAnimationFrame(()=>{if(chart.isConnected)Plotly.Plots.resize(chart);});
    }
  });
  for(const method of ['react','newPlot']){
    const original=Plotly[method];
    Plotly[method]=function(target,input,layout={},config={}){
      const chart=typeof target==='string'?document.getElementById(target):target;
      if(!chart)return original.apply(this,arguments);
      if(!chart.parentElement.classList.contains('figure-shell')){const shell=document.createElement('div');shell.className='figure-shell';chart.before(shell);shell.append(chart);observer?.observe(shell);}
      const traces=input.map((t,i)=>{
        const trace={...t,name:t.name||defaults[chart.id]?.[i]||'Measured value'};
        if(t.line)trace.line={...t.line,color:recolor(t.line.color)};
        if(t.marker)trace.marker={...t.marker,color:recolor(t.marker.color)};
        if(t.error_y)trace.error_y={...t.error_y,color:recolor(t.error_y.color)};
        if(t.type==='heatmap'){
          trace.colorscale=t.zmid===0?[[0,'#b4532d'],[.5,'#f7f7f7'],[1,'#2166ac']]:'Cividis';
          trace.colorbar={...t.colorbar,thickness:12,len:.8,tickfont:{size:10}};
          if(chart.id==='lc-plot')Object.assign(trace,{zmin:0,zmax:1,colorbar:{...trace.colorbar,title:{text:'Share of<br>row peak',font:{size:11}},tickvals:[0,.5,1]}});
        }
        if(t.mode?.includes('lines')&&input.length>1){
          trace.line={...trace.line,dash:t.line?.dash||dash[i%dash.length]};
          if(t.mode.includes('markers'))trace.marker={...trace.marker,symbol:t.marker?.symbol||symbols[i%symbols.length]};
        }
        if(t.mode?.includes('markers')){
          trace.marker={...trace.marker,symbol:t.marker?.symbol||(input.length>1?symbols[i%symbols.length]:'circle')};
          if(t.mode.includes('lines')&&trace.line?.color)trace.marker.color=trace.line.color;
        }
        return trace;
      });
      const styled={...layout,showlegend:false,paper_bgcolor:'#fff',font:{...layout.font,family:'Arial, sans-serif',color:'#172337',size:12},
        plot_bgcolor:traces[0]?.type==='heatmap'?'#e8ecf3':layout.plot_bgcolor,
        xaxis:{...layout.xaxis,automargin:true,gridcolor:'#e5eaf0'},yaxis:{...layout.yaxis,automargin:true,gridcolor:'#e5eaf0'},
        shapes:layout.shapes?.map(s=>({...s,line:{...s.line,color:recolor(s.line?.color)}})),
        annotations:layout.annotations?.map(a=>({...a,font:{...a.font,color:recolor(a.font?.color)}}))};
      const axisTitles={
        'ablation-plot':['Units disabled (% of layer)','Word-decision accuracy'],
        'allpaths-plot':['Model','Word-decision score<br>(human-normalized)'],
        'mech-floors-plot':[null,'Word-decision score<br>(human-normalized)'],
        'lm-sweep-plot':['Layer (input → output)','Prediction correlation (r)'],
        'lm-budget-plot':['Units used for prediction','Ceiling-normalized score'],
        'gen-dim-plot':['Brain dataset','Effective dimensions'],
        'gen-hier-plot':['Brain area (early → late)','Relative model depth'],
        'dd-pc-plot':['Brain-response pattern','Prediction correlation (r)'],
        'lb-indist-plot':[null,'Challenge score'],
        'lb-ood-plot':[null,'Challenge score'],
        'fusion-plot':[null,'Prediction correlation (r)'],
        'fusion-curve-plot':[null,'Prediction correlation (r)'],
        'shift-plot':[null,'Prediction correlation (r)']
      };
      const titles=axisTitles[chart.id];if(titles){if(titles[0])styled.xaxis.title={text:titles[0],font:{size:11}};if(titles[1])styled.yaxis.title={text:titles[1],font:{size:11}};}
      if(chart.id.startsWith('ablation'))styled.annotations=(styled.annotations||[]).map(a=>({...a,text:a.text?.replace('dyslexia threshold','Word-task reference')}));
      if(chart.id==='fusion-plot'){
        styled.xaxis={...styled.xaxis,tickmode:'array',tickvals:traces[0].x,ticktext:['Separate<br>encoders','Native<br>multimodal','Video<br>only','Audio<br>only','Text<br>only'],tickangle:0,tickfont:{size:10}};
        styled.yaxis.range=[0,layout.yaxis.range[1]];
        styled.margin={...styled.margin,l:55,r:12,b:65};
      }
      const rendered=original.call(this,chart,traces,styled,{...config,displayModeBar:false,responsive:true});
      return Promise.resolve(rendered).then(result=>{annotate(chart,traces,styled);fitChartLabels();return result;});
    };
  }
  function fitChartLabels() {
    if (!window.Plotly) return;
    const compact = window.innerWidth <= 700;
    for (const id of ['raj-plot','raj-seq-plot']) {
      const chart=document.getElementById(id);if(!chart?._fullLayout)continue;
      const sequential=id==='raj-seq-plot';
      const labels=chart.data[0].y;
      const wrap=text=>text.split(' ').reduce((lines,word)=>{
        if(lines[lines.length-1].length+word.length>21)lines.push(word);
        else lines[lines.length-1]+=(lines[lines.length-1]?' ':'')+word;
        return lines;
      },['']).join('<br>');
      Plotly.relayout(chart,{
        'margin.l':compact?125:(sequential?230:195),'margin.r':compact?10:28,'margin.b':60,
        'xaxis.title.text':'Human–model consistency<br>(raw i2n)',
        'xaxis.title.font.size':compact?11:13,'xaxis.nticks':compact?4:7,
        'yaxis.tickmode':'array','yaxis.tickvals':labels,
        'yaxis.ticktext':labels.map(t=>compact?wrap(t):t),'yaxis.tickfont.size':compact?9:12
      });
    }
    for(const [id,title] of [
      ['shift-plot','Timing shift (scans)<br>1 scan ≈ 1.5 s'],
      ['fusion-curve-plot','Layer depth<br>0 = before modalities mix']
    ]){
      const chart=document.getElementById(id);if(chart?._fullLayout)
        Plotly.relayout(chart,{'xaxis.title.text':title,'xaxis.title.font.size':compact?11:13,'margin.b':65});
    }
    const control=document.getElementById('ablation-dissoc-plot');
    if(control?._fullLayout)Plotly.relayout(control,{
      'xaxis.tickmode':'array','xaxis.tickvals':control.data[0].x,
      'xaxis.ticktext':['Reading<br>(real vs fake words)','Non-reading<br>control task'],
      'xaxis.tickfont.size':compact?10:12,'xaxis.tickangle':0
    });
  }
  window.addEventListener('umi-results-ready',fitChartLabels);
  window.addEventListener('resize',fitChartLabels);
})();
