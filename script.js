const $ = id => document.getElementById(id);

const app = {
  started: false,
  startDate: null,
  timer: null,
  stops: [],
  nextId: 1
};

function pad(n){ return String(n).padStart(2,"0"); }

function parseDuration(value){
  const v = value.trim();
  if(!v) return NaN;
  const parts = v.split(":").map(Number);
  if(parts.length === 1 && Number.isFinite(parts[0])) return parts[0];
  if(parts.length === 2 && parts.every(Number.isFinite) && parts[0] >= 0 && parts[1] >= 0 && parts[1] < 60)
    return parts[0] * 60 + parts[1];
  return NaN;
}

function formatDuration(minutes){
  if(!Number.isFinite(minutes)) return "00:00";
  minutes = Math.max(0, Math.round(minutes));
  return `${pad(Math.floor(minutes/60))}:${pad(minutes%60)}`;
}

function formatClock(date){
  return date.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
}

function timeToMinutes(time){
  if(!time) return NaN;
  const [h,m] = time.split(":").map(Number);
  return h*60+m;
}

function minutesFromMidnight(date){
  return date.getHours()*60 + date.getMinutes() + date.getSeconds()/60;
}

function clockDifference(actual, expected){
  let d = actual - expected;
  if(d > 720) d -= 1440;
  if(d < -720) d += 1440;
  return d;
}

function formatDifference(delta){
  if(Math.abs(delta) < 0.5) return {text:"ON TIME", cls:"ontime"};
  if(delta < 0) return {text:`${Math.round(Math.abs(delta))} min early`, cls:"ahead"};
  return {text:`${Math.round(delta)} min late`, cls:"late"};
}

function addStop(position="", expected=""){
  app.stops.push({
    id: app.nextId++,
    position,
    expected,
    crossed: false,
    actual: null
  });
  renderStops();
}

function removeStop(id){
  app.stops = app.stops.filter(s => s.id !== id);
  renderStops();
}

function renderStops(){
  const list = $("stopsList");
  list.innerHTML = "";

  if(app.stops.length === 0){
    list.innerHTML = `<div class="empty">No stops yet. Add your first lecture checkpoint.</div>`;
    return;
  }

  app.stops.forEach((stop,index)=>{
    const row = document.createElement("div");
    row.className = "stop-row";
    row.innerHTML = `
      <div class="stop-number">#${index+1}</div>
      <label>
        <span class="sr-only">Lecture position</span>
        <input class="position-input" value="${escapeHtml(stop.position)}" placeholder="00:15" ${stop.crossed?"disabled":""}>
      </label>
      <label>
        <span class="sr-only">Expected arrival</span>
        <input class="expected-input" type="time" value="${escapeHtml(stop.expected)}" ${stop.crossed?"disabled":""}>
      </label>
      <div class="actual">${stop.actual || "—"}</div>
      <div>${statusForStop(stop)}</div>
      <div>
        ${stop.crossed
          ? `<button class="cross-btn" disabled>✓ Crossed</button>`
          : `<button class="cross-btn cross">Crossed</button>`}
        <button class="ghost-btn delete" style="margin-left:4px;padding:8px 9px">×</button>
      </div>
    `;

    row.querySelector(".position-input").addEventListener("input", e=>{
      stop.position = e.target.value;
      updateDashboard();
    });
    row.querySelector(".expected-input").addEventListener("change", e=>{
      stop.expected = e.target.value;
      updateDashboard();
    });
    row.querySelector(".delete").addEventListener("click",()=>removeStop(stop.id));

    const cross = row.querySelector(".cross");
    if(cross) cross.addEventListener("click",()=>crossStop(stop.id));

    list.appendChild(row);
  });

  updateDashboard();
}

function statusForStop(stop){
  if(!stop.crossed) return `<span class="status-pill pending">Not crossed</span>`;
  const expected = timeToMinutes(stop.expected);
  const actual = timeStringToMinutes(stop.actual);
  const result = formatDifference(clockDifference(actual,expected));
  return `<span class="status-pill ${result.cls}">${result.text}</span>`;
}

function timeStringToMinutes(value){
  const match = value.match(/(\d+):(\d+):(\d+)/);
  if(!match) return NaN;
  return Number(match[1])*60 + Number(match[2]) + Number(match[3])/60;
}

