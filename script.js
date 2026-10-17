/* =========================================================
   Convite da Maya — interatividade
   ========================================================= */

/* ✏️ CONFIGURAÇÕES — altere aqui */
// Data e hora da festa (formato: AAAA-MM-DDTHH:MM:SS, horário de Brasília)
const EVENT_DATE = new Date("2026-10-22T19:30:00-03:00");
// Link do App da Web do Google Apps Script que grava as confirmações na planilha
// (veja apps-script.gs). Termina em /exec.
const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzt6o82hnWySy7cN3La6nXym5VPOneQVTC7d9U3_1zr7F9meUntdxbEWTxnLn3cQ6uENQ/exec";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ---------------------------------------------------------
   1. Animações de entrada ao rolar
   --------------------------------------------------------- */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  items.forEach((el, i) => {
    // Pequeno atraso em cascata para elementos do hero
    if (el.closest(".hero")) el.style.transitionDelay = `${i * 0.12}s`;
    observer.observe(el);
  });
})();

/* ---------------------------------------------------------
   2. Botão "Abrir Convite" — rolagem suave
   --------------------------------------------------------- */
document.getElementById("openInvite").addEventListener("click", (e) => {
  e.preventDefault();
  document
    .getElementById("detalhes")
    .scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  burstConfetti(e.clientX, e.clientY);
});

/* ---------------------------------------------------------
   3. Vídeo de capa — garante autoplay e controla o som
   --------------------------------------------------------- */
(function initVideo() {
  const video = document.getElementById("heroVideo");
  const soundBtn = document.getElementById("videoSound");

  video.play().catch(() => {
    // Alguns navegadores bloqueiam autoplay; tenta de novo no primeiro toque
    document.addEventListener("pointerdown", () => video.play(), {
      once: true,
    });
  });

  soundBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted) {
      video.volume = 0.6;
      video.play();
      music.pause(); // evita duas trilhas ao mesmo tempo
    }
    soundBtn.setAttribute("aria-pressed", String(!video.muted));
    soundBtn.setAttribute(
      "aria-label",
      video.muted ? "Ativar som do vídeo" : "Silenciar vídeo",
    );
  });
})();

/* ---------------------------------------------------------
   4. Trilha sonora (botão flor)
   Usa o arquivo de <audio id="bgMusic">. Se ele não existir,
   toca uma caixinha de música gerada via Web Audio API.
   --------------------------------------------------------- */
const music = (function initMusic() {
  const buttons = document.querySelectorAll("[data-music-toggle]");
  const floatBtn = document.getElementById("musicFloat");
  const audio = document.getElementById("bgMusic");
  let useSynth = false;
  let playing = false;

  audio.addEventListener(
    "error",
    () => {
      useSynth = true;
    },
    { once: true },
  );

  /* --- Caixinha de música sintetizada --- */
  let ctx,
    master,
    timer,
    step = 0;
  // Melodia suave em Dó maior (notas MIDI, null = pausa)
  const melody = [
    72,
    76,
    79,
    84,
    83,
    79,
    76,
    null,
    74,
    77,
    81,
    86,
    84,
    81,
    77,
    null,
    72,
    76,
    79,
    81,
    79,
    76,
    74,
    72,
    71,
    74,
    79,
    77,
    76,
    74,
    72,
    null,
  ];
  const bass = [48, 53, 45, 43]; // C, F, A, G — um por compasso
  const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function bell(freq, time, gain, duration) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc2.type = "triangle";
    osc.frequency.value = freq;
    osc2.frequency.value = freq * 2;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(g);
    osc2.connect(g);
    g.connect(master);
    osc.start(time);
    osc2.start(time);
    osc.stop(time + duration);
    osc2.stop(time + duration);
  }

  function synthStart() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);
    }
    ctx.resume();
    const beat = 0.42;
    timer = setInterval(() => {
      const t = ctx.currentTime + 0.05;
      const note = melody[step % melody.length];
      if (note) bell(midiToHz(note), t, 0.35, 1.6);
      if (step % 8 === 0)
        bell(midiToHz(bass[(step / 8) % bass.length]), t, 0.25, 3.2);
      step++;
    }, beat * 1000);
  }

  function synthStop() {
    clearInterval(timer);
  }

  async function play() {
    if (!useSynth) {
      try {
        audio.volume = 0.5;
        await audio.play();
      } catch {
        useSynth = true;
      }
    }
    if (useSynth) synthStart();
    playing = true;
    render();
  }

  function pause() {
    if (!playing) return;
    audio.pause();
    synthStop();
    playing = false;
    render();
  }

  function render() {
    buttons.forEach((btn) => {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-pressed", String(playing));
      btn.setAttribute(
        "aria-label",
        playing ? "Pausar música" : "Tocar música",
      );
    });
    floatBtn.querySelector(".flower-btn__icon").textContent = playing
      ? "❚❚"
      : "♫";
  }

  // Quando a moldura do vídeo sai da tela, aparece a flor flutuante no canto
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      floatBtn.classList.toggle("is-visible", !entry.isIntersecting);
    }).observe(document.getElementById("videoFrame"));
  }

  function toggle() {
    if (playing) return pause();
    // Silencia o vídeo para não misturar sons
    const video = document.getElementById("heroVideo");
    const soundBtn = document.getElementById("videoSound");
    if (!video.muted) {
      video.muted = true;
      soundBtn.setAttribute("aria-pressed", "false");
      soundBtn.setAttribute("aria-label", "Ativar som do vídeo");
    }
    play();
  }

  buttons.forEach((btn) => btn.addEventListener("click", toggle));

  return { play, pause };
})();

