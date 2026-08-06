/* ============================================================
   Caleb Adriel Tingson — Portfolio
   Boot sequence → Three.js constellation hero → scroll reveals
   Vanilla JS, no build step. Three.js loaded via CDN in index.html.
============================================================ */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Boot sequence ---------------- */
  function runBoot() {
    var bootEl = document.getElementById('boot');
    var textEl = document.getElementById('boot-text');
    var barFill = document.getElementById('boot-bar-fill');
    var lines = [
      'booting caleb.dev ...',
      'loading modules: react, three.js, tailwind ...',
      'connecting: github.com/cerebuu ...',
      'status: ready'
    ];

    if (prefersReducedMotion) {
      bootEl.classList.add('hidden');
      return;
    }

    var lineIndex = 0;
    var charIndex = 0;
    var full = '';

    function typeNext() {
      if (lineIndex >= lines.length) {
        barFill.style.width = '100%';
        setTimeout(function () {
          bootEl.classList.add('hidden');
        }, 500);
        return;
      }
      var current = lines[lineIndex];
      if (charIndex <= current.length) {
        textEl.textContent = full + current.slice(0, charIndex);
        charIndex++;
        setTimeout(typeNext, 18);
      } else {
        full += current + '\n';
        lineIndex++;
        charIndex = 0;
        barFill.style.width = ((lineIndex / lines.length) * 100) + '%';
        setTimeout(typeNext, 160);
      }
    }
    setTimeout(typeNext, 300);

    // Safety fallback — never trap the user behind the boot screen
    setTimeout(function () { bootEl.classList.add('hidden'); }, 5000);
  }

  /* ---------------- Custom cursor ---------------- */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    var cursor = document.getElementById('cursor');
    var dot = document.getElementById('cursor-dot');
    var mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });

    function loop() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    loop();

    var hoverTargets = document.querySelectorAll('a, button, .project, .focus-item, .activity-card');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hovering'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hovering'); });
    });
  }

  /* ---------------- Scroll reveals ---------------- */
  function initReveals() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------- Three.js constellation hero ---------------- */
  function initHero() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var heroSection = document.getElementById('hero');
    var width = heroSection.clientWidth;
    var height = heroSection.clientHeight;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 34;

    // Node network — 5 "primary" nodes echo the 5 featured projects,
    // surrounded by a field of ambient particles for depth.
    var accentColor = new THREE.Color(0x5b8cff);
    var dimColor = new THREE.Color(0x2a2d35);

    var primaryCount = 5;
    var ambientCount = 90;
    var total = primaryCount + ambientCount;

    var positions = new Float32Array(total * 3);
    var sizes = new Float32Array(total);
    var colors = new Float32Array(total * 3);

    var nodePositions = [];

    for (var i = 0; i < total; i++) {
      var isPrimary = i < primaryCount;
      var radius = isPrimary ? 14 + Math.random() * 6 : 6 + Math.random() * 24;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos((Math.random() * 2) - 1);

      var x = radius * Math.sin(phi) * Math.cos(theta);
      var y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      var z = radius * Math.cos(phi) * 0.5 - 6;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      sizes[i] = isPrimary ? 2.4 : 0.9 + Math.random() * 0.6;

      var c = isPrimary ? accentColor : dimColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      if (isPrimary) nodePositions.push(new THREE.Vector3(x, y, z));
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var material = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false
    });

    var points = new THREE.Points(geometry, material);

    // Connective lines between the primary "project" nodes
    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0x5b8cff,
      transparent: true,
      opacity: 0.18
    });
    var linePositions = [];
    for (var a = 0; a < nodePositions.length; a++) {
      for (var b = a + 1; b < nodePositions.length; b++) {
        linePositions.push(nodePositions[a].x, nodePositions[a].y, nodePositions[a].z);
        linePositions.push(nodePositions[b].x, nodePositions[b].y, nodePositions[b].z);
      }
    }
    var lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lines = new THREE.LineSegments(lineGeom, lineMaterial);

    var group = new THREE.Group();
    group.add(points);
    group.add(lines);
    scene.add(group);

    var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        group.rotation.y = t * 0.05;
        targetRotX += (mouseY * 0.3 - targetRotX) * 0.03;
        targetRotY += (mouseX * 0.3 - targetRotY) * 0.03;
        group.rotation.x = targetRotX;
        group.rotation.z = targetRotY * 0.2;
      }

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
      var w = heroSection.clientWidth;
      var h = heroSection.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ---------------- Init ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    runBoot();
    initCursor();
    initReveals();
    initHero();
  });
})();
