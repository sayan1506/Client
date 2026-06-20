/* ============================================================
   Alok Kumar Chanchal — Portfolio
   Three.js hero · GSAP/ScrollTrigger · Lenis · interactions
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

/* ----------------------------------------------------------
   1. Core UI (no external deps) — always runs
   ---------------------------------------------------------- */
function initCoreUI() {
  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Nav scroll state
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  // Contact form -> mailto
  const form = document.getElementById("contactForm");
  if (form) {
    const note = document.getElementById("formNote");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cName").value.trim();
      const email = document.getElementById("cEmail").value.trim();
      const msg = document.getElementById("cMsg").value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !msg || !validEmail) {
        note.textContent = "Please add your name, a valid email, and a message.";
        note.className = "form__note err";
        return;
      }
      const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`);
      window.location.href = `mailto:chanchalalokkumar07@gmail.com?subject=${subject}&body=${body}`;
      note.textContent = "Opening your email app…";
      note.className = "form__note ok";
      form.reset();
    });
  }
}

/* ----------------------------------------------------------
   2. Custom cursor + magnetic buttons (desktop only)
   ---------------------------------------------------------- */
function initCursor() {
  if (isTouch) return;
  const ring = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  if (!ring || !dot) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor]");
    ring.classList.remove("is-hover", "is-view");
    if (t) ring.classList.add(t.dataset.cursor === "view" ? "is-view" : "is-hover");
  });

  // Magnetic
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const yy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.3}px, ${yy * 0.4}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ----------------------------------------------------------
   3. GSAP + Lenis (graceful fallback if libs missing)
   ---------------------------------------------------------- */
function revealAllFallback() {
  document.querySelectorAll(".reveal").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  document.querySelectorAll(".hero__title .line span").forEach((s) => {
    s.style.transform = "none";
  });
}

function initMotion() {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) { revealAllFallback(); return null; }

  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooth scroll synced to ScrollTrigger
  let lenis = null;
  if (Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor smooth-scroll
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  // Scroll reveals (exclude hero — handled by intro)
  const reveals = gsap.utils.toArray(".reveal").filter((el) => !el.closest(".hero"));
  reveals.forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // Animated counters
  gsap.utils.toArray(".stat__num[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: 1.6, ease: "power2.out",
        onUpdate: () => { el.textContent = Math.round(obj.v); },
      }),
    });
  });

  // Skill bars
  gsap.utils.toArray(".bar").forEach((bar) => {
    const fill = bar.querySelector(".bar__fill");
    ScrollTrigger.create({
      trigger: bar, start: "top 88%", once: true,
      onEnter: () => { fill.style.width = bar.dataset.level + "%"; },
    });
  });

  // Section title subtle parallax index numbers
  gsap.utils.toArray(".section__index").forEach((el) => {
    gsap.fromTo(el, { y: 20 }, {
      y: -20, ease: "none",
      scrollTrigger: { trigger: el.closest(".section"), scrub: true, start: "top bottom", end: "bottom top" },
    });
  });

  return { gsap, lenis };
}

/* ----------------------------------------------------------
   4. Hero intro timeline
   ---------------------------------------------------------- */
function playIntro() {
  const { gsap } = window;
  if (!gsap) return;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(".hero__title .line span", { y: 0, duration: 1.2, stagger: 0.12 })
    .to(".hero .reveal", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, "-=0.8");
}

/* ----------------------------------------------------------
   5. Preloader — Circular Text ring + Count Up
   ---------------------------------------------------------- */
function runPreloader(done) {
  const pre = document.getElementById("preloader");
  const ring = document.getElementById("preloaderRing");
  const pct = document.getElementById("preloaderPct");

  // CircularText: lay each character around the ring
  const text = "ALOK KUMAR CHANCHAL • MOTION • VISUALS • ";
  const chars = [...text];
  const step = 360 / chars.length;
  ring.textContent = "";
  chars.forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? " " : ch;
    s.style.transform = `rotate(${i * step}deg)`;
    ring.appendChild(s);
  });

  // CountUp: 0 -> 100 with easeOutCubic
  const duration = 2200;
  const startT = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const tick = (now) => {
    const t = Math.min(1, (now - startT) / duration);
    pct.textContent = Math.round(ease(t) * 100);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(() => { pre.classList.add("is-done"); done(); }, 350);
    }
  };
  requestAnimationFrame(tick);
}

/* ----------------------------------------------------------
   6. Three.js particle hero (dynamic import, isolated)
   ---------------------------------------------------------- */
async function initHero() {
  if (prefersReduced) return;
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.warn("Three.js unavailable, hero falls back to gradient glow.", err);
    return;
  }

  const hero = document.getElementById("hero");
  let w = hero.clientWidth, h = hero.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
  camera.position.z = 18;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particle field
  const count = window.innerWidth < 768 ? 2600 : 5200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cTeal = new THREE.Color(0xdfe3ea);
  const cAmber = new THREE.Color(0x9aa0ad);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const radius = 6 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i3 + 2] = radius * Math.cos(phi);
    const mix = Math.random();
    const c = cTeal.clone().lerp(cAmber, mix * mix);
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.085, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Mouse parallax
  let tx = 0, ty = 0, cxp = 0, cyp = 0;
  window.addEventListener("mousemove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5);
    ty = (e.clientY / window.innerHeight - 0.5);
  });

  const clock = new THREE.Clock();
  let raf;
  const animate = () => {
    const t = clock.getElapsedTime();
    points.rotation.y = t * 0.05;
    points.rotation.x = Math.sin(t * 0.15) * 0.12;
    cxp += (tx - cxp) * 0.04;
    cyp += (ty - cyp) * 0.04;
    camera.position.x = cxp * 6;
    camera.position.y = -cyp * 4;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };
  animate();

  // Resize
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      w = hero.clientWidth; h = hero.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }, 150);
  });

  // Pause when hero out of view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !raf) animate();
      else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0 });
  io.observe(hero);
}

/* ----------------------------------------------------------
   6b. GhostCursor smoke + footer name color-reveal
   ---------------------------------------------------------- */
async function initGhost() {
  if (prefersReduced || isTouch) return;
  const host = document.getElementById("footerGhost");
  if (!host) return;
  try {
    const { createGhostCursor } = await import("./ghost-cursor.js");
    createGhostCursor(host, {
      color: "#B497CF",
      brightness: 1.15,
      trailLength: 50,
      inertia: 0.5,
      grainIntensity: 0.05,
      bloomStrength: 0.45,
      bloomRadius: 1.0,
      bloomThreshold: 0.02,
      mixBlendMode: "screen",
      edgeIntensity: 0,
    });
  } catch (err) {
    console.warn("GhostCursor unavailable.", err);
  }
}

/* ----------------------------------------------------------
   6c. Skills carousel (React Bits style) — coverflow + drag + glow
   ---------------------------------------------------------- */
function initSkillsCarousel() {
  const root = document.getElementById("skillsCarousel");
  if (!root) return;
  const viewport = root.querySelector(".carousel__viewport");
  const track = root.querySelector(".carousel__track");
  const slides = [...root.querySelectorAll(".carousel__slide")];
  const prev = document.getElementById("skillsPrev");
  const next = document.getElementById("skillsNext");
  const dotsWrap = document.getElementById("skillsDots");
  if (!slides.length || !track) return;

  let index = 0;
  let autoTimer = null;
  const AUTO_MS = 4500;

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "carousel__dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.dataset.cursor = "hover";
    b.addEventListener("click", () => { go(i); resetAuto(); });
    dotsWrap.appendChild(b);
  });
  const dots = [...dotsWrap.children];

  const baseTranslate = (i) => {
    const s = slides[i];
    const leftInTrack = s.offsetLeft - track.offsetLeft;
    return viewport.clientWidth / 2 - (leftInTrack + s.offsetWidth / 2);
  };

  function render() {
    track.style.transform = `translateX(${baseTranslate(index)}px)`;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  function go(i) { index = (i + slides.length) % slides.length; render(); }

  prev.addEventListener("click", () => { go(index - 1); resetAuto(); });
  next.addEventListener("click", () => { go(index + 1); resetAuto(); });

  function startAuto() { if (!prefersReduced && !autoTimer) autoTimer = setInterval(() => go(index + 1), AUTO_MS); }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function resetAuto() { stopAuto(); startAuto(); }
  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  // drag / swipe
  let dragging = false, startX = 0, base = 0;
  viewport.addEventListener("pointerdown", (e) => {
    dragging = true; startX = e.clientX; base = baseTranslate(index);
    root.classList.add("is-grabbing"); stopAuto();
    viewport.setPointerCapture?.(e.pointerId);
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    track.style.transform = `translateX(${base + (e.clientX - startX)}px)`;
  });
  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false; root.classList.remove("is-grabbing");
    const dx = e.clientX - startX;
    const threshold = Math.min(120, slides[index].offsetWidth * 0.2);
    if (dx <= -threshold) go(index + 1);
    else if (dx >= threshold) go(index - 1);
    else render();
    resetAuto();
  });
  root.classList.add("is-grab");

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 150); });

  render();
  startAuto();
}

/* ----------------------------------------------------------
   Boot
   ---------------------------------------------------------- */
function boot() {
  initCoreUI();
  initCursor();
  initMotion();
  initHero();
  initGhost();
  initSkillsCarousel();
  runPreloader(() => {
    document.body.classList.remove("is-locked");
    playIntro();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
}

// Modules are deferred, so DOM is parsed. Wait for window load to ensure
// the deferred GSAP/Lenis CDN scripts have executed.
if (document.readyState === "complete") boot();
else window.addEventListener("load", boot, { once: true });