/* ---------------------------------------------------------
   5. Contador regressivo
   --------------------------------------------------------- */
(function initCountdown() {
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  };
  const done = document.getElementById("countdownDone");
  const pad = (n) => String(n).padStart(2, "0");
  let intervalId;

  function set(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove("tick");
    void el.offsetWidth; // reinicia a animação
    el.classList.add("tick");
  }

  function update() {
    const diff = EVENT_DATE - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach((el) => (el.textContent = "00"));
      done.hidden = false;
      clearInterval(intervalId);
      return;
    }
    const s = Math.floor(diff / 1000);
    set(els.days, pad(Math.floor(s / 86400)));
    set(els.hours, pad(Math.floor((s % 86400) / 3600)));
    set(els.minutes, pad(Math.floor((s % 3600) / 60)));
    set(els.seconds, pad(s % 60));
  }

  update();
  intervalId = setInterval(update, 1000);
})();

/* ---------------------------------------------------------
   6. RSVP
   --------------------------------------------------------- */
(function initRsvp() {
  const form = document.getElementById("rsvpForm");
  const nameInput = document.getElementById("guestName");
  const countInput = document.getElementById("guestCount");
  const error = document.getElementById("rsvpError");
  const thanks = document.getElementById("rsvpThanks");
  const thanksEmoji = document.getElementById("thanksEmoji");
  const thanksText = document.getElementById("thanksText");

  // Stepper +/-
  form.querySelectorAll(".stepper__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next =
        (parseInt(countInput.value, 10) || 0) + Number(btn.dataset.step);
      countInput.value = Math.min(10, Math.max(0, next));
    });
  });

  const nameBox = nameInput.closest(".field__input");

  nameInput.addEventListener("input", () => {
    nameBox.classList.remove("is-invalid");
    error.hidden = true;
  });

  function showError(text) {
    error.textContent = text;
    error.hidden = false;
  }

  // Envia para a planilha. "no-cors" evita bloqueio do navegador; a resposta
  // não é legível, então só um erro de rede conta como falha.
  function saveToSheet(data) {
    return fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    });
  }

  /* --- Balãozinho de recado para a Maya --- */
  const noteDialog = document.getElementById("noteDialog");
  const noteText = document.getElementById("noteText");
  const noteCount = document.getElementById("noteCount");
  const noteHint = document.getElementById("noteHint");
  let pending = null; // confirmação esperando o recado

  noteText.addEventListener("input", () => {
    noteCount.textContent = noteText.value.length;
  });
  document.getElementById("noteClose").addEventListener("click", () => {
    noteDialog.close(""); // volta para o formulário sem enviar
  });
  // Toque fora do balão também volta sem enviar
  noteDialog.addEventListener("click", (e) => {
    if (e.target === noteDialog) noteDialog.close("");
  });
  noteDialog.addEventListener("close", () => {
    const choice = noteDialog.returnValue;
    const data = pending;
    pending = null;
    if (!data || (choice !== "send" && choice !== "skip")) return;
    const message = choice === "send" ? noteText.value.trim() : "";
    submitRsvp({ ...data, message });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const answer = e.submitter?.dataset.answer || "yes";
    const name = nameInput.value.trim();
    const guests = Math.min(
      10,
      Math.max(0, parseInt(countInput.value, 10) || 0),
    );

    if (!name) {
      nameBox.classList.remove("is-invalid");
      void nameBox.offsetWidth;
      nameBox.classList.add("is-invalid");
      showError("Ops! Escreve seu nome pra gente 🌷");
      nameInput.focus();
      return;
    }

    error.hidden = true;
    pending = { name, guests, going: answer === "yes" };

    // Navegadores muito antigos sem <dialog>: envia direto, sem recado
    if (typeof noteDialog.showModal !== "function") {
      const data = pending;
      pending = null;
      submitRsvp({ ...data, message: "" });
      return;
    }

    noteHint.textContent = pending.going
      ? "Ela vai amar ler! (opcional)"
      : "Mesmo sem poder ir, um carinho faz o dia dela mais feliz! (opcional)";
    noteDialog.returnValue = "";
    noteDialog.showModal();
    noteText.focus();
  });

  async function submitRsvp({ name, guests, going, message }) {
    const buttons = form.querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));

    try {
      await saveToSheet({
        name,
        guests: going ? guests : 0,
        attending: going,
        message,
      });
    } catch {
      showError(
        "Não conseguimos enviar 😥 Confere a internet e tenta de novo.",
      );
      buttons.forEach((b) => (b.disabled = false));
      return;
    }

    form.hidden = true;
    thanks.hidden = false;
    thanksEmoji.innerHTML = going
      ? "🎉"
      : '<img class="thanks-icon" src="img/icone-envelope.webp" alt="" width="185" height="128" />';
    thanksText.textContent =
      (going
        ? `Ebaaa, ${name}! Mal podemos esperar pra pedalar com você${guests ? " e sua turma" : ""}! 🚲💗`
        : `Que pena, ${name}! Vamos sentir sua falta. Obrigado por avisar 💗`) +
      (message ? " Seu recadinho chegou pra Maya 💌" : "");

    if (going) {
      const rect = thanks.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top + 40);
      doggo.cheer();
    }
  }
})();

