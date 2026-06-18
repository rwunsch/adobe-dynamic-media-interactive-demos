/* ============================================================
   Shared asset registry + central picker for the DM demos.
   - Built-in published RobertCo masters (with native dims).
   - A "current" selection persisted in localStorage, so picking
     an image on one demo becomes the default on all the others.
   - Paste-your-own: a full DM image URL, "Company/asset", or "asset".
   Usage in a demo:
     <script src="js/assets.js"></script>
     DMAssets.mountPicker(elem, asset => { ...re-render with asset... });
     const a = DMAssets.current();           // {name,label,w,h,server?,company?}
     img.src = DMAssets.imageBase(a) + '?wid=600&...';
   ============================================================ */
(function (g) {
  const SERVER = 'https://s7g10.scene7.com';
  const COMPANY = 'RobertCo';

  const BUILTIN = [
    {name:'person-in-black-face-mask-on-a-blue-bus', label:'Woman on bus — portrait', w:2973, h:4460},
    {name:'forest-trail',        label:'Forest trail — cycling', w:1620, h:1080},
    {name:'alpinists-himalayas', label:'Alpinists — Himalayas',  w:1620, h:1080},
    {name:'freeride-steep',      label:'Freeride — skiing',      w:1620, h:1080},
    {name:'surfing_2',           label:'Surfer — Costa Rica',    w:1920, h:1080},
    {name:'camp-summer-night',   label:'Camp — summer night',    w:1620, h:1080},
    {name:'mountain-biking',     label:'Mountain biking',        w:1620, h:1080},
    {name:'ice-climbing',        label:'Ice climbing',           w:1620, h:1080},
    {name:'Golden Gate Bridge',  label:'Golden Gate Bridge',     w:2942, h:1953},
  ];

  const LS_CUR = 'dmDemoAssetKey', LS_CUSTOM = 'dmDemoCustomAssets';

  function customList(){ try { return JSON.parse(localStorage.getItem(LS_CUSTOM)) || []; } catch(e){ return []; } }
  function all(){ return BUILTIN.concat(customList()); }
  function keyOf(a){ return (a.server||SERVER)+'|'+(a.company||COMPANY)+'|'+a.name; }
  function current(){
    const k = localStorage.getItem(LS_CUR);
    return all().find(a => keyOf(a) === k) || BUILTIN[0];
  }
  function setCurrent(a){ localStorage.setItem(LS_CUR, keyOf(a)); }
  function addCustom(a){
    const c = customList();
    if(!c.find(x => keyOf(x) === keyOf(a))){ c.push(a); localStorage.setItem(LS_CUSTOM, JSON.stringify(c)); }
  }
  function encName(name){ return name.split('/').map(encodeURIComponent).join('/'); }
  function imageBase(a){ a = a || current(); return (a.server||SERVER) + '/is/image/' + (a.company||COMPANY) + '/' + encName(a.name); }

  // Accept a full DM image-serving URL, "Company/asset", or bare "asset".
  function parse(input){
    input = (input||'').trim();
    if(!input) return null;
    let server = SERVER, company = COMPANY, name = input;
    const m = input.match(/^(https?:\/\/[^/]+)\/is\/(?:image|content)\/([^/?]+)\/(.+?)(\?.*)?$/);
    if(m){ server = m[1]; company = m[2]; name = decodeURIComponent(m[3]); }
    else if(!/^https?:/i.test(input) && input.indexOf('/') > 0){
      const i = input.indexOf('/'); company = input.slice(0,i); name = input.slice(i+1);
    }
    return { server, company, name, label: name.split('/').pop(), custom:true };
  }

  // Resolve native pixel dims (for crop/text-coord demos) via ?req=set.
  async function dims(a){
    try {
      const t = await (await fetch(imageBase(a) + '?req=set', {cache:'no-store'})).text();
      const m = t.match(/dx="(\d+)" dy="(\d+)"/);
      if(m) return { w:+m[1], h:+m[2] };
    } catch(e){}
    return { w: a.w || 1600, h: a.h || 1067 };
  }

  // Mount a picker (dropdown + paste-your-own) into `host`. Calls onChange(asset).
  function mountPicker(host, onChange){
    host.innerHTML =
      '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#e8e8e8">'
      + 'Image <span style="color:#919191;font-weight:400">· shared across demos</span></label>'
      + '<select class="dm-pick-sel" style="width:100%"></select>'
      + '<div style="display:flex;gap:8px;margin-top:8px">'
      + '<input type="text" class="dm-pick-url" placeholder="Paste DM URL or Company/asset…" style="flex:1;min-width:0">'
      + '<button class="copy-btn dm-pick-add" type="button">Use</button></div>'
      + '<div class="dm-pick-msg hint" style="margin-top:6px;display:none"></div>';
    const sel = host.querySelector('.dm-pick-sel');
    const inp = host.querySelector('.dm-pick-url');
    const msg = host.querySelector('.dm-pick-msg');

    function rebuild(){
      sel.innerHTML = '';
      all().forEach(a => {
        const o = document.createElement('option');
        o.value = keyOf(a); o.textContent = a.label + (a.custom ? ' (yours)' : '');
        sel.appendChild(o);
      });
      sel.value = keyOf(current());
    }
    rebuild();

    sel.addEventListener('change', () => {
      const a = all().find(x => keyOf(x) === sel.value);
      if(a){ setCurrent(a); onChange(a); }
    });

    async function add(){
      const a = parse(inp.value);
      if(!a){ return; }
      msg.style.display = 'block'; msg.textContent = 'Checking ' + a.name + '…';
      // verify it delivers, then resolve native dims
      try {
        const r = await fetch(imageBase(a) + '?wid=64', {cache:'no-store'});
        if(!r.ok){ msg.innerHTML = '<b style="color:#ff7a6e">Not deliverable</b> (HTTP ' + r.status + ') — is it published?'; return; }
      } catch(e){ msg.innerHTML = '<b style="color:#ff7a6e">Could not reach that URL.</b>'; return; }
      const d = await dims(a); a.w = d.w; a.h = d.h;
      addCustom(a); setCurrent(a); rebuild(); inp.value = '';
      msg.style.display = 'none';
      onChange(a);
    }
    host.querySelector('.dm-pick-add').addEventListener('click', add);
    inp.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } });
  }

  g.DMAssets = { all, current, setCurrent, addCustom, imageBase, parse, dims, mountPicker, SERVER, COMPANY };
})(window);
