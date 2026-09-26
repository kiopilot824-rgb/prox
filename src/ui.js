// ui.js — پنل مدیریت Chop (HTML/CSS/JS، بدون نیاز به build جدا)

const BASE_STYLE = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
  :root{
    --base:#05080A; --panel:rgba(11,22,17,.82); --panel2:rgba(16,30,23,.92); --line:#1E3B2C;
    --edge:#39FF88; --edge2:#7CFFC4; --edge-dim:#0F5A34; --online:#39FF88; --warn:#FFD166; --danger:#FF3B5C;
    --ink:#E8FFF1; --ink-dim:#5F9C7C;
    --glow1:rgba(57,255,136,.16); --glow2:rgba(124,255,196,.10); --glow3:rgba(255,209,102,.08);
    --ease:cubic-bezier(.4,0,.2,1);
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    margin:0;color:var(--ink);font-family:'JetBrains Mono',monospace;-webkit-font-smoothing:antialiased;
    background:
      radial-gradient(900px 480px at 12% -8%, rgba(57,255,136,.10), transparent 60%),
      radial-gradient(700px 420px at 100% 0%, rgba(124,255,196,.06), transparent 55%),
      linear-gradient(rgba(57,255,136,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(57,255,136,.05) 1px, transparent 1px),
      var(--base);
    background-size:auto,auto,38px 38px,38px 38px;
    background-attachment:fixed;
    min-height:100vh;
    position:relative;
  }
  body::before{
    content:'';position:fixed;inset:0;z-index:2000;pointer-events:none;
    background:repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0px, rgba(0,0,0,.14) 1px, transparent 1px, transparent 3px);
    opacity:.4;mix-blend-mode:overlay;
  }
  body::after{
    content:'';position:fixed;inset:0;z-index:1999;pointer-events:none;
    box-shadow:inset 0 0 14vw 3vw rgba(0,0,0,.75);
  }
  .bg-orb{position:fixed;border-radius:50%;filter:blur(60px);pointer-events:none;z-index:0;opacity:.75}
  .bg-orb.o1{width:420px;height:420px;top:-140px;right:-100px;background:radial-gradient(circle,var(--glow1),transparent 70%);animation:orbFloat 14s ease-in-out infinite}
  .bg-orb.o2{width:360px;height:360px;bottom:-120px;left:-80px;background:radial-gradient(circle,var(--glow2),transparent 70%);animation:orbFloat 18s ease-in-out infinite reverse}
  .bg-orb.o3{width:260px;height:260px;top:40%;left:50%;background:radial-gradient(circle,var(--glow3),transparent 70%);animation:orbFloat 22s ease-in-out infinite}
  @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(24px,-18px) scale(1.08)}66%{transform:translate(-18px,20px) scale(.95)}}
  @media (prefers-reduced-motion: reduce){ .bg-orb{animation:none} }
  ::selection{background:rgba(57,255,136,.35);color:#02110A}
  .mono{font-family:'JetBrains Mono',monospace}
  .display{font-family:'Sora',sans-serif}
  .chop-mark{display:flex;align-items:center;gap:10px}
  .chop-mark .dot{width:10px;height:10px;border-radius:50%;background:var(--edge);box-shadow:0 0 16px 3px rgba(57,255,136,.75);animation:blipPulse 1.8s ease-in-out infinite}
  @keyframes blipPulse{0%,100%{opacity:1}50%{opacity:.45}}
  .chop-mark h1{font-family:'Sora',sans-serif;font-weight:800;font-size:22px;letter-spacing:.02em;margin:0;background:linear-gradient(135deg,var(--ink) 30%,var(--edge2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 0 22px rgba(57,255,136,.25)}
  .chop-mark h1::before{content:'root@';font-family:'JetBrains Mono',monospace;font-weight:500;font-size:13px;color:var(--ink-dim);-webkit-text-fill-color:var(--ink-dim);margin-left:6px;letter-spacing:0}
  .chop-line{height:6px;width:100%;background:
    linear-gradient(135deg, var(--edge) 25%, transparent 25%) -3px 0,
    linear-gradient(225deg, var(--edge) 25%, transparent 25%) -3px 0;
    background-size:12px 12px; background-repeat:repeat-x; opacity:.8;
    box-shadow:0 2px 16px -2px rgba(57,255,136,.55)}
  a{color:inherit}
  input,select,textarea{
    background:var(--panel2); border:1px solid var(--line); color:var(--ink);
    border-radius:6px; padding:10px 12px; font-family:'JetBrains Mono',monospace; font-size:13px; width:100%;
    transition:border-color .15s var(--ease), box-shadow .15s var(--ease), background .15s var(--ease);
  }
  input:hover,select:hover,textarea:hover{border-color:#2c5943}
  input:focus,select:focus,textarea:focus{outline:none;border-color:var(--edge);box-shadow:0 0 0 3px rgba(57,255,136,.14),0 0 14px rgba(57,255,136,.18);background:rgba(57,255,136,.04)}
  input::placeholder,textarea::placeholder{color:rgba(95,156,124,.55)}
  label{font-size:11px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace;display:block;margin-bottom:6px}
  button{cursor:pointer;font-family:'JetBrains Mono',monospace;border:none}
  .btn-primary{
    position:relative;overflow:hidden;
    background:linear-gradient(135deg,var(--edge2),var(--edge));color:#02150C;font-weight:700;letter-spacing:.03em;
    border-radius:6px;padding:10px 18px;font-size:13px;transition:filter .15s var(--ease), transform .1s var(--ease), box-shadow .15s var(--ease);
    box-shadow:0 0 0 1px rgba(57,255,136,.35), 0 4px 18px -4px rgba(57,255,136,.55);
    text-transform:uppercase;
  }
  .btn-primary::before{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);
    transition:left .55s var(--ease)}
  .btn-primary:hover::before{left:130%}
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 0 0 1px rgba(57,255,136,.5), 0 8px 24px -6px rgba(57,255,136,.7)}
  .btn-primary:active{transform:translateY(0)}
  .btn-primary:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}
  .btn-ghost{position:relative;overflow:hidden;background:rgba(57,255,136,.05);border:1px solid var(--line);color:var(--ink-dim);border-radius:6px;padding:7px 12px;font-size:12px;font-family:'JetBrains Mono',monospace;transition:all .15s var(--ease)}
  .btn-ghost:hover{color:var(--edge);border-color:var(--edge);background:rgba(57,255,136,.1);box-shadow:0 0 12px rgba(57,255,136,.15);transform:translateY(-1px)}
  .btn-ghost:active{transform:translateY(0)}
  .btn-ghost.danger:hover{color:var(--danger);border-color:var(--danger);background:rgba(255,59,92,.1);box-shadow:0 0 12px rgba(255,59,92,.18)}
  .btn-ghost.online-btn:hover{color:var(--online);border-color:var(--online);background:rgba(57,255,136,.1)}
  .card{
    background:linear-gradient(180deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:10px;
    box-shadow:0 1px 0 rgba(57,255,136,.04) inset, 0 10px 34px -18px rgba(0,0,0,.8), 0 0 0 1px rgba(57,255,136,.03);
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);position:relative;
    transition:border-color .2s var(--ease), box-shadow .25s var(--ease), transform .2s var(--ease);
  }
  .card::before{content:'';position:absolute;inset:-1px;border-radius:11px;padding:1px;z-index:-1;opacity:0;
    background:conic-gradient(from var(--ang,0deg),var(--edge),transparent 25%,transparent 75%,var(--edge2));
    -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
    -webkit-mask-composite:xor;mask-composite:exclude;
    transition:opacity .3s var(--ease);animation:spinAng 6s linear infinite}
  .card:hover::before{opacity:.55}
  @keyframes spinAng{to{--ang:360deg}}
  @property --ang{syntax:'<angle>';inherits:false;initial-value:0deg}
  table{width:100%;border-collapse:collapse;font-size:12.5px;font-family:'JetBrains Mono',monospace}
  th{text-align:right;color:var(--ink-dim);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;padding:10px 8px;border-bottom:1px solid var(--line);font-family:'JetBrains Mono',monospace}
  td{padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
  tbody tr{transition:background .15s var(--ease), box-shadow .15s var(--ease)}
  tbody tr:nth-child(even){background:rgba(57,255,136,.015)}
  tbody tr:hover{background:rgba(57,255,136,.06);box-shadow:inset 3px 0 0 var(--edge)}
  .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:20px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;position:relative}
  .tab{padding:10px 16px;font-size:12.5px;color:var(--ink-dim);border-bottom:2px solid transparent;cursor:pointer;transition:color .15s var(--ease), border-color .15s var(--ease), background .15s var(--ease);text-transform:uppercase;letter-spacing:.04em;border-radius:6px 6px 0 0}
  .tab::before{content:'> ';opacity:0;transition:opacity .15s var(--ease)}
  .tab:hover{color:var(--ink);background:rgba(57,255,136,.05)}
  .tab.active{color:var(--edge);border-bottom-color:var(--edge);text-shadow:0 0 10px rgba(57,255,136,.5);background:rgba(57,255,136,.08)}
  .tab.active::before{opacity:1}
  .pill{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:4px;font-size:10.5px;font-family:'JetBrains Mono',monospace;border:1px solid transparent;letter-spacing:.04em;text-transform:uppercase}
  .pill::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}
  .pill.on{background:rgba(57,255,136,.12);color:var(--online);border-color:rgba(57,255,136,.3);box-shadow:0 0 8px rgba(57,255,136,.2)}
  .pill.on::before{animation:blipPulse 1.8s ease-in-out infinite}
  .pill.off{background:rgba(255,59,92,.12);color:var(--danger);border-color:rgba(255,59,92,.3)}
  .modal-bg{
    position:fixed;inset:0;background:rgba(2,6,4,.78);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:16px;z-index:50;
    animation:fadeIn .15s var(--ease);
  }
  .modal-bg .card{animation:pop .18s var(--ease)}
  .stat{
    background:linear-gradient(180deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:10px;padding:16px 16px 16px 18px;
    position:relative;overflow:hidden;transition:transform .18s var(--ease), border-color .18s var(--ease), box-shadow .18s var(--ease);
    font-family:'JetBrains Mono',monospace;
  }
  .stat::before{content:'';position:absolute;top:0;bottom:0;right:0;width:3px;background:linear-gradient(180deg,var(--edge2),var(--edge));box-shadow:0 0 10px rgba(57,255,136,.5)}
  .stat::after{content:'';position:absolute;top:-40%;left:-20%;width:60%;height:180%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.06),transparent);transform:rotate(8deg);pointer-events:none}
  .stat:hover{transform:translateY(-3px) scale(1.01);border-color:var(--edge-dim);box-shadow:0 12px 30px -14px rgba(57,255,136,.45)}
  .stat .stat-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;
    background:rgba(57,255,136,.1);border:1px solid rgba(57,255,136,.25);color:var(--edge);box-shadow:0 0 10px rgba(57,255,136,.15)}
  .stat .stat-icon svg{width:16px;height:16px}
  .stat .num{font-family:'Sora',sans-serif;font-weight:800;font-size:26px;text-shadow:0 0 16px rgba(57,255,136,.25)}
  .stat .lbl{color:var(--ink-dim);font-size:11px;margin-top:4px;text-transform:uppercase;letter-spacing:.06em}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pop{from{opacity:0;transform:scale(.97) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
  #reqUsageBar{position:relative;overflow:hidden;box-shadow:0 0 12px rgba(57,255,136,.5)}
  #reqUsageBar::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.22) 0 10px,transparent 10px 20px);background-size:28px 28px;animation:barStripe 1.4s linear infinite}
  @keyframes barStripe{from{background-position:0 0}to{background-position:28px 0}}
  ::-webkit-scrollbar{width:8px;height:8px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--line);border-radius:8px}
  ::-webkit-scrollbar-thumb:hover{background:var(--edge-dim)}
  #chopMatrixRain{position:fixed;inset:0;z-index:0;opacity:.16;pointer-events:none}
  #chopMatrixRain + *{position:relative;z-index:1}
  body > div{position:relative;z-index:1}
</style>
<canvas id="chopMatrixRain"></canvas>
<script>
(function(){
  var c = document.getElementById('chopMatrixRain');
  if(!c || !c.getContext) return;
  var ctx = c.getContext('2d');
  var glyphs = 'アイウエオカキクケコサシスセソ01アルゴリズムCHOP0123456789$#%&';
  var fontSize = 15, cols, drops;
  function resize(){
    c.width = window.innerWidth; c.height = window.innerHeight;
    cols = Math.floor(c.width / fontSize);
    drops = new Array(cols).fill(0).map(function(){ return Math.random()*-50; });
  }
  window.addEventListener('resize', resize);
  resize();
  function frame(){
    ctx.fillStyle = 'rgba(5,8,10,0.12)';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#39FF88';
    ctx.font = fontSize+'px monospace';
    for(var i=0;i<drops.length;i++){
      var ch = glyphs[Math.floor(Math.random()*glyphs.length)];
      ctx.fillText(ch, i*fontSize, drops[i]*fontSize);
      if(drops[i]*fontSize > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce) setInterval(frame, 55);
})();
</script>
`;

export function loginPage() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chop — ورود</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&family=Vazirmatn:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root{
    --bg: #04070a; --panel: rgba(9, 20, 18, 0.72); --panel-edge: rgba(124,255,158,0.28);
    --hud: #7CFF9E; --hud-dim: #3d7a56; --hud-amber: #FFB020; --hud-red: #FF4438;
    --text-dim: #6f9585;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{height:100%;}
  body{
    background: radial-gradient(ellipse at 50% 40%, #071410 0%, #030604 60%, #000000 100%);
    color: var(--hud); font-family: 'Vazirmatn', sans-serif; overflow:hidden; height:100vh; position:relative;
    -webkit-font-smoothing:antialiased;
  }
  .mono{ font-family:'Share Tech Mono', monospace; direction:ltr; }
  .grid-bg{
    position:fixed; inset:0;
    background-image: linear-gradient(rgba(124,255,158,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(124,255,158,0.055) 1px, transparent 1px);
    background-size: 42px 42px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 45%, black 0%, transparent 72%);
    mask-image: radial-gradient(ellipse at 50% 45%, black 0%, transparent 72%);
    animation: gridDrift 18s linear infinite; z-index:0;
  }
  @keyframes gridDrift{ from{background-position:0 0;} to{background-position:42px 42px;} }
  .scanlines{ position:fixed; inset:0; z-index:5; pointer-events:none;
    background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px); opacity:0.35; }
  .vignette{ position:fixed; inset:0; z-index:4; pointer-events:none; box-shadow: inset 0 0 18vw 4vw rgba(0,0,0,0.85); }
  #boot{ position:fixed; inset:0; z-index:50; background:#000; display:flex; align-items:center; justify-content:center; transition: opacity .8s ease, visibility .8s ease; }
  #boot.hidden{ opacity:0; visibility:hidden; }
  #bootLog{ direction:ltr; text-align:left; color:var(--hud); font-size:13px; line-height:1.9; width:min(520px, 86vw); letter-spacing:.5px; }
  #bootLog div{ opacity:0; animation: bootIn .15s forwards; white-space:pre-wrap; }
  #bootLog .warn{ color: var(--hud-amber); }
  @keyframes bootIn{ to{opacity:1;} }
  .cursor{ display:inline-block; width:8px; height:14px; background:var(--hud); animation: blink .8s steps(1) infinite; vertical-align:-2px; }
  @keyframes blink{ 50%{ opacity:0; } }
  .hud-topbar{ position:fixed; top:0; left:0; right:0; z-index:10; display:flex; justify-content:space-between; align-items:center;
    padding:16px 28px; font-family:'Share Tech Mono', monospace; font-size:12px; color:var(--hud); letter-spacing:1px; direction:ltr;
    opacity:0; animation: fadeIn 1s ease forwards 2.6s; }
  .topbar-group{ display:flex; gap:22px; align-items:center; }
  .status-dot{ width:7px; height:7px; border-radius:50%; background:var(--hud); display:inline-block; box-shadow:0 0 6px var(--hud); animation:pulse 2s infinite; margin-left:6px;}
  @keyframes pulse{ 50%{opacity:.35;} }
  .divider-v{ width:1px; height:14px; background:var(--panel-edge); }
  .hud-side{ position:fixed; top:90px; bottom:70px; width:64px; z-index:10; display:flex; flex-direction:column; justify-content:space-between;
    font-family:'Share Tech Mono', monospace; font-size:10px; color:var(--hud-dim); direction:ltr; opacity:0; animation: fadeIn 1s ease forwards 3s; }
  .hud-side.left{ left:22px; align-items:flex-start; }
  .hud-side.right{ right:22px; align-items:flex-end; }
  .tape-label{ writing-mode:vertical-rl; letter-spacing:3px; color:var(--hud); font-size:10px; opacity:.8; }
  .tape-ticks{ display:flex; flex-direction:column; gap:10px; }
  .tape-ticks span{ opacity:.55; }
  .tape-ticks span.hi{ color:var(--hud); opacity:1; font-weight:bold; }
  .cockpit-center{ position:fixed; inset:0; z-index:8; display:flex; align-items:center; justify-content:center; }
  .reticle-wrap{ position:relative; width:min(430px, 90vw); display:flex; align-items:center; justify-content:center; }
  .reticle-svg{ position:absolute; width:120%; height:auto; aspect-ratio:1/1; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0; z-index:1; pointer-events:none; }
  .reticle-svg.show{ animation: reticleIn 1.1s ease forwards 1.9s; }
  @keyframes reticleIn{ 0%{ opacity:0; transform:translate(-50%,-50%) scale(1.6); } 60%{ opacity:1; } 100%{ opacity:.9; transform:translate(-50%,-50%) scale(1); } }
  .ring-outer{ animation: spin 26s linear infinite; transform-origin:center; }
  .ring-mid{ animation: spin 18s linear infinite reverse; transform-origin:center; }
  .ring-ticks{ animation: spin 40s linear infinite; transform-origin:center; }
  @keyframes spin{ to{ transform:rotate(360deg); } }
  .glass-panel{ position:relative; z-index:2; width:100%;
    background: linear-gradient(155deg, var(--panel), rgba(4,10,9,0.85)); border:1px solid var(--panel-edge); border-radius:6px;
    padding:30px 30px 26px; backdrop-filter: blur(6px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 40px rgba(124,255,158,0.08), inset 0 0 40px rgba(124,255,158,0.03);
    opacity:0; transform: translateY(10px); animation: panelIn .9s ease forwards 2.7s; }
  @keyframes panelIn{ to{ opacity:1; transform:translateY(0); } }
  .corner-bracket{ position:absolute; width:16px; height:16px; border-color:var(--hud); opacity:.9; }
  .corner-bracket.tl{ top:-1px; left:-1px; border-top:2px solid; border-left:2px solid; }
  .corner-bracket.tr{ top:-1px; right:-1px; border-top:2px solid; border-right:2px solid; }
  .corner-bracket.bl{ bottom:-1px; left:-1px; border-bottom:2px solid; border-left:2px solid; }
  .corner-bracket.br{ bottom:-1px; right:-1px; border-bottom:2px solid; border-right:2px solid; }
  .panel-eyebrow{ font-family:'Share Tech Mono', monospace; direction:ltr; text-align:center; font-size:10.5px; letter-spacing:4px; color:var(--hud-dim); margin-bottom:6px; }
  .panel-title{ font-family:'Orbitron', sans-serif; font-weight:900; text-align:center; font-size:22px; letter-spacing:1px; color:var(--hud); margin-bottom:4px; text-shadow:0 0 12px rgba(124,255,158,0.5); }
  .panel-sub{ text-align:center; font-size:11.5px; color:var(--text-dim); margin-bottom:22px; font-family:'Share Tech Mono',monospace; direction:ltr; letter-spacing:1px; }
  .field{ margin-bottom:16px; position:relative; }
  .field label{ display:block; font-size:12px; color:var(--hud-dim); margin-bottom:6px; letter-spacing:.5px; display:flex; justify-content:space-between; align-items:center; }
  .field label .tag{ font-family:'Share Tech Mono',monospace; direction:ltr; font-size:9.5px; opacity:.7; }
  .field input{ width:100%; background: rgba(124,255,158,0.04); border:1px solid var(--panel-edge); color:var(--hud); padding:11px 14px;
    font-family:'Share Tech Mono', monospace; font-size:13px; border-radius:3px; outline:none; direction:ltr; text-align:left; letter-spacing:1px;
    transition: border-color .2s, box-shadow .2s, background .2s; }
  .field input::placeholder{ color:rgba(124,255,158,0.25); letter-spacing:1px;}
  .field input:focus{ border-color: var(--hud); background: rgba(124,255,158,0.08); box-shadow: 0 0 14px rgba(124,255,158,0.25); }
  .auth-btn{ width:100%; position:relative; overflow:hidden; background:transparent; border:1px solid var(--hud); color:var(--hud);
    font-family:'Orbitron', sans-serif; font-weight:700; letter-spacing:3px; font-size:13px; padding:13px 0; cursor:pointer; border-radius:3px;
    transition: color .25s, background .25s; }
  .auth-btn:hover{ background: rgba(124,255,158,0.1); }
  .auth-btn:active{ transform:translateY(1px); }
  .auth-btn .sweep{ position:absolute; top:0; bottom:0; left:-40%; width:40%; background: linear-gradient(90deg, transparent, rgba(124,255,158,0.35), transparent); transform: skewX(-20deg); }
  .auth-btn.scanning .sweep{ animation: sweepMove 1.1s linear infinite; }
  @keyframes sweepMove{ from{ left:-40%; } to{ left:120%; } }
  .status-line{ margin-top:16px; text-align:center; font-size:10.5px; font-family:'Share Tech Mono', monospace; direction:ltr; letter-spacing:1px; color:var(--hud-dim); transition: color .3s; }
  .status-line.warn{ color: var(--hud-amber); }
  .status-line.ok{ color: var(--hud); text-shadow:0 0 8px rgba(124,255,158,0.6); }
  .radar-widget{ position:fixed; bottom:24px; left:26px; z-index:10; width:96px; height:96px; opacity:0; animation: fadeIn 1s ease forwards 3.1s; }
  .radar-widget .ring{ position:absolute; inset:0; border-radius:50%; border:1px solid rgba(124,255,158,0.25); }
  .radar-widget .ring2{ inset:16px; }
  .radar-widget .ring3{ inset:32px; }
  .radar-sweep{ position:absolute; inset:0; border-radius:50%; overflow:hidden; }
  .radar-sweep::before{ content:""; position:absolute; inset:0; background: conic-gradient(from 0deg, rgba(124,255,158,0.55), transparent 32%); animation: spin 2.6s linear infinite; }
  .radar-label{ position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-family:'Share Tech Mono', monospace; font-size:9px; color:var(--hud-dim); letter-spacing:2px; direction:ltr; }
  .hud-bottom{ position:fixed; bottom:0; left:0; right:0; z-index:10; display:flex; justify-content:space-between; align-items:center;
    padding:14px 28px; font-family:'Share Tech Mono', monospace; font-size:11px; color:var(--hud-dim); letter-spacing:1px; direction:ltr;
    opacity:0; animation: fadeIn 1s ease forwards 3.2s; }
  @keyframes fadeIn{ to{ opacity:1; } }
  @media (max-width: 640px){
    .hud-side{ display:none; } .hud-topbar{ font-size:10px; padding:12px 14px; } .topbar-group{ gap:12px; }
    .hud-bottom{ font-size:9.5px; padding:10px 14px; } .radar-widget{ width:64px; height:64px; left:14px; bottom:14px; }
  }
  @media (prefers-reduced-motion: reduce){ *{ animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; } }
  input:focus-visible, .auth-btn:focus-visible{ outline:2px solid var(--hud-amber); outline-offset:2px; }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="scanlines"></div>
  <div class="vignette"></div>

  <div id="boot"><div id="bootLog" class="mono"></div></div>

  <div class="hud-topbar">
    <div class="topbar-group">
      <span><span class="status-dot"></span>SYS NOMINAL</span>
      <div class="divider-v"></div>
      <span id="clockReadout">00:00:00Z</span>
    </div>
    <div class="topbar-group">
      <span>PANEL: <span style="color:#fff">CHOP</span></span>
      <div class="divider-v"></div>
      <span>SEC LEVEL: <span style="color:var(--hud-amber)">ALPHA</span></span>
    </div>
  </div>

  <div class="hud-side left">
    <div class="tape-label">THREAT&nbsp;ASSESSMENT</div>
    <div class="tape-ticks" id="threatTicks"></div>
  </div>
  <div class="hud-side right">
    <div class="tape-label" style="writing-mode:vertical-lr;">LINK&nbsp;INTEGRITY</div>
    <div class="tape-ticks" id="linkTicks" style="align-items:flex-end;"></div>
  </div>

  <main class="cockpit-center">
    <div class="reticle-wrap">
      <svg class="reticle-svg" id="reticleSvg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <g class="ring-ticks" stroke="#7CFF9E" stroke-width="1" opacity="0.5"><circle cx="200" cy="200" r="188" fill="none" stroke-dasharray="2 8"/></g>
        <g class="ring-outer" stroke="#7CFF9E" fill="none">
          <circle cx="200" cy="200" r="168" stroke-width="1" opacity="0.55"/>
          <line x1="200" y1="14" x2="200" y2="40" stroke-width="2"/>
          <line x1="200" y1="360" x2="200" y2="386" stroke-width="2"/>
          <line x1="14" y1="200" x2="40" y2="200" stroke-width="2"/>
          <line x1="360" y1="200" x2="386" y2="200" stroke-width="2"/>
        </g>
        <g class="ring-mid" stroke="#7CFF9E" fill="none" opacity="0.7">
          <path d="M 200 60 A 140 140 0 0 1 320 130" stroke-width="2"/>
          <path d="M 320 270 A 140 140 0 0 1 200 340" stroke-width="2"/>
          <path d="M 80 270 A 140 140 0 0 1 80 130" stroke-width="2"/>
        </g>
        <g stroke="#FFB020" stroke-width="1.5" opacity="0.85">
          <line x1="200" y1="180" x2="200" y2="220"/>
          <line x1="180" y1="200" x2="220" y2="200"/>
        </g>
      </svg>

      <div class="glass-panel">
        <span class="corner-bracket tl"></span><span class="corner-bracket tr"></span>
        <span class="corner-bracket bl"></span><span class="corner-bracket br"></span>

        <div class="panel-eyebrow">RESTRICTED // AUTHORIZED PERSONNEL ONLY</div>
        <div class="panel-title">ورود مدیر</div>
        <div class="panel-sub">CHOP ADMIN ACCESS TERMINAL</div>

        <div class="field">
          <label>نام کاربری <span class="tag">USER ID</span></label>
          <input type="text" id="u" placeholder="callsign..." autocomplete="username">
        </div>
        <div class="field">
          <label>رمز عبور <span class="tag">ACCESS CODE</span></label>
          <input type="password" id="p" placeholder="••••••••••" autocomplete="current-password">
        </div>

        <button type="button" class="auth-btn" id="authBtn" onclick="doLogin()">
          <span class="sweep"></span>
          <span id="btnLabel">شناسایی و ورود</span>
        </button>

        <div class="status-line mono" id="statusLine">STATUS: STANDING BY FOR INPUT</div>
      </div>
    </div>
  </main>

  <div class="radar-widget">
    <div class="ring"></div><div class="ring ring2"></div><div class="ring ring3"></div>
    <div class="radar-sweep"></div>
    <div class="radar-label">RADAR</div>
  </div>

  <div class="hud-bottom">
    <span id="altReadoutWrap">ALT <span id="altReadout">31,240</span> FT</span>
    <span>LINK: CHOP-PANEL</span>
    <span>SEC: TLS</span>
  </div>

<script>
  const bootLines = [
    ["> INITIALIZING AVIONICS SUITE ...", "ok"],
    ["> LOADING SECURE KERNEL ................. [OK]", "ok"],
    ["> CANOPY HUD LINK ........................ [OK]", "ok"],
    ["> IFF TRANSPONDER ........................ [OK]", "ok"],
    ["> RADAR ARRAY ............................ [OK]", "ok"],
    ["> ENCRYPTION HANDSHAKE ................... [WARN: MANUAL AUTH REQUIRED]", "warn"],
    ["> AWAITING ADMIN CREDENTIALS ............. [STANDBY]", "warn"],
  ];
  const bootLog = document.getElementById('bootLog');
  let delay = 150;
  bootLines.forEach(line=>{
    const div = document.createElement('div');
    div.className = line[1];
    div.style.animationDelay = delay+'ms';
    div.textContent = line[0];
    bootLog.appendChild(div);
    delay += 260;
  });
  const cursorDiv = document.createElement('div');
  cursorDiv.style.animationDelay = delay+'ms';
  cursorDiv.innerHTML = '<span class="cursor"></span>';
  bootLog.appendChild(cursorDiv);
  setTimeout(()=>{
    document.getElementById('boot').classList.add('hidden');
    document.getElementById('reticleSvg').classList.add('show');
  }, delay+500);

  function updateClock(){
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    const ss = String(now.getUTCSeconds()).padStart(2,'0');
    document.getElementById('clockReadout').textContent = hh+':'+mm+':'+ss+'Z';
  }
  updateClock(); setInterval(updateClock, 1000);

  setInterval(()=>{
    const base = 31240;
    const flutter = Math.floor(Math.random()*40)-20;
    document.getElementById('altReadout').textContent = (base+flutter).toLocaleString('en-US');
  }, 1400);

  function buildTicks(id, count, hiIndex){
    const el = document.getElementById(id);
    for(let i=0;i<count;i++){
      const span = document.createElement('span');
      const val = (count-i)*10;
      span.textContent = val.toString().padStart(3,'0');
      if(i===hiIndex) span.classList.add('hi');
      el.appendChild(span);
    }
  }
  buildTicks('threatTicks', 8, 3);
  buildTicks('linkTicks', 8, 5);

  const authBtn = document.getElementById('authBtn');
  const btnLabel = document.getElementById('btnLabel');
  const statusLine = document.getElementById('statusLine');

  async function doLogin(){
    const u = document.getElementById('u').value;
    const p = document.getElementById('p').value;
    if(!u || !p){
      statusLine.textContent = 'STATUS: MISSING FIELD — INPUT REQUIRED';
      statusLine.className = 'status-line mono warn';
      return;
    }
    authBtn.classList.add('scanning');
    authBtn.disabled = true;
    btnLabel.textContent = 'در حال شناسایی...';
    statusLine.textContent = 'STATUS: SCANNING CREDENTIALS ...';
    statusLine.className = 'status-line mono warn';
    try{
      const res = await fetch('/api/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username:u, password:p})
      });
      const data = await res.json();
      authBtn.classList.remove('scanning');
      if(!res.ok){
        authBtn.disabled = false;
        btnLabel.textContent = 'شناسایی و ورود';
        statusLine.textContent = 'STATUS: ACCESS DENIED — ' + (data.detail || 'خطا');
        statusLine.className = 'status-line mono warn';
        statusLine.style.color = 'var(--hud-red)';
        return;
      }
      btnLabel.textContent = 'دسترسی تایید شد';
      statusLine.textContent = 'STATUS: ACCESS GRANTED — WELCOME, ' + u.toUpperCase();
      statusLine.className = 'status-line mono ok';
      document.querySelector('.glass-panel').style.boxShadow =
        '0 0 0 1px rgba(0,0,0,0.4), 0 0 60px rgba(124,255,158,0.35), inset 0 0 50px rgba(124,255,158,0.08)';
      setTimeout(()=>{ location.href='/dashboard'; }, 500);
    }catch(e){
      authBtn.classList.remove('scanning');
      authBtn.disabled = false;
      btnLabel.textContent = 'شناسایی و ورود';
      statusLine.textContent = 'STATUS: LINK FAILURE — NETWORK ERROR';
      statusLine.className = 'status-line mono warn';
      statusLine.style.color = 'var(--hud-red)';
    }
  }
  document.getElementById('p').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
</script>
</body>
</html>`;
}

export function dashboardPage() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chop — پنل مدیریت</title>
${BASE_STYLE}
</head>
<body>
<div class="bg-orb o1" aria-hidden="true"></div>
<div class="bg-orb o2" aria-hidden="true"></div>
<div class="bg-orb o3" aria-hidden="true"></div>
<div style="max-width:1080px;margin:0 auto;padding:24px 16px 60px;animation:fadeIn .25s var(--ease)">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
    <div class="chop-mark"><span class="dot"></span><h1>Chop</h1></div>
    <button class="btn-ghost" onclick="logout()">خروج</button>
  </div>
  <div class="chop-line" style="border-radius:3px;margin-bottom:24px"></div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px" id="stats"></div>

  <div class="card" style="margin-bottom:24px;padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <label style="margin:0">شمارنده‌ی مصرف درخواست امروز (سقف مرجع، قابل تغییر)</label>
      <span id="reqUsageText" class="mono" style="font-size:12px;color:var(--ink-dim)"></span>
    </div>
    <div style="background:var(--line);border-radius:6px;height:10px;overflow:hidden">
      <div id="reqUsageBar" style="height:100%;width:0%;background:var(--online);transition:width .3s"></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px">
      <div id="reqUsageHistory" class="mono" style="font-size:11px;color:var(--ink-dim)"></div>
      <div style="display:flex;gap:6px;align-items:center">
        <label style="margin:0;font-size:11px">سقف روزانه</label>
        <input id="reqLimitInput" type="number" style="width:110px" value="100000">
        <button class="btn-ghost" onclick="saveRequestLimit()">ذخیره</button>
      </div>
    </div>
  </div>

  <div class="tabs">
    <div class="tab active" data-tab="configs">⧉ کانفیگ‌ها</div>
    <div class="tab" data-tab="mtproto">✈ پروکسی تلگرام</div>
    <div class="tab" data-tab="logs">☰ لاگ اتصال‌ها</div>
    <div class="tab" data-tab="bot">◈ ربات تلگرام</div>
    <div class="tab" data-tab="backup">⇅ بکاپ و بازیابی</div>
  </div>

  <div id="tab-configs">
    <div id="configLoadError" style="display:none;background:#3a1a1a;color:#ff8a8a;border:1px solid #5a2a2a;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn-primary" onclick="openConfigModal()">+ کانفیگ جدید</button>
    </div>
    <div class="card" style="overflow:auto">
      <table>
        <thead><tr>
          <th>نام</th><th>وضعیت</th><th>آنلاین</th><th>مصرف</th><th>انقضا</th><th>عملیات</th>
        </tr></thead>
        <tbody id="configRows"></tbody>
      </table>
    </div>
  </div>

  <div id="tab-mtproto" style="display:none">
    <div style="background:#1a2a3a;color:#8ac2ff;border:1px solid #2a4a6a;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12.5px;line-height:1.9">
      هر پروکسی یک پورتِ TCP جداست (نه HTTP). روی Railway باید از بخشِ
      <b>Settings → Networking → TCP Proxy</b> همین سرویس، برای پورتِ داخلیِ
      هر پروکسی یک TCP Proxy بسازی؛ آدرس/پورتی که Railway اونجا نشون
      می‌ده رو در فیلدهای «آدرس عمومی/پورت عمومی» هر پروکسی وارد کن تا
      لینک‌ها درست ساخته بشن.
      <br>می‌خوای «کانال اسپانسر» به کاربرها نشون داده بشه؟ این با رله‌ی
      داخلیِ پنل ممکن نیست — راهنمای راه‌اندازیِ سرویسِ رسمیِ جدا در
      <code>mtproxy/README.md</code> پروژه هست.
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn-primary" onclick="openMtpModal()">+ پروکسی تلگرام جدید</button>
    </div>
    <div class="card" style="overflow:auto">
      <table>
        <thead><tr>
          <th>نام</th><th>پورت داخلی</th><th>آدرس عمومی</th><th>وضعیت</th><th>عملیات</th>
        </tr></thead>
        <tbody id="mtpRows"></tbody>
      </table>
    </div>
  </div>

  <div id="tab-logs" style="display:none">
    <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
      <label style="margin:0">فیلتر کانفیگ:</label>
      <select id="logFilter" style="width:220px" onchange="loadLogs()"><option value="">همه</option></select>
    </div>
    <div class="card" style="overflow:auto">
      <table>
        <thead><tr><th>زمان</th><th>کانفیگ</th><th>IP</th><th>مقصد</th><th>حجم</th></tr></thead>
        <tbody id="logRows"></tbody>
      </table>
    </div>
  </div>

  <div id="tab-bot" style="display:none">
    <div class="card" style="padding:20px;margin-bottom:16px">
      <div style="margin-bottom:14px"><label>توکن ربات (از BotFather)</label><input id="botToken" placeholder="123456:ABC-..."></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <input type="checkbox" id="botEnabled" style="width:auto">
        <label style="margin:0">ربات فعال باشد</label>
      </div>
      <button class="btn-primary" onclick="saveBotSettings()">ذخیره و اتصال Webhook</button>
      <div id="botStatus" class="mono" style="margin-top:14px;font-size:12px;color:var(--ink-dim)"></div>
    </div>
    <div class="card" style="padding:20px;margin-bottom:16px">
      <label>افزودن ادمین (آی‌دی عددی تلگرام)</label>
      <div style="display:flex;gap:8px">
        <input id="newAdminId">
        <button class="btn-ghost" onclick="addBotAdmin()">افزودن</button>
      </div>
      <div id="adminList" style="margin-top:12px"></div>
    </div>
    <div class="card" style="padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <label style="margin:0">ارسال پیام همگانی</label>
        <select id="broadcastTarget" style="width:170px">
          <option value="all">همه‌ی اعضا</option>
          <option value="admins">فقط ادمین‌ها</option>
        </select>
      </div>
      <textarea id="broadcastText" rows="4" placeholder="متن پیام..." style="width:100%;resize:vertical;background:var(--panel2);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px 12px;font-family:'Inter',sans-serif;font-size:14px"></textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:10px">
        <button class="btn-primary" id="broadcastBtn" onclick="sendBroadcast()">ارسال</button>
      </div>
      <div id="broadcastStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-top:8px"></div>
    </div>
    <div class="card" style="padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <label style="margin:0" id="memberCount"></label>
        <button class="btn-ghost" onclick="loadBotMembers()">بروزرسانی</button>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>نام</th><th>یوزرنیم</th><th>آی‌دی</th><th>آخرین بازدید</th><th></th></tr></thead>
          <tbody id="memberRows"></tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="dmModal" class="modal-bg" style="display:none">
    <div class="card" style="width:100%;max-width:380px;padding:20px">
      <label>پیام به <span id="dmTargetLabel" class="mono"></span></label>
      <textarea id="dmText" rows="4" style="width:100%;resize:vertical;background:var(--panel2);border:1px solid var(--line);color:var(--ink);border-radius:9px;padding:10px 12px;font-family:'Inter',sans-serif;font-size:14px"></textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="btn-ghost" onclick="closeDmModal()">انصراف</button>
        <button class="btn-primary" onclick="sendDm()">ارسال</button>
      </div>
      <div id="dmStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-top:8px"></div>
    </div>
  </div>

  <div id="tab-backup" style="display:none">
    <div class="card" style="padding:20px;margin-bottom:16px">
      <div style="margin-bottom:10px;color:var(--ink-dim);font-size:13px">یک فایل JSON شامل همه‌ی کانفیگ‌ها، مصرف، تنظیمات ربات و لاگ‌ها دانلود می‌کند.</div>
      <button class="btn-primary" onclick="location.href='/api/backup'">دانلود بکاپ</button>
    </div>
    <div class="card" style="padding:20px">
      <div style="margin-bottom:10px"><label>فایل بکاپ</label><input type="file" id="restoreFile" accept="application/json"></div>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px">
        <label style="margin:0"><input type="radio" name="mode" value="replace" checked style="width:auto"> جایگزینی کامل</label>
        <label style="margin:0"><input type="radio" name="mode" value="merge" style="width:auto"> ادغام</label>
      </div>
      <button class="btn-primary" onclick="doRestore()">بازیابی</button>
      <div id="restoreStatus" class="mono" style="margin-top:12px;font-size:12px"></div>
    </div>
  </div>
</div>

<div id="configModalBg" class="modal-bg" style="display:none">
  <div class="card" style="padding:24px;width:100%;max-width:420px;max-height:90vh;overflow:auto">
    <h3 class="display" id="modalTitle" style="margin:0 0 16px">کانفیگ جدید</h3>
    <input type="hidden" id="cfgId">
    <div style="margin-bottom:12px"><label>نام</label><input id="cfgName"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div><label>محدودیت ترافیک (GB, 0=بی‌نهایت)</label><input id="cfgTraffic" type="number" value="0"></div>
      <div><label>انقضا (روز, 0=بدون انقضا)</label><input id="cfgExpires" type="number" value="0"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div><label>محدودیت IP هم‌زمان (0=بی‌نهایت)</label><input id="cfgIpLimit" type="number" value="0"></div>
      <div><label>پورت</label><input id="cfgPort" type="number" value="443"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div><label>Fingerprint</label>
        <select id="cfgFp">
          <option value="chrome">chrome</option><option value="firefox">firefox</option>
          <option value="safari">safari</option><option value="ios">ios</option>
          <option value="android">android</option><option value="edge">edge</option>
        </select>
      </div>
      <div><label>ALPN</label><input id="cfgAlpn" value="http/1.1"></div>
    </div>
    <div style="margin-bottom:12px">
      <label>پروکسی‌های خروجی (SOCKS5 یا HTTP — اختیاری، هر خط یکی)</label>
      <textarea id="cfgProxies" dir="ltr" rows="3" placeholder="socks5://user:pass@1.2.3.4:1080" style="background:var(--base);border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;resize:vertical"></textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:6px">
        <button type="button" class="btn-ghost" onclick="openProxyPicker()">انتخاب از لیست</button>
      </div>
      <div style="font-size:11px;color:var(--ink-dim);margin-top:4px">اگر پر شود، هر اتصال خروجی این کانفیگ به‌طور تصادفی از یکی از این پروکسی‌ها رد می‌شود (چرخشی)؛ خالی بگذارید برای اتصال مستقیم.</div>
    </div>
    <div style="margin-bottom:6px">
      <label>آی‌پی‌های تمیز (اختیاری)</label>
      <textarea id="cfgCleanIps" dir="ltr" rows="3" placeholder="104.16.1.1
clean.example.com" style="background:var(--base);border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;resize:vertical"></textarea>
      <div style="font-size:11px;color:var(--ink-dim);margin-top:4px">هر خط یک IP یا دامنه؛ برای هرکدام یک لینک جدا ساخته می‌شود (آدرس اتصال عوض می‌شود، host/SNI همان دامنه‌ی ورکر می‌ماند). خالی بگذارید تا از دامنه‌ی ورکر استفاده شود.</div>
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:6px">
        <button type="button" class="btn-ghost" onclick="testCleanIps()" id="testIpsBtn">تست آی‌پی‌ها</button>
        <button type="button" class="btn-ghost" onclick="openCleanIpPicker()">انتخاب آی‌پی تمیز از لیست</button>
      </div>
      <div id="cleanIpsTestResult" class="mono" style="font-size:11px;margin-top:6px;display:flex;flex-direction:column;gap:3px"></div>
      <div id="autoRotateSummary" class="mono" style="font-size:11px;color:var(--edge);margin-top:6px"></div>
      <input type="hidden" id="cfgIpOperator" value="all">
      <input type="hidden" id="cfgIpCount" value="20">
      <input type="hidden" id="cfgAutoRotate" value="0">
      <input type="hidden" id="cfgRotateMinutes" value="0">
    </div>
    <div style="margin-bottom:6px">
      <label>مسدودسازی (اختیاری — این کانفیگ نتواند به این آدرس‌ها وصل شود)</label>
      <textarea id="cfgBlocklist" dir="ltr" rows="3" placeholder="example.com
1.2.3.0/24
5.6.7.8" style="background:var(--base);border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:13px;width:100%;resize:vertical"></textarea>
      <div style="font-size:11px;color:var(--ink-dim);margin-top:4px">هر خط یک دامنه (زیردامنه‌هایش هم مسدود می‌شود)، یک آی‌پی، یا یک رنج CIDR. اتصال به این‌ها با همین کانفیگ رد می‌شود.</div>
    </div>
    <div style="margin-bottom:6px">
      <label>لوکیشن (برای برچسب‌زدن روی اسم لینک‌ها — اختیاری)</label>
      <select id="cfgLocation" style="width:100%"></select>
      <div style="font-size:11px;color:var(--ink-dim);margin-top:4px">این فقط اسم/پرچمِ نمایشی روی لینک‌هاست؛ با انتخاب از «انتخاب از لیست» به‌طور خودکار با کشورِ پروکسی‌های انتخاب‌شده هماهنگ می‌شود.</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn-primary" style="flex:1" onclick="saveConfig()">ذخیره</button>
      <button class="btn-ghost" style="flex:1" onclick="closeConfigModal()">انصراف</button>
    </div>
  </div>
</div>

<div id="mtpModalBg" class="modal-bg" style="display:none">
  <div class="card" style="padding:24px;width:100%;max-width:440px">
    <h3 class="display" id="mtpModalTitle" style="margin:0 0 18px">پروکسی تلگرام جدید</h3>
    <input type="hidden" id="mtpId">
    <div style="margin-bottom:12px"><label>نام</label><input id="mtpName" placeholder="مثلاً: تلگرام-آلمان"></div>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;cursor:pointer">
      <input type="checkbox" id="mtpOfficial" onchange="onMtpOfficialChange()" style="width:auto">
      این پروکسی روی سرویسِ رسمیِ جداست (برای نمایشِ کانال اسپانسر)
    </label>
    <div id="mtpOfficialNote" style="display:none;background:#1a2a3a;color:#8ac2ff;border:1px solid #2a4a6a;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;line-height:1.8">
      این حالت فقط برای ثبت/نمایشِ لینکه؛ خودِ اتصال رو سرویسِ جداگانه‌ی
      <code>mtproxy</code> (ایمیجِ رسمیِ تلگرام) اجرا می‌کنه — راهنمای کامل در
      <code>mtproxy/README.md</code> پروژه.
    </div>
    <div id="mtpPortRow" style="margin-bottom:12px"><label>پورت داخلی (که سرور روش گوش می‌ده)</label><input id="mtpPort" type="number" value="8443"></div>
    <div style="margin-bottom:12px"><label>secret (خالی بذار تا خودکار ساخته بشه)</label><input id="mtpSecret" class="mono" placeholder="dd..."></div>
    <div style="margin-bottom:12px"><label>آدرس عمومی (میزبانِ TCP Proxy روی Railway — اختیاری)</label><input id="mtpPublicHost" placeholder="مثلاً: xyz.proxy.rlwy.net"></div>
    <div style="margin-bottom:12px"><label>پورت عمومی (پورتی که Railway برای TCP Proxy داده — اختیاری)</label><input id="mtpPublicPort" type="number"></div>
    <div id="mtpTagRow" style="display:none;margin-bottom:12px"><label>تگ اسپانسر (از @MTProxybot)</label><input id="mtpTag" class="mono" placeholder="مثلاً: 3f40462915a3e6026a4d790127b95ded"></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn-primary" style="flex:1" onclick="saveMtp()">ذخیره</button>
      <button class="btn-ghost" style="flex:1" onclick="closeMtpModal()">انصراف</button>
    </div>
  </div>
</div>

<div id="linkModalBg" class="modal-bg" style="display:none">
  <div class="card" style="padding:24px;width:100%;max-width:460px">
    <h3 class="display" style="margin:0 0 6px">لینک اتصال</h3>
    <div id="linkCount" class="mono" style="font-size:11px;color:var(--ink-dim);margin-bottom:8px"></div>
    <textarea id="linkText" readonly style="width:100%;height:120px;background:var(--base);border:1px solid var(--line);border-radius:8px;color:var(--ink);padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px"></textarea>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn-primary" style="flex:1" onclick="copyLink()">کپی</button>
      <button class="btn-ghost" style="flex:1" onclick="document.getElementById('linkModalBg').style.display='none'">بستن</button>
    </div>
  </div>
</div>

<div id="proxyPickerBg" class="modal-bg" style="display:none">
  <div class="card" style="padding:24px;width:100%;max-width:420px;max-height:85vh;overflow:auto">
    <h3 class="display" style="margin:0 0 16px">انتخاب پروکسی از لیست</h3>
    <div style="margin-bottom:14px">
      <label>آدرس لیست پروکسی (یک فایل متنی، هر خط یک پروکسی — می‌تواند شامل {country} باشد)</label>
      <div style="display:flex;gap:8px">
        <input id="proxyListUrl" dir="ltr" placeholder="https://.../proxy_vip/{country}.txt" style="flex:1">
        <button type="button" class="btn-ghost" onclick="saveProxyListUrl()">ذخیره</button>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label>لوکیشن</label>
      <select id="proxyPickerCountry" onchange="fetchProxyList()" style="width:100%"></select>
    </div>
    <div style="display:flex;gap:8px;align-items:flex-end;justify-content:space-between;margin-bottom:10px">
      <button type="button" class="btn-primary" onclick="fetchProxyList()" id="fetchProxyListBtn">دریافت لیست</button>
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div>
          <label style="font-size:11px">تعداد</label>
          <input id="proxyPickCount" type="number" min="1" value="20" style="width:80px">
        </div>
        <button type="button" class="btn-ghost" onclick="pickRandomProxies()">انتخاب تصادفی و اضافه‌کردن</button>
      </div>
    </div>
    <div id="proxyListStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-bottom:8px"></div>
    <div id="proxyListRows" style="display:flex;flex-direction:column;gap:6px"></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn-ghost" style="flex:1" onclick="closeProxyPicker()">بستن</button>
    </div>
  </div>
</div>

<div id="cleanIpPickerBg" class="modal-bg" style="display:none">
  <div class="card" style="padding:24px;width:100%;max-width:420px;max-height:85vh;overflow:auto">
    <h3 class="display" style="margin:0 0 16px">انتخاب آی‌پی تمیز از لیست</h3>
    <div style="border-top:1px solid var(--line);padding-top:14px;margin-bottom:14px">
      <label>اسکن خودکار (بدون نیاز به لینک/سرور خارجی)</label>
      <div class="hint" style="font-size:11px;color:var(--ink-dim);margin-bottom:6px">
        این تکنیک فقط وقتی واقعاً جواب می‌ده که دامنه پشتِ Cloudflare (ابر نارنجی) باشه. اگه دامنه مستقیم روی Vercel بدون Cloudflare هست، حالت «Vercel» رو امتحان کن ولی احتمال پیدا کردن نتیجه خیلی کمتره (فقط ۲ آدرس شناخته‌شده تست می‌شه).
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <div>
          <label style="font-size:11px">منبع رنج IP</label>
          <select id="scanProviderSelect" style="width:170px">
            <option value="cloudflare">Cloudflare (وقتی دامنه پشتشه)</option>
            <option value="vercel">Vercel (آزمایشی، بدون Cloudflare)</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px">چند تا آی‌پی سالم پیدا کنه</label>
          <input id="scanWantInput" type="number" min="1" max="50" value="10" style="width:100px">
        </div>
        <button type="button" class="btn-primary" onclick="scanCleanIpsNow()" id="scanIpsBtn">اسکن و پیدا کردن</button>
      </div>
      <div id="scanIpsStatus" class="mono" style="font-size:11px;color:var(--ink-dim);margin-top:8px"></div>
      <div id="scanIpsResult" class="mono" style="font-size:11px;margin-top:6px;display:flex;flex-direction:column;gap:3px"></div>
    </div>
    <div style="margin-bottom:14px">
      <label>یا از یه لیست آماده (فرمت: بلوک‌های جداشده با ----------، هر بلوک با یک خط # نامِ‌گروه)</label>
      <div style="display:flex;gap:8px">
        <input id="cleanIpListUrl" dir="ltr" placeholder="https://.../ips.txt" style="flex:1">
        <button type="button" class="btn-ghost" onclick="saveCleanIpListUrl()">ذخیره</button>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <label>اپراتور / گروه</label>
      <select id="ipOperatorSelect" style="width:100%"><option value="all">همه (توصیه‌شده)</option></select>
    </div>
    <div style="display:flex;gap:8px;align-items:flex-end;justify-content:space-between;margin-bottom:14px">
      <button type="button" class="btn-primary" onclick="fetchCleanIpOperators()" id="fetchCleanIpsBtn">دریافت لیست</button>
      <div>
        <label style="font-size:11px">تعداد کانفیگ (تعداد آی‌پی)</label>
        <input id="ipCountInput" type="number" min="1" value="20" style="width:100px">
      </div>
    </div>
    <div style="border-top:1px solid var(--line);padding-top:14px;margin-bottom:14px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="autoRotateToggle" onchange="toggleAutoRotateInputs()" style="width:auto">
        چرخش خودکار آی‌پی‌ها (هر چند دقیقه یک‌بار، دور از دیدت، دوباره N آی‌پی تصادفی انتخاب و جایگزین می‌شه)
      </label>
      <div id="autoRotateMinutesWrap" style="margin-top:8px;display:none">
        <label style="font-size:11px">هر چند دقیقه چرخش کنه</label>
        <input id="autoRotateMinutes" type="number" min="1" value="60" style="width:120px">
      </div>
    </div>
    <div id="cleanIpListStatus" class="mono" style="font-size:12px;color:var(--ink-dim);margin-bottom:14px"></div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn-primary" style="flex:1" onclick="applySelectedCleanIps()">اعمال — همه‌ی کانفیگ‌ها به یک سابسکریپشن وصل می‌مونن</button>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px">
      <button class="btn-ghost" style="flex:1" onclick="closeCleanIpPicker()">بستن</button>
    </div>
  </div>
</div>

<script>
let CONFIGS = [];

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  ['configs','mtproto','logs','bot','backup'].forEach(name=>{
    document.getElementById('tab-'+name).style.display = (name===t.dataset.tab)?'':'none';
  });
  if(t.dataset.tab==='logs') loadLogs();
  if(t.dataset.tab==='bot'){ loadBotSettings(); loadBotMembers(); }
  if(t.dataset.tab==='mtproto') loadMtproto();
}));