/* ---------------------------------------------------------
   7. Lamparina — toque para acender/apagar
   --------------------------------------------------------- */
(function initLantern() {
  const lantern = document.getElementById("lantern");

  lantern.addEventListener("click", (e) => {
    const lit = lantern.classList.toggle("is-lit");
    lantern.setAttribute("aria-pressed", String(lit));
    lantern.setAttribute(
      "aria-label",
      lit ? "Apagar a lamparina" : "Acender a lamparina",
    );
    // Balança forte e volta ao balanço normal
    lantern.classList.remove("is-swinging");
    void lantern.offsetWidth;
    lantern.classList.add("is-swinging");
    if (lit) burstConfetti(e.clientX, e.clientY);
  });
  lantern.addEventListener("animationend", (e) => {
    if (e.animationName === "swingHard")
      lantern.classList.remove("is-swinging");
  });
})();

/* ---------------------------------------------------------
   8. Cachorrinho — toque para ele pular e latir de alegria
   --------------------------------------------------------- */
const doggo = (function initDoggo() {
  const dog = document.getElementById("doggo");
  let timer;

  function hearts() {
    for (let i = 0; i < 5; i++) {
      const h = document.createElement("span");
      h.className = "heart-pop";
      h.textContent = "♥";
      h.style.left = `${30 + Math.random() * 40}%`;
      h.style.top = "20%";
      h.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
      h.style.animationDelay = `${i * 0.12}s`;
      dog.appendChild(h);
      h.addEventListener("animationend", () => h.remove());
    }
  }

  function cheer() {
    dog.classList.remove("is-happy");
    void dog.offsetWidth;
    dog.classList.add("is-happy");
    hearts();
    clearTimeout(timer);
    timer = setTimeout(() => dog.classList.remove("is-happy"), 1600);
  }

  dog.addEventListener("click", cheer);
  return { cheer };
})();

/* ---------------------------------------------------------
   9. Partículas: pétalas, borboletas ilustradas e docinhos (Canvas)
      As borboletas fogem do dedo / mouse.
   --------------------------------------------------------- */
