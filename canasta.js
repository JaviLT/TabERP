/* ============================================================
   CANASTA: subir archivos lanzando el archivo a la canasta
   Basado en basketball-upload.html. Cambios para el tablero:
   - IDs y clases con prefijo "bk-" para no chocar con la página.
   - Si no hay archivo elegido, pide elegir uno en vez de simular.
   - Si la subida falla, muestra el error y deja reintentar.
   - window.BasketUploader.reset() lo deja limpio al abrirlo
     en otro proyecto.

   INTEGRACIÓN
   app.js sobrescribe window.onBasketUpload para subir el archivo
   real a Supabase Storage. Recibe el File y debe devolver una Promise.
   ============================================================ */
window.onBasketUpload = window.onBasketUpload || async function (file) {
  return new Promise(r => setTimeout(r, 1200));   // simulación
};

(function(){
  const $ = id => document.getElementById(id);
  const stage = $('bk-stage'), zone = $('bk-zone'), fileEl = $('bk-file'), ball = $('bk-ball'),
        net = $('bk-net'), hoop = $('bk-hoop'), traj = $('bk-traj'), msg = $('bk-msg');
  if (!stage) return;

  const MSG_INICIO = 'Elige un archivo, jálalo hacia abajo y a la izquierda, y suéltalo.';

  /* ---- física ---- */
  const G = 1200;          // gravedad (px/s²)
  const K = 8;             // fuerza del jalón: velocidad = jalón × K
  const MAXP = 108;        // jalón máximo (px)
  const MINP = 14;         // jalón mínimo para lanzar
  const HOME = { x: 130, y: 236 };   // centro del archivo en reposo
  const RIM_Y = 140;       // altura del aro dentro del stage
  const RIM_HALF = 36;     // mitad de la boca de la canasta donde cuenta enceste

  const hoopX = () => stage.clientWidth / 2;

  let queue = [], current = null, busy = false, count = 0;

  function fmtSize(b){ return b > 1048576 ? (b/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(b/1024))+' KB'; }
  function placeChip(cx, cy){ fileEl.style.left = (cx - 40) + 'px'; fileEl.style.top = (cy - 36) + 'px'; }
  function setCurrent(f){
    current = f;
    $('bk-ext').textContent = f ? (f.name.split('.').pop() || 'FILE').slice(0,4).toUpperCase() : '+';
    $('bk-fname').textContent = f ? f.name : 'Elige un archivo';
  }
  function nextFromQueue(){ setCurrent(queue.length ? queue.shift() : null); }

  /* ---- línea punteada de trayectoria ---- */
  function clearTraj(){ traj.innerHTML = ''; }
  function drawTraj(vx, vy){
    clearTraj();
    let x = HOME.x, y = HOME.y, svx = vx, svy = vy;
    const dt = 1/60, w = stage.clientWidth;
    for (let i = 0; i < 160; i++){
      svy += G*dt; x += svx*dt; y += svy*dt;
      if (i % 3 === 0){
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx', x); c.setAttribute('cy', y);
        c.setAttribute('r', 2.6);
        c.setAttribute('fill', 'var(--bk-muted)');
        c.setAttribute('opacity', Math.max(0.25, 0.9 - i/170));
        traj.appendChild(c);
      }
      if ((y > RIM_Y + 30 && svy > 0) || x < -20 || x > w + 20 || y > stage.clientHeight) break;
    }
    // banda elástica desde el reposo hasta el archivo
    const l = document.createElementNS('http://www.w3.org/2000/svg','line');
    const cx = parseFloat(fileEl.style.left) + 40, cy = parseFloat(fileEl.style.top) + 36;
    l.setAttribute('x1', HOME.x); l.setAttribute('y1', HOME.y);
    l.setAttribute('x2', cx); l.setAttribute('y2', cy);
    l.setAttribute('stroke', 'var(--bk-border)'); l.setAttribute('stroke-width', 2);
    traj.appendChild(l);
  }

  /* ---- lanzamiento ---- */
  function launch(vx, vy){
    if (busy) return;
    if (!current){
      msg.textContent = 'Primero elige un archivo: usa "Explorar archivos" o arrástralo al recuadro.';
      clearTraj(); placeChip(HOME.x, HOME.y);
      return;
    }
    busy = true;
    const f = current;
    clearTraj();
    fileEl.style.visibility = 'hidden';
    ball.style.display = 'block'; ball.style.opacity = 1;
    msg.textContent = 'Lanzando…';

    let x = HOME.x, y = HOME.y, rot = 0, scored = false, missed = false, last = performance.now();

    function frame(now){
      const dt = Math.min((now - last)/1000, 0.03); last = now;
      const prevY = y;
      vy += G*dt; x += vx*dt; y += vy*dt; rot += vx*dt*2.2;
      ball.style.transform = 'translate('+(x-13)+'px,'+(y-13)+'px) rotate('+rot+'deg)';

      if (!scored && !missed && vy > 0 && prevY < RIM_Y && y >= RIM_Y){
        const dx = Math.abs(x - hoopX());
        if (dx <= RIM_HALF){
          scored = true; vx *= 0.15; hoop.style.zIndex = 6;
          net.animate([{transform:'scaleY(1)'},{transform:'scaleY(1.14)'},{transform:'scaleY(1)'}], {duration:380});
        } else if (dx <= RIM_HALF + 22){
          missed = true; vy = -vy*0.45; vx = (x < hoopX() ? -1 : 1) * Math.max(60, Math.abs(vx)*0.5);
          msg.textContent = 'Rebotó en el aro…';
        } else { missed = true; }
      }

      if (scored){
        const p = Math.min(Math.max((y - (RIM_Y+30))/60, 0), 1);
        ball.style.opacity = 1 - p;
        if (y > RIM_Y + 90){ return finish(true, f); }
      } else if (y > stage.clientHeight + 20 || x < -30 || x > stage.clientWidth + 30){
        return finish(false, f);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function resetChip(){
    ball.style.display = 'none'; hoop.style.zIndex = 3;
    placeChip(HOME.x, HOME.y); fileEl.style.visibility = 'visible'; busy = false;
  }

  function finish(ok, f){
    ball.style.display = 'none';
    if (ok){ upload(f); }
    else {
      msg.textContent = 'Casi. Ajusta la línea punteada e inténtalo otra vez.';
      setTimeout(resetChip, 500);
    }
  }

  /* ---- subida ---- */
  async function upload(f){
    const name = f.name;
    $('bk-dName').textContent = name;
    $('bk-dSize').textContent = fmtSize(f.size);
    $('bk-dock').style.display = 'flex';
    $('bk-ok').style.display = 'none';
    $('bk-st').textContent = 'Subiendo';
    $('bk-fill').style.width = '0';
    $('bk-fill').classList.remove('bk-err');
    msg.textContent = '¡Canasta! ' + name + ' se está subiendo.';

    const t0 = performance.now(), minDur = 1600;
    let done = false, failed = null;
    const job = Promise.resolve()
      .then(() => window.onBasketUpload(f))
      .then(() => { done = true; })
      .catch(e => { failed = e; done = true; });
    await new Promise(res => (function step(now){
      const p = Math.min((now - t0)/minDur, 1);
      $('bk-fill').style.width = ((done ? p : Math.min(p, 0.9)) * 100) + '%';
      (p < 1 || !done) ? requestAnimationFrame(step) : res();
    })(t0));
    await job;

    if (failed){
      $('bk-fill').classList.add('bk-err');
      $('bk-st').textContent = 'Error';
      msg.textContent = 'No se pudo subir ' + name + ': ' + ((failed && failed.message) || 'error desconocido') + '.';
      setTimeout(resetChip, 900);   // el archivo se queda listo para reintentar
      return;
    }

    $('bk-fill').style.width = '100%';
    $('bk-st').textContent = 'Subido';
    $('bk-ok').style.display = 'flex';
    $('bk-cnt').textContent = ++count;
    msg.textContent = queue.length ? 'Siguiente archivo listo.' : 'Listo. Puedes elegir otro archivo y volver a lanzar.';
    setTimeout(() => { nextFromQueue(); resetChip(); }, 900);
  }

  /* ---- arrastre tipo honda ---- */
  let drag = false;
  function pullFromPointer(e){
    const s = stage.getBoundingClientRect();
    let px = e.clientX - s.left - HOME.x, py = e.clientY - s.top - HOME.y;
    const d = Math.hypot(px, py);
    if (d > MAXP){ px *= MAXP/d; py *= MAXP/d; }
    return { px, py };
  }
  fileEl.addEventListener('pointerdown', e => {
    if (busy) return; drag = true; fileEl.setPointerCapture(e.pointerId);
    fileEl.style.cursor = 'grabbing';
  });
  fileEl.addEventListener('pointermove', e => {
    if (!drag) return;
    const { px, py } = pullFromPointer(e);
    placeChip(HOME.x + px, HOME.y + py);
    drawTraj(-px*K, -py*K);
  });
  fileEl.addEventListener('pointerup', e => {
    if (!drag) return; drag = false; fileEl.style.cursor = 'grab';
    const { px, py } = pullFromPointer(e);
    if (Math.hypot(px, py) < MINP){ placeChip(HOME.x, HOME.y); clearTraj(); return; }
    launch(-px*K, -py*K);
  });

  /* ---- tiro automático (calcula el lanzamiento perfecto) ---- */
  function autoShot(){
    if (busy) return;
    if (!current){ launch(0, 0); return; }   // muestra el aviso de elegir archivo
    const T = 1.0;
    const vx = (hoopX() - HOME.x) / T;
    const vy = (RIM_Y - HOME.y) / T - 0.5*G*T;
    placeChip(HOME.x - vx/K, HOME.y - vy/K);
    drawTraj(vx, vy);
    msg.textContent = 'Apuntando…';
    busy = true;
    setTimeout(() => { busy = false; launch(vx, vy); }, 700);
  }

  /* ---- botones y archivos ---- */
  $('bk-btnShot').onclick = autoShot;
  $('bk-btnBrowse').onclick = () => $('bk-input').click();
  $('bk-input').onchange = e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    queue = files; nextFromQueue();
    msg.textContent = files.length + ' archivo(s) listos. Jala y lanza, o pulsa "Lanzar por mí".';
    e.target.value = '';
  };

  ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', e => {
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || busy) return;
    queue = files; nextFromQueue(); autoShot();
  });

  /* ---- reinicio al abrir en otro proyecto ---- */
  window.BasketUploader = {
    reset(){
      if (busy) return;
      queue = []; count = 0; setCurrent(null);
      $('bk-cnt').textContent = '0';
      $('bk-dock').style.display = 'none';
      msg.textContent = MSG_INICIO;
      clearTraj(); resetChip();
    }
  };

  setCurrent(null);
  msg.textContent = MSG_INICIO;
  placeChip(HOME.x, HOME.y);
})();