function fmtBytes(n){
  if(!n) return '0 B';
  const units=['B','KB','MB','GB','TB']; let i=0; let v=n;
  while(v>=1024 && i<units.length-1){ v/=1024; i++; }
  return v.toFixed(v>=10||i===0?0:1)+' '+units[i];
}
function fmtDate(ts){ if(!ts) return '—'; return new Date(ts*1000).toLocaleString('fa-IR'); }

async function api(path, opts={}){
  const res = await fetch(path, {headers:{'Content-Type':'application/json'}, ...opts});
  if(res.status===401){ location.href='/'; throw new Error('unauthorized'); }
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.detail||'خطا');
  return data;
}

async function logout(){ await api('/api/logout', {method:'POST'}); location.href='/'; }

async function loadStats(){
  const s = await api('/api/stats');
  document.getElementById('stats').innerHTML = \`
    <div class="stat"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div><div class="num">\${s.config_count}</div><div class="lbl">کانفیگ</div></div>
    <div class="stat"><div class="stat-icon" style="color:var(--online);border-color:rgba(57,255,136,.35)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg></div><div class="num" style="color:var(--online)">\${s.online}</div><div class="lbl">آنلاین</div></div>
    <div class="stat"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg></div><div class="num">\${fmtBytes(s.total_used_bytes)}</div><div class="lbl">ترافیک کل</div></div>
    <div class="stat"><div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><circle cx="7" cy="7" r=".8" fill="currentColor"/><circle cx="7" cy="17" r=".8" fill="currentColor"/></svg></div><div class="num mono" style="font-size:14px">\${s.backend}</div><div class="lbl">بک‌اند</div></div>
  \`;
  renderRequestUsage(s);
}

function renderRequestUsage(s){
  const used = s.requests_today || 0;
  const limit = s.requests_limit || 100000;
  const pct = Math.min(100, (used/limit)*100);
  const bar = document.getElementById('reqUsageBar');
  bar.style.width = pct.toFixed(1)+'%';
  bar.style.background = pct >= 90 ? 'var(--danger)' : (pct >= 70 ? '#e0a53f' : 'var(--online)');
  document.getElementById('reqUsageText').textContent = used.toLocaleString('en-US')+' / '+limit.toLocaleString('en-US')+' ('+pct.toFixed(1)+'%)';
  const limitInput = document.getElementById('reqLimitInput');
  if(document.activeElement !== limitInput) limitInput.value = limit;
  const hist = s.requests_history || [];
  document.getElementById('reqUsageHistory').textContent = hist.map(h => h.day.slice(5)+': '+h.count.toLocaleString('en-US')).join('   |   ');
}

async function saveRequestLimit(){
  const val = parseInt(document.getElementById('reqLimitInput').value, 10);
  if(!val || val < 1) return;
  await api('/api/request-limit', {method:'POST', body: JSON.stringify({limit: val})});
  loadStats();
}

async function loadConfigs(){
  let data;
  try{
    data = await api('/api/configs');
  }catch(e){
    // مهم: اگه اینجا خطا بگیریم و بی‌سروصدا رد بشیم، جدول کانفیگ‌ها خالی
    // می‌مونه و دقیقاً شبیه «همه‌ی کانفیگ‌ها پاک شدن» به‌نظر می‌رسه، در
    // حالی که خودِ داده‌ها سرجاشونن و فقط این درخواست شکست خورده (مثلاً
    // به‌خاطر پر شدن سهمیه‌ی روزانه‌ی storage). به‌جاش یه خطای واضح نشون
    // می‌دیم و کاری به جدول فعلی نداریم.
    const banner = document.getElementById('configLoadError');
    if(banner){ banner.style.display='block'; banner.textContent = 'خطا در دریافت لیست کانفیگ‌ها (داده‌ها پاک نشدن؛ این فقط خطای بارگذاریه): ' + e.message; }
    return;
  }
  const banner = document.getElementById('configLoadError');
  if(banner) banner.style.display='none';
  CONFIGS = data.configs;
  const sel = document.getElementById('logFilter');
  sel.innerHTML = '<option value="">همه</option>' + CONFIGS.map(c=>\`<option value="\${c.id}">\${c.name}</option>\`).join('');
  document.getElementById('configRows').innerHTML = CONFIGS.map(c=>\`
    <tr>
      <td>\${c.name}</td>
      <td><span class="pill \${c.enabled?'on':'off'}">\${c.enabled?'فعال':'غیرفعال'}</span></td>
      <td>\${c.online}</td>
      <td>\${fmtBytes(c.used_bytes)}\${c.traffic_limit_bytes?' / '+fmtBytes(c.traffic_limit_bytes):''}</td>
      <td>\${fmtDate(c.expires_at)}</td>
      <td style="white-space:nowrap">
        <button class="btn-ghost" onclick="showLink('\${c.id}')">لینک</button>
        <button class="btn-ghost" onclick="showSub('\${c.id}')">سابسکریپشن</button>
        <button class="btn-ghost" onclick="editConfig('\${c.id}')">ویرایش</button>
        <button class="btn-ghost" onclick="toggleConfig('\${c.id}', \${!c.enabled})">\${c.enabled?'خاموش':'روشن'}</button>
        <button class="btn-ghost" onclick="resetUsage('\${c.id}')">ریست مصرف</button>
        <button class="btn-ghost" onclick="filterLogsFor('\${c.id}')">لاگ</button>
        <button class="btn-ghost danger" onclick="deleteConfig('\${c.id}')">حذف</button>
      </td>
    </tr>\`).join('');
}

function filterLogsFor(id){
  document.querySelector('.tab[data-tab=logs]').click();
  document.getElementById('logFilter').value = id;
  loadLogs();
}

async function loadLogs(){
  const cid = document.getElementById('logFilter').value;
  const data = await api('/api/logs'+(cid?('?config_id='+cid):''));
  document.getElementById('logRows').innerHTML = data.logs.map(l=>\`
    <tr><td class="mono">\${fmtDate(l.ts)}</td><td>\${l.config_name}</td><td class="mono">\${l.ip}</td>
    <td class="mono">\${l.address}:\${l.port}</td><td>\${fmtBytes(l.bytes)}</td></tr>\`).join('') || '<tr><td colspan="5" style="color:var(--ink-dim)">رکوردی نیست</td></tr>';
}

// لیست کوتاه‌شده‌ی کشورهای رایج برای انتخاب لوکیشن (کد ۲‌حرفی ISO)
const CHOP_COUNTRIES = [
  ["DE", "آلمان"], ["NL", "هلند"], ["FR", "فرانسه"],
  ["GB", "بریتانیا"], ["US", "آمریکا"], ["CA", "کانادا"], ["TR", "ترکیه"], ["AE", "امارات"],
  ["SG", "سنگاپور"], ["JP", "ژاپن"], ["FI", "فنلاند"], ["SE", "سوئد"], ["RU", "روسیه"],
  ["IN", "هند"], ["AU", "استرالیا"], ["BR", "برزیل"], ["ES", "اسپانیا"], ["IT", "ایتالیا"],
  ["PL", "لهستان"], ["CH", "سوئیس"],
];
function flagEmoji(cc){
  if(!cc) return '🌐';
  const up = String(cc).toUpperCase().replace(/[^A-Z]/g,'');
  if(up.length!==2) return '🌐';
  const pts = [...up].map(c=>127397+c.charCodeAt(0));
  return String.fromCodePoint.apply(null, pts);
}
// mode: 'location' → برای فیلد لوکیشنِ کانفیگ (اختیاری، بدون گزینه‌ی «همه»)
//       'fetch'    → برای دراپ‌داونِ انتخاب کشور در «انتخاب از لیست» (بدون‌برچسب بی‌معنیه، ولی «همه» لازمه)
function fillCountrySelect(el, mode){
  const special = mode === 'fetch' ? [["ALL", "🌐 همه"]] : [["", "بدون برچسب"]];
  const rows = special.concat(CHOP_COUNTRIES);
  el.innerHTML = rows.map(([code,name])=>{
    const label = code && code!=='ALL' ? (flagEmoji(code)+' '+name+' ('+code+')') : name;
    return '<option value="'+code+'">'+label+'</option>';
  }).join('');
}

function openConfigModal(){
  document.getElementById('modalTitle').textContent='کانفیگ جدید';
  document.getElementById('cfgId').value='';
  document.getElementById('cfgName').value='';
  document.getElementById('cfgTraffic').value=0;
  document.getElementById('cfgExpires').value=0;
  document.getElementById('cfgIpLimit').value=0;
  document.getElementById('cfgPort').value=443;
  document.getElementById('cfgFp').value='chrome';
  document.getElementById('cfgAlpn').value='http/1.1';
  document.getElementById('cfgProxies').value='';
  document.getElementById('cfgCleanIps').value='';
  document.getElementById('cfgBlocklist').value='';
  document.getElementById('cleanIpsTestResult').innerHTML='';
  document.getElementById('cfgIpOperator').value='all';
  document.getElementById('cfgIpCount').value='20';
  document.getElementById('cfgAutoRotate').value='0';
  document.getElementById('cfgRotateMinutes').value='0';
  updateAutoRotateSummary();
  fillCountrySelect(document.getElementById('cfgLocation'), 'location');
  document.getElementById('cfgLocation').value='';
  document.getElementById('configModalBg').style.display='flex';
}
function closeConfigModal(){ document.getElementById('configModalBg').style.display='none'; }

function editConfig(id){
  const c = CONFIGS.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('modalTitle').textContent='ویرایش کانفیگ';
  document.getElementById('cfgId').value=c.id;
  document.getElementById('cfgName').value=c.name;
  document.getElementById('cfgTraffic').value=(c.traffic_limit_bytes/1073741824)||0;
  document.getElementById('cfgExpires').value = c.expires_at ? Math.max(1, Math.ceil((c.expires_at - Date.now()/1000)/86400)) : 0;
  document.getElementById('cfgIpLimit').value=c.ip_limit||0;
  document.getElementById('cfgPort').value=c.port||443;
  document.getElementById('cfgFp').value=c.fingerprint||'chrome';
  document.getElementById('cfgAlpn').value=c.alpn||'http/1.1';
  document.getElementById('cfgProxies').value=(c.proxies||[]).join('\\n');
  document.getElementById('cfgCleanIps').value=(c.clean_ips||[]).join('\\n');
  document.getElementById('cfgBlocklist').value=(c.blocklist||[]).join('\\n');
  document.getElementById('cleanIpsTestResult').innerHTML='';
  document.getElementById('cfgIpOperator').value=c.ip_operator||'all';
  document.getElementById('cfgIpCount').value=c.ip_count||20;
  document.getElementById('cfgAutoRotate').value=c.auto_rotate_ip?'1':'0';
  document.getElementById('cfgRotateMinutes').value=c.rotate_minutes||0;
  updateAutoRotateSummary();
  fillCountrySelect(document.getElementById('cfgLocation'), 'location');
  document.getElementById('cfgLocation').value=c.location||'';
  document.getElementById('configModalBg').style.display='flex';
}

async function testCleanIps(){
  const raw = document.getElementById('cfgCleanIps').value;
  const ips = raw.split(/[\\n,]+/).map(s=>s.trim()).filter(Boolean);
  const box = document.getElementById('cleanIpsTestResult');
  if(!ips.length){ box.innerHTML = '<div style="color:var(--ink-dim)">چیزی برای تست وارد نشده</div>'; return; }
  const btn = document.getElementById('testIpsBtn');
  btn.disabled = true; btn.textContent = 'در حال تست...';
  box.innerHTML = ips.map(ip=>'<div id="testrow-'+cssEsc(ip)+'">⏳ '+ip+' — در حال بررسی…</div>').join('');
  await Promise.all(ips.map(async ip=>{
    const row = document.getElementById('testrow-'+cssEsc(ip));
    try{
      const data = await api('/api/test-clean-ip', {method:'POST', body: JSON.stringify({ip})});
      if(data.ok){ row.innerHTML = '✅ '+ip+' — سالم ('+data.ms+'ms)'; row.style.color='var(--online)'; }
      else { row.innerHTML = '❌ '+ip+' — '+(data.error || ('کد '+data.status)); row.style.color='var(--danger)'; }
    }catch(e){ row.innerHTML = '❌ '+ip+' — خطا'; row.style.color='var(--danger)'; }
  }));
  btn.disabled = false; btn.textContent = 'تست آی‌پی‌ها';
}
function cssEsc(s){ return s.replace(/[^a-zA-Z0-9_-]/g, m => '_'+m.charCodeAt(0)+'_'); }

function openProxyPicker(){
  document.getElementById('proxyPickerBg').style.display='flex';
  document.getElementById('proxyListRows').innerHTML='';
  document.getElementById('proxyListStatus').textContent='';
  fillCountrySelect(document.getElementById('proxyPickerCountry'), 'fetch');
  const cur = document.getElementById('cfgLocation').value;
  document.getElementById('proxyPickerCountry').value = cur && cur!=='' ? cur : 'ALL';
  loadProxyListUrl();
}
function closeProxyPicker(){ document.getElementById('proxyPickerBg').style.display='none'; }

async function loadProxyListUrl(){
  try{
    const data = await api('/api/proxy-list-url');
    document.getElementById('proxyListUrl').value = data.url || '';
  }catch(e){ /* ignore */ }
}
async function saveProxyListUrl(){
  const url = document.getElementById('proxyListUrl').value.trim();
  await api('/api/proxy-list-url', {method:'POST', body: JSON.stringify({url})});
  document.getElementById('proxyListStatus').textContent = 'ذخیره شد.';
}

async function fetchProxyList(){
  const btn = document.getElementById('fetchProxyListBtn');
  const status = document.getElementById('proxyListStatus');
  const rows = document.getElementById('proxyListRows');
  const country = document.getElementById('proxyPickerCountry').value || 'ALL';
  btn.disabled = true; btn.textContent = 'در حال دریافت...';
  rows.innerHTML = '';
  status.style.color = 'var(--ink-dim)';
  status.textContent = 'در حال دریافت لیست...';
  try{
    const data = await api('/api/proxy-list?country='+encodeURIComponent(country));
    const proxies = data.proxies || [];
    window.PROXY_LIST_CACHE = proxies;
    const flag = flagEmoji(country);
    if(!proxies.length){
      status.textContent = 'لیست خالی بود.';
    } else {
      status.textContent = proxies.length + ' پروکسی ' + flag + ' پیدا شد — یکی رو انتخاب کن یا از «انتخاب تصادفی» استفاده کن:';
      rows.innerHTML = proxies.map((p, i) => {
        const safe = escHtml(p);
        return '<button type="button" class="btn-ghost mono" style="text-align:left;justify-content:flex-start;direction:ltr;width:100%" onclick="selectProxyIdx('+i+')">'+flag+' '+safe+'</button>';
      }).join('');
    }
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در دریافت لیست';
  }
  btn.disabled = false; btn.textContent = 'دریافت لیست';
}
function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function syncLocationFromPicker(){
  const country = document.getElementById('proxyPickerCountry').value;
  if(country && country !== 'ALL'){
    document.getElementById('cfgLocation').value = country;
  }
}

function selectProxyIdx(i){
  const p = (window.PROXY_LIST_CACHE||[])[i];
  if(!p) return;
  appendProxies([p]);
  syncLocationFromPicker();
  closeProxyPicker();
}

function pickRandomProxies(){
  const all = window.PROXY_LIST_CACHE || [];
  if(!all.length){ document.getElementById('proxyListStatus').textContent = 'اول لیست رو دریافت کن.'; return; }
  const n = Math.max(1, parseInt(document.getElementById('proxyPickCount').value || '1', 10));
  const shuffled = all.slice().sort(()=>Math.random()-0.5);
  const picked = shuffled.slice(0, Math.min(n, shuffled.length));
  appendProxies(picked);
  syncLocationFromPicker();
  document.getElementById('proxyListStatus').textContent = picked.length + ' پروکسی به لیست کانفیگ اضافه شد و لینک‌ها با همین لوکیشن هماهنگ شدند.';
  closeProxyPicker();
}

function appendProxies(list){
  const ta = document.getElementById('cfgProxies');
  const existing = ta.value.split(/[\\n,]+/).map(s=>s.trim()).filter(Boolean);
  const merged = existing.concat(list.filter(p => existing.indexOf(p) === -1));
  ta.value = merged.join('\\n');
}

// ---- انتخاب آی‌پی تمیز از لیست + چرخش خودکار (دقیقاً مثل ip-selector-modal سورس نمونه) ----
function updateAutoRotateSummary(){
  const el = document.getElementById('autoRotateSummary');
  const on = document.getElementById('cfgAutoRotate').value==='1';
  const mins = document.getElementById('cfgRotateMinutes').value;
  el.textContent = on ? ('چرخش خودکار فعاله — هر '+mins+' دقیقه یک‌بار.') : '';
}

function openCleanIpPicker(){
  document.getElementById('cleanIpPickerBg').style.display='flex';
  document.getElementById('cleanIpListStatus').textContent='';
  document.getElementById('ipOperatorSelect').innerHTML='<option value="all">همه (توصیه‌شده)</option>';
  document.getElementById('ipCountInput').value = document.getElementById('cfgIpCount').value || 20;
  const isAuto = document.getElementById('cfgAutoRotate').value==='1';
  document.getElementById('autoRotateToggle').checked = isAuto;
  document.getElementById('autoRotateMinutes').value = document.getElementById('cfgRotateMinutes').value || 60;
  toggleAutoRotateInputs();
  loadCleanIpListUrl();
}
function closeCleanIpPicker(){ document.getElementById('cleanIpPickerBg').style.display='none'; }

function toggleAutoRotateInputs(){
  const on = document.getElementById('autoRotateToggle').checked;
  document.getElementById('autoRotateMinutesWrap').style.display = on ? '' : 'none';
}

async function scanCleanIpsNow(){
  const btn = document.getElementById('scanIpsBtn');
  const status = document.getElementById('scanIpsStatus');
  const box = document.getElementById('scanIpsResult');
  let want = parseInt(document.getElementById('scanWantInput').value, 10);
  if(isNaN(want) || want < 1) want = 10;
  const provider = document.getElementById('scanProviderSelect').value === 'vercel' ? 'vercel' : 'cloudflare';
  btn.disabled = true; btn.textContent = 'در حال اسکن... (چند ثانیه طول می‌کشه)';
  status.style.color = 'var(--ink-dim)';
  status.textContent = provider === 'vercel'
    ? 'در حال تست آی‌پی‌های Vercel و اندازه‌گیری تأخیر (پینگ) هرکدوم...'
    : 'در حال تست آی‌پی‌های تصادفی از رنج‌های Cloudflare...';
  box.innerHTML = '';
  window.SCANNED_CLEAN_IPS = [];
  try{
    const data = await api('/api/scan-clean-ips', {method:'POST', body: JSON.stringify({want, provider})});
    const found = data.found || [];
    window.SCANNED_CLEAN_IPS = found.map(r=>r.ip);
    status.style.color = found.length ? 'var(--success, #2e7d32)' : 'var(--danger)';
    status.textContent = found.length
      ? (found.length + ' آی‌پی سالم از ' + data.tested + ' تست پیدا شد.')
      : (provider === 'cloudflare'
          ? ('هیچ‌کدوم از ' + data.tested + ' آی‌پی جواب ندادن — یعنی این دامنه پشتِ Cloudflare نیست (یا هنوز ابر نارنجی فعال نشده). این تکنیک بدون Cloudflare جلوی این دیپلوی کار نمی‌کنه.')
          : ('هیچ‌کدوم از ' + data.tested + ' آی‌پی Vercel جواب ندادن. این حالت آزمایشیه و ممکنه اصلاً روی این دامنه کار نکنه؛ اگه دامنه رو ببری پشتِ Cloudflare، حالت «Cloudflare» رو امتحان کن.'));
    box.innerHTML = found.map(r => '<div style="display:flex;justify-content:space-between"><span>'+escHtml(r.ip)+'</span><span style="color:var(--success,#2e7d32)">'+r.ms+'ms</span></div>').join('');
    if(!found.length && data.failReasons && Object.keys(data.failReasons).length){
      const reasons = Object.entries(data.failReasons).map(([k,v]) => escHtml(k)+': '+v).join(' — ');
      const reasonEl = document.createElement('div');
      reasonEl.style.color = 'var(--ink-dim)';
      reasonEl.style.marginTop = '4px';
      reasonEl.textContent = 'علت رد شدن‌ها: ' + reasons;
      box.appendChild(reasonEl);
    }
    if(found.length){
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'btn-ghost';
      applyBtn.style.marginTop = '8px';
      applyBtn.textContent = 'استفاده از این آی‌پی‌ها';
      applyBtn.onclick = applyScannedCleanIps;
      box.appendChild(applyBtn);
    }
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در اسکن';
  }
  btn.disabled = false; btn.textContent = 'اسکن و پیدا کردن';
}
function applyScannedCleanIps(){
  const ips = window.SCANNED_CLEAN_IPS || [];
  if(!ips.length) return;
  document.getElementById('cfgCleanIps').value = ips.join('\\n');
  document.getElementById('cfgIpCount').value = ips.length;
  closeCleanIpPicker();
}

async function loadCleanIpListUrl(){
  try{
    const data = await api('/api/clean-ip-list-url');
    document.getElementById('cleanIpListUrl').value = data.url || '';
  }catch(e){ /* ignore */ }
}
async function saveCleanIpListUrl(){
  const url = document.getElementById('cleanIpListUrl').value.trim();
  await api('/api/clean-ip-list-url', {method:'POST', body: JSON.stringify({url})});
  document.getElementById('cleanIpListStatus').textContent = 'ذخیره شد.';
}

async function fetchCleanIpOperators(){
  const btn = document.getElementById('fetchCleanIpsBtn');
  const status = document.getElementById('cleanIpListStatus');
  const sel = document.getElementById('ipOperatorSelect');
  const prevValue = sel.value;
  btn.disabled = true; btn.textContent = 'در حال دریافت...';
  status.style.color = 'var(--ink-dim)';
  status.textContent = 'در حال دریافت لیست...';
  try{
    const data = await api('/api/clean-ip-list');
    const operators = data.operators || {};
    window.CLEAN_IP_OPERATORS = operators;
    const keys = Object.keys(operators);
    sel.innerHTML = '<option value="all">همه (توصیه‌شده)</option>' + keys.map(k=>'<option value="'+escHtml(k)+'">'+escHtml(k)+'</option>').join('');
    sel.value = keys.indexOf(prevValue) !== -1 || prevValue==='all' ? prevValue : 'all';
    const total = keys.reduce((s,k)=>s+operators[k].length,0);
    status.textContent = keys.length + ' گروه، ' + total + ' آی‌پی پیدا شد.';
  }catch(e){
    status.style.color = 'var(--danger)';
    status.textContent = e.message || 'خطا در دریافت لیست';
  }
  btn.disabled = false; btn.textContent = 'دریافت لیست';
}

function applySelectedCleanIps(){
  const operators = window.CLEAN_IP_OPERATORS || {};
  const operator = document.getElementById('ipOperatorSelect').value;
  let count = parseInt(document.getElementById('ipCountInput').value, 10);
  if(isNaN(count) || count < 1) count = 10;
  let pool = [];
  if(operator === 'all'){
    Object.values(operators).forEach(ips => { pool = pool.concat(ips); });
  } else {
    pool = operators[operator] || [];
  }
  pool = [...new Set(pool)];
  if(!pool.length){
    document.getElementById('cleanIpListStatus').textContent = 'اول لیست رو دریافت کن (یا گروه دیگه‌ای انتخاب کن).';
    return;
  }
  let selected;
  if(count >= pool.length){ selected = pool; }
  else {
    const shuffled = pool.slice();
    for(let i=shuffled.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
    selected = shuffled.slice(0, count);
  }
  // دقیقاً مثل سورس نمونه: این N آی‌پی جایگزین لیست فعلی می‌شن — همه‌شون
  // زیرِ همین یک کانفیگ (یک UUID) و یک لینک سابسکریپشن باقی می‌مونن.
  document.getElementById('cfgCleanIps').value = selected.join('\\n');
  document.getElementById('cfgIpOperator').value = operator;
  document.getElementById('cfgIpCount').value = count;
  const isAuto = document.getElementById('autoRotateToggle').checked;
  document.getElementById('cfgAutoRotate').value = isAuto ? '1' : '0';
  document.getElementById('cfgRotateMinutes').value = document.getElementById('autoRotateMinutes').value || 0;
  updateAutoRotateSummary();
  closeCleanIpPicker();
}

async function saveConfig(){
  const id = document.getElementById('cfgId').value;
  const body = {
    name: document.getElementById('cfgName').value,
    traffic_limit_gb: parseFloat(document.getElementById('cfgTraffic').value||0),
    expires_days: parseInt(document.getElementById('cfgExpires').value||0),
    ip_limit: parseInt(document.getElementById('cfgIpLimit').value||0),
    port: parseInt(document.getElementById('cfgPort').value||443),
    fingerprint: document.getElementById('cfgFp').value,
    alpn: document.getElementById('cfgAlpn').value,
    proxies: document.getElementById('cfgProxies').value,
    clean_ips: document.getElementById('cfgCleanIps').value,
    location: document.getElementById('cfgLocation').value,
    ip_operator: document.getElementById('cfgIpOperator').value,
    ip_count: parseInt(document.getElementById('cfgIpCount').value||20),
    auto_rotate_ip: document.getElementById('cfgAutoRotate').value==='1',
    rotate_minutes: parseInt(document.getElementById('cfgRotateMinutes').value||0),
    blocklist: document.getElementById('cfgBlocklist').value,
  };
  if(id){
    await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify(body)});
  } else {
    await api('/api/configs', {method:'POST', body: JSON.stringify(body)});
  }
  closeConfigModal();
  await Promise.all([loadConfigs(), loadStats()]);
}

async function toggleConfig(id, enabled){
  await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({enabled})});
  loadConfigs();
}
async function resetUsage(id){
  await api('/api/configs/'+id, {method:'PATCH', body: JSON.stringify({reset_usage:true})});
  loadConfigs(); loadStats();
}
async function deleteConfig(id){
  if(!confirm('این کانفیگ حذف شود؟')) return;
  await api('/api/configs/'+id, {method:'DELETE'});
  loadConfigs(); loadStats();
}
function showLink(id){
  const c = CONFIGS.find(x=>x.id===id);
  const links = (c.links && c.links.length ? c.links : [c.link]);
  document.getElementById('linkText').value = links.join('\\n\\n');
  document.getElementById('linkCount').textContent = links.length>1 ? (links.length+' لینک (به ازای هر آی‌پی تمیز، یک لینک)') : '';
  document.getElementById('linkModalBg').style.display='flex';
}
function showSub(id){
  const c = CONFIGS.find(x=>x.id===id);
  document.getElementById('linkText').value = c.sub_url;
  const n = (c.clean_ips && c.clean_ips.length) ? c.clean_ips.length : 1;
  document.getElementById('linkCount').textContent = 'لینک سابسکریپشن — شامل '+n+' کانفیگ. این لینک رو توی برنامه‌ی کلاینت به‌عنوان Subscription وارد کن.';
  document.getElementById('linkModalBg').style.display='flex';
}
function copyLink(){
  const t = document.getElementById('linkText');
  t.select(); document.execCommand('copy');
}

let MTPROTO = [];
async function loadMtproto(){
  const data = await api('/api/mtproto');
  MTPROTO = data.proxies;
  document.getElementById('mtpRows').innerHTML = MTPROTO.map(p=>\`
    <tr>
      <td>\${p.name}\${p.official?' <span class="pill" style="background:#2a1a3a;color:#c9a6ff">اسپانسر</span>':''}</td>
      <td class="mono">\${p.official?'—':p.port}</td>
      <td class="mono">\${p.public_host ? (p.public_host+':'+(p.public_port||p.port)) : '—'}</td>
      <td><span class="pill \${p.enabled?'on':'off'}">\${p.enabled?'فعال':'غیرفعال'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn-ghost" onclick="showMtpLink('\${p.id}')">لینک</button>
        <button class="btn-ghost" onclick="editMtp('\${p.id}')">ویرایش</button>
        <button class="btn-ghost" onclick="toggleMtp('\${p.id}', \${!p.enabled})">\${p.enabled?'خاموش':'روشن'}</button>
        <button class="btn-ghost danger" onclick="deleteMtp('\${p.id}')">حذف</button>
      </td>
    </tr>\`).join('') || '<tr><td colspan="5" style="color:var(--ink-dim)">هنوز پروکسی‌ای اضافه نشده</td></tr>';
}

function onMtpOfficialChange(){
  const official = document.getElementById('mtpOfficial').checked;
  document.getElementById('mtpOfficialNote').style.display = official ? '' : 'none';
  document.getElementById('mtpPortRow').style.display = official ? 'none' : '';
  document.getElementById('mtpTagRow').style.display = official ? '' : 'none';
}

function openMtpModal(){
  document.getElementById('mtpModalTitle').textContent = 'پروکسی تلگرام جدید';
  document.getElementById('mtpId').value = '';
  document.getElementById('mtpName').value = '';
  document.getElementById('mtpOfficial').checked = false;
  document.getElementById('mtpPort').value = 8443;
  document.getElementById('mtpSecret').value = '';
  document.getElementById('mtpPublicHost').value = '';
  document.getElementById('mtpPublicPort').value = '';
  document.getElementById('mtpTag').value = '';
  onMtpOfficialChange();
  document.getElementById('mtpModalBg').style.display = 'flex';
}
function closeMtpModal(){ document.getElementById('mtpModalBg').style.display = 'none'; }
function editMtp(id){
  const p = MTPROTO.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('mtpModalTitle').textContent = 'ویرایش پروکسی تلگرام';
  document.getElementById('mtpId').value = p.id;
  document.getElementById('mtpName').value = p.name;
  document.getElementById('mtpOfficial').checked = !!p.official;
  document.getElementById('mtpPort').value = p.port;
  document.getElementById('mtpSecret').value = p.secret;
  document.getElementById('mtpPublicHost').value = p.public_host || '';
  document.getElementById('mtpPublicPort').value = p.public_port || '';
  document.getElementById('mtpTag').value = p.tag || '';
  onMtpOfficialChange();
  document.getElementById('mtpModalBg').style.display = 'flex';
}
async function saveMtp(){
  const id = document.getElementById('mtpId').value;
  const official = document.getElementById('mtpOfficial').checked;
  const body = {
    name: document.getElementById('mtpName').value,
    official,
    tag: document.getElementById('mtpTag').value,
    port: official ? (parseInt(document.getElementById('mtpPublicPort').value||0,10) || 443) : parseInt(document.getElementById('mtpPort').value||0,10),
    secret: document.getElementById('mtpSecret').value,
    public_host: document.getElementById('mtpPublicHost').value,
    public_port: parseInt(document.getElementById('mtpPublicPort').value||0,10),
  };
  if(id){
    await api('/api/mtproto/'+id, {method:'PATCH', body: JSON.stringify(body)});
  } else {
    await api('/api/mtproto', {method:'POST', body: JSON.stringify(body)});
  }
  closeMtpModal();
  loadMtproto();
}
async function toggleMtp(id, enabled){
  await api('/api/mtproto/'+id, {method:'PATCH', body: JSON.stringify({enabled})});
  loadMtproto();
}
async function deleteMtp(id){
  if(!confirm('این پروکسی حذف شود؟')) return;
  await api('/api/mtproto/'+id, {method:'DELETE'});
  loadMtproto();
}
function showMtpLink(id){
  const p = MTPROTO.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('linkText').value = p.tg_link + '\\n\\n' + p.tme_link;
  document.getElementById('linkCount').textContent = p.public_host ? '' : 'هنوز «آدرس عمومی» تنظیم نشده — این لینک فعلاً از هاستِ پنل ساخته شده که ممکنه برای این پورت درست نباشه.';
  document.getElementById('linkModalBg').style.display='flex';
}

async function loadBotSettings(){
  const s = await api('/api/bot/settings');
  document.getElementById('botEnabled').checked = s.enabled;
  document.getElementById('botToken').placeholder = s.token_masked || '123456:ABC-...';
  document.getElementById('botStatus').textContent = s.webhook_url ? ('Webhook: '+s.webhook_url) : '';
  document.getElementById('adminList').innerHTML = s.admins.map(a=>\`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">
      <span class="mono">\${a.id}</span>
      <button class="btn-ghost danger" onclick="removeBotAdmin('\${a.id}')">حذف</button>
    </div>\`).join('') || '<div style="color:var(--ink-dim)">ادمینی ثبت نشده</div>';
}
async function saveBotSettings(){
  const token = document.getElementById('botToken').value.trim();
  const enabled = document.getElementById('botEnabled').checked;
  await api('/api/bot/settings', {method:'POST', body: JSON.stringify({token, enabled})});
  loadBotSettings();
}
async function addBotAdmin(){
  const id = document.getElementById('newAdminId').value.trim();
  if(!id) return;
  await api('/api/bot/admins', {method:'POST', body: JSON.stringify({id})});
  document.getElementById('newAdminId').value='';
  loadBotSettings();
}
async function removeBotAdmin(id){
  await api('/api/bot/admins/'+id, {method:'DELETE'});
  loadBotSettings();
}

function timeAgoFa(ts){
  if(!ts) return '—';
  const diff = Date.now()/1000 - ts;
  if(diff < 60) return 'همین الان';
  if(diff < 3600) return Math.floor(diff/60)+' دقیقه پیش';
  if(diff < 86400) return Math.floor(diff/3600)+' ساعت پیش';
  return Math.floor(diff/86400)+' روز پیش';
}
async function loadBotMembers(){
  const data = await api('/api/bot/members');
  const members = data.members || [];
  document.getElementById('memberCount').textContent = 'اعضای ثبت‌شده: '+members.length;
  document.getElementById('memberRows').innerHTML = members.map(m=>\`
    <tr>
      <td>\${escHtml(m.first_name||'—')}</td>
      <td class="mono">\${m.username ? '@'+escHtml(m.username) : '—'}</td>
      <td class="mono">\${escHtml(m.id)}</td>
      <td class="mono" style="color:var(--ink-dim)">\${timeAgoFa(m.last_seen)}</td>
      <td><button class="btn-ghost" onclick="openDmModal('\${m.id}','\${escHtml(m.first_name||m.id)}')">پیام</button></td>
    </tr>\`).join('') || '<tr><td colspan="5" style="color:var(--ink-dim);text-align:center;padding:16px">هنوز عضوی نداری</td></tr>';
}
async function sendBroadcast(){
  const text = document.getElementById('broadcastText').value.trim();
  const target = document.getElementById('broadcastTarget').value;
  const status = document.getElementById('broadcastStatus');
  const btn = document.getElementById('broadcastBtn');
  if(!text){ status.style.color='var(--danger)'; status.textContent='متن پیام رو بنویس'; return; }
  if(!confirm('ارسال به «'+(target==='all'?'همه‌ی اعضا':'فقط ادمین‌ها')+'» — مطمئنی؟')) return;
  btn.disabled = true; btn.textContent = 'در حال ارسال...';
  status.style.color = 'var(--ink-dim)'; status.textContent = 'در حال ارسال، ممکنه چند لحظه طول بکشه...';
  try{
    const data = await api('/api/bot/broadcast', {method:'POST', body: JSON.stringify({text, target})});
    status.style.color = 'var(--online)';
    status.textContent = data.sent+' نفر دریافت کردن، '+data.failed+' ناموفق'+(data.removed?(' ('+data.removed+' نفر بلاک کرده بودن و از لیست حذف شدن)'):'')+'.';
    document.getElementById('broadcastText').value='';
    if(data.removed) loadBotMembers();
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; }
  finally{ btn.disabled=false; btn.textContent='ارسال'; }
}
let dmTargetId = null;
function openDmModal(id, label){
  dmTargetId = id;
  document.getElementById('dmTargetLabel').textContent = label;
  document.getElementById('dmText').value = '';
  document.getElementById('dmStatus').textContent = '';
  document.getElementById('dmModal').style.display = 'flex';
}
function closeDmModal(){ document.getElementById('dmModal').style.display = 'none'; dmTargetId = null; }
async function sendDm(){
  const text = document.getElementById('dmText').value.trim();
  const status = document.getElementById('dmStatus');
  if(!text || !dmTargetId) return;
  status.style.color = 'var(--ink-dim)'; status.textContent = 'در حال ارسال...';
  try{
    const data = await api('/api/bot/broadcast', {method:'POST', body: JSON.stringify({text, target:[dmTargetId]})});
    if(data.sent > 0){ closeDmModal(); }
    else { status.style.color='var(--danger)'; status.textContent = 'ارسال نشد — احتمالاً کاربر ربات رو بلاک کرده.'; loadBotMembers(); }
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; }
}

async function doRestore(){
  const file = document.getElementById('restoreFile').files[0];
  const status = document.getElementById('restoreStatus');
  if(!file){ status.textContent='یک فایل انتخاب کنید'; return; }
  const mode = document.querySelector('input[name=mode]:checked').value;
  try{
    const text = await file.text();
    const backup = JSON.parse(text);
    const data = await api('/api/backup/restore', {method:'POST', body: JSON.stringify({backup, mode})});
    status.style.color='var(--online)';
    status.textContent = 'انجام شد: '+data.counters.configs+' کانفیگ، '+data.counters.admins+' ادمین، '+data.counters.members+' عضو';
    loadConfigs(); loadStats();
  }catch(e){ status.style.color='var(--danger)'; status.textContent = e.message; }
}

loadStats(); loadConfigs(); loadMtproto();
// فقط وقتی تب واقعاً باز و دیده می‌شه رفرش خودکار کن — وگرنه با هر تبِ
// فراموش‌شده‌ی باز، بی‌دلیل سهمِ ماهانه‌ی Redis مصرف می‌شه.
setInterval(()=>{ if(!document.hidden){ loadStats(); loadConfigs(); } }, 60000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ loadStats(); loadConfigs(); } });
</script>
</body>
</html>`;
}