function crossStop(id){
  if(!app.started){
    $("startNote").textContent = "Start the lecture first.";
    return;
  }

  const stop = app.stops.find(s=>s.id===id);
  if(!stop) return;

  if(!stop.position || Number.isNaN(parseDuration(stop.position))){
    $("startNote").textContent = "Enter a valid lecture position such as 00:15 or 01:23.";
    return;
  }
  if(!stop.expected){
    $("startNote").textContent = "Enter the expected arrival time before crossing this stop.";
    return;
  }

  stop.crossed = true;
  stop.actual = formatClock(new Date());
  renderStops();
  updateDashboard();
}

function updateClock(){
  $("liveClock").textContent = formatClock(new Date());
}

function updateDashboard(){
  const total = parseDuration($("duration").value);
  const crossed = app.stops
    .filter(s=>s.crossed && Number.isFinite(parseDuration(s.position)))
    .sort((a,b)=>parseDuration(a.position)-parseDuration(b.position));

  const covered = crossed.length ? parseDuration(crossed[crossed.length-1].position) : 0;
  const percentage = Number.isFinite(total) && total > 0 ? Math.min(100,covered/total*100) : 0;

  $("covered").innerHTML = `${formatDuration(covered)} <span>/ ${Number.isFinite(total)?formatDuration(total):"00:00"}</span>`;
  $("progressFill").style.width = `${percentage}%`;
  $("progressPercent").textContent = `${Math.round(percentage)}%`;
  $("remaining").textContent = `${formatDuration(Math.max(0,(total||0)-covered))} remaining`;

  if(app.started){
    const start = new Date(app.startDate);
    const elapsed = Math.max(0,(Date.now()-start.getTime())/60000);
    const projected = Number.isFinite(total) ? new Date(start.getTime()+total*60000) : null;

    if(projected){
      $("projectedFinish").textContent = projected.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      $("finishSub").textContent = `Scheduled from ${start.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
    }

    if(crossed.length){
      const last = crossed[crossed.length-1];
      const delta = clockDifference(timeStringToMinutes(last.actual),timeToMinutes(last.expected));
      const result = formatDifference(delta);
      $("overallStatus").textContent = result.text;
      $("overallSub").textContent = `Last crossed stop: ${formatDuration(parseDuration(last.position))}`;
      $("statusIcon").textContent = delta < -0.5 ? "▲" : delta > 0.5 ? "▼" : "●";
      $("statusIcon").className = `status-icon ${result.cls==="ahead"?"running-green":result.cls==="late"?"running-red":"running-blue"}`;
    } else {
      $("overallStatus").textContent = "On the way";
      $("overallSub").textContent = "No checkpoint crossed yet.";
      $("statusIcon").textContent = "●";
      $("statusIcon").className = "status-icon running-blue";
    }
  }
}

function startLecture(){
  const time = $("startTime").value;
  const total = parseDuration($("duration").value);

  if(!time){
    $("startNote").textContent = "Please enter the lecture start time.";
    return;
  }
  if(!Number.isFinite(total) || total <= 0){
    $("startNote").textContent = "Enter total duration in HH:MM format, for example 01:30.";
    return;
  }

  const [h,m] = time.split(":").map(Number);
  const now = new Date();
  const start = new Date();
  start.setHours(h,m,0,0);

  app.started = true;
  app.startDate = start;

  $("startBtn").textContent = "✓ Lecture Running";
  $("startBtn").style.background = "#16865a";
  $("startNote").textContent = `Started at ${time}. Cross each stop when you reach it.`;
  updateDashboard();
}

function clearAll(){
  if(!confirm("Clear this lecture and all checkpoints?")) return;
  app.started = false;
  app.startDate = null;
  app.stops = [];
  app.nextId = 1;
  $("lectureName").value = "";
  $("duration").value = "";
  $("startTime").value = "";
  $("startBtn").textContent = "▶ Start Lecture";
  $("startBtn").style.background = "";
  $("startNote").textContent = "Enter your start time and begin when you're ready.";
  addStop("00:15","");
  addStop("00:45","");
  addStop("01:23","");
  updateDashboard();
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

$("addStopBtn").addEventListener("click",()=>addStop());
$("startBtn").addEventListener("click",startLecture);
$("clearBtn").addEventListener("click",clearAll);
$("duration").addEventListener("input",updateDashboard);

addStop("00:15","");
addStop("00:45","");
addStop("01:23","");

updateClock();
setInterval(()=>{
  updateClock();
  updateDashboard();
},1000);