const burstConfetti = (function initParticles() {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  const COLORS = [
    "#ffb3c9",
    "#ff9ebb",
    "#ffd3e0",
    "#ef6f7f",
    "#8fd8e8",
    "#ffe08a",
    "#b5e3a8",
  ];
  const CANDY_COLORS = [
    ["#ff9ebb", "#ffd3e0"],
    ["#ef6f7f", "#ffc2c9"],
    ["#8fd8e8", "#d4f2f8"],
    ["#ffe08a", "#fff3c4"],
    ["#b5e3a8", "#e2f5dc"],
  ];
  // Borboletas recortadas de assets/borboletas.png
  const SPRITES = ["rosa", "azul", "lilas"].map((name) => {
    const img = new Image();
    img.src = `img/borboleta-${name}.webp`;
    return img;
  });
  const pointer = { x: -999, y: -999 };
  let W, H, dpr;
  let particles = [];
  let bursts = [];

  const setPointer = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  };
  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerdown", setPointer, { passive: true });
  document.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -999;
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function makeParticle(initial) {
    const r = Math.random();
    const type = r < 0.6 ? "petal" : r < 0.8 ? "butterfly" : "candy";
    return {
      type,
      x: rand(0, W),
      y: initial ? rand(0, H) : rand(-60, -20),
      size:
        type === "petal"
          ? rand(6, 12)
          : type === "butterfly"
            ? rand(26, 40)
            : rand(7, 11),
      sprite: pick(SPRITES),
      fx: 0,
      fy: 0,
      vx: rand(-0.3, 0.6),
      vy: type === "butterfly" ? rand(0.2, 0.5) : rand(0.4, 1.1),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.02, 0.02),
      sway: rand(0.005, 0.02),
      phase: rand(0, Math.PI * 2),
      color: pick(COLORS),
      candy: pick(CANDY_COLORS),
      alpha: type === "butterfly" ? 1 : rand(0.5, 0.85),
    };
  }

  function drawPetal(p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(
      p.size * 0.9,
      -p.size * 0.6,
      p.size * 0.6,
      p.size * 0.7,
      0,
      p.size,
    );
    ctx.bezierCurveTo(
      -p.size * 0.6,
      p.size * 0.7,
      -p.size * 0.9,
      -p.size * 0.6,
      0,
      -p.size,
    );
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(
      -p.size * 0.15,
      -p.size * 0.3,
      p.size * 0.15,
      p.size * 0.4,
      0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  function drawButterfly(p, t) {
    // Bate as asas mais rápido quando está fugindo
    const speed = 0.008 + Math.min(0.02, Math.hypot(p.fx, p.fy) * 0.004);
    const flap = Math.abs(Math.sin(t * speed + p.phase)) * 0.75 + 0.25;
    const s = p.size;
    if (p.sprite.complete && p.sprite.naturalWidth) {
      const h = s * (p.sprite.naturalHeight / p.sprite.naturalWidth);
      ctx.scale(flap, 1);
      ctx.drawImage(p.sprite, -s / 2, -h / 2, s, h);
      return;
    }
    // Reserva desenhada enquanto a imagem carrega
    ctx.fillStyle = p.color;
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.scale(side * flap, 1);
      ctx.beginPath();
      ctx.ellipse(s * 0.5, -s * 0.3, s * 0.55, s * 0.4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(s * 0.4, s * 0.3, s * 0.35, s * 0.28, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = "#8d6a7a";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.08, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCandy(p) {
    const s = p.size;
    const [c1, c2] = p.candy;
    // Pontas do papel da bala
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, 0);
    ctx.lineTo(-s * 1.7, -s * 0.6);
    ctx.lineTo(-s * 1.7, s * 0.6);
    ctx.closePath();
    ctx.moveTo(s * 0.9, 0);
    ctx.lineTo(s * 1.7, -s * 0.6);
    ctx.lineTo(s * 1.7, s * 0.6);
    ctx.closePath();
    ctx.fill();
    // Corpo da bala
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, -s * 0.25, s * 0.35, s * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function burst(x, y) {
    if (prefersReducedMotion) return;
    for (let i = 0; i < 36; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(3, 8);
      bursts.push({
        ...makeParticle(true),
        type: Math.random() < 0.7 ? "petal" : "candy",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
      });
    }
  }

  function draw(p, t) {
    ctx.save();
    ctx.globalAlpha = p.alpha * (p.life ?? 1);
    ctx.translate(p.x, p.y);
    ctx.rotate(
      p.type === "butterfly" ? Math.sin(t * 0.002 + p.phase) * 0.4 : p.rot,
    );
    if (p.type === "petal") drawPetal(p);
    else if (p.type === "butterfly") drawButterfly(p, t);
    else drawCandy(p);
    ctx.restore();
  }

  function loop(t) {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      p.phase += p.sway;
      if (p.type === "butterfly") {
        // Foge do ponteiro quando ele chega perto
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 0) {
          const force = (140 - dist) / 140;
          p.fx += (dx / dist) * force * 1.6;
          p.fy += (dy / dist) * force * 1.6;
        }
        p.fx *= 0.93;
        p.fy *= 0.93;
      }
      p.x +=
        p.vx + p.fx + Math.sin(p.phase) * (p.type === "butterfly" ? 1.2 : 0.6);
      p.y +=
        p.vy +
        p.fy +
        (p.type === "butterfly" ? Math.cos(p.phase * 1.3) * 0.6 : 0);
      p.rot += p.vr;
      if (p.y > H + 60 || p.y < -120 || p.x < -80 || p.x > W + 80)
        particles[i] = makeParticle(false);
      draw(p, t);
    });

    bursts = bursts.filter((p) => p.life > 0);
    bursts.forEach((p) => {
      p.vy += 0.18;
      p.vx *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += 0.1;
      p.life -= 0.012;
      draw(p, t);
    });

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);

  const count = prefersReducedMotion ? 0 : W < 600 ? 22 : 40;
  particles = Array.from({ length: count }, () => makeParticle(true));
  requestAnimationFrame(loop);

  return burst;
})();
