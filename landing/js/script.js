/* Aprendiendo LSA — interacciones de la landing */
(function () {
  "use strict";

  var menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===== Entrada del hero ===== */
  window.addEventListener("load", function () {
    document.body.classList.add("cargado");
  });
  // Respaldo por si 'load' tarda (imágenes lentas): no dejar el hero invisible.
  setTimeout(function () {
    document.body.classList.add("cargado");
  }, 1200);

  /* ===== Cabecera sólida + barra de progreso ===== */
  var cabecera = document.getElementById("cabecera");
  var barra = document.getElementById("barra-progreso");

  function alScrollear() {
    var y = window.scrollY || 0;
    cabecera.classList.toggle("solida", y > 8);
    var total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = (total > 0 ? Math.min(100, (y / total) * 100) : 0) + "%";
  }
  window.addEventListener("scroll", alScrollear, { passive: true });
  alScrollear();

  /* ===== Revelado al scrollear ===== */
  var revelables = document.querySelectorAll(".revelar");
  if ("IntersectionObserver" in window) {
    var obsRevelar = new IntersectionObserver(
      function (entradas) {
        var i = 0;
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.style.transitionDelay = i * 80 + "ms";
          e.target.classList.add("visto");
          obsRevelar.unobserve(e.target);
          i++;
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revelables.forEach(function (el) { obsRevelar.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add("visto"); });
  }

  /* ===== Contadores ===== */
  var contadores = document.querySelectorAll("[data-contador]");

  function animarContador(el) {
    var fin = parseInt(el.getAttribute("data-contador"), 10);
    if (menosMovimiento || !("requestAnimationFrame" in window)) {
      el.textContent = fin;
      return;
    }
    var inicio = null;
    var duracion = 950;
    function paso(t) {
      if (!inicio) inicio = t;
      var p = Math.min(1, (t - inicio) / duracion);
      var suavizado = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(fin * suavizado);
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  if ("IntersectionObserver" in window) {
    var obsContador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          animarContador(e.target);
          obsContador.unobserve(e.target);
        });
      },
      { threshold: 0.6 }
    );
    contadores.forEach(function (el) { obsContador.observe(el); });
  } else {
    contadores.forEach(function (el) {
      el.textContent = el.getAttribute("data-contador");
    });
  }

  /* ===== Camino de niveles: se completan al scrollear ===== */
  var nodos = document.querySelectorAll(".nodo");
  if ("IntersectionObserver" in window) {
    var obsNodo = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("hecho");
          obsNodo.unobserve(e.target);
        });
      },
      { rootMargin: "-30% 0px -30% 0px" }
    );
    nodos.forEach(function (n) { obsNodo.observe(n); });
  } else {
    nodos.forEach(function (n) { n.classList.add("hecho"); });
  }

  /* ===== Carrusel ===== */
  var carrusel = document.querySelector(".carrusel");
  var pista = document.getElementById("carrusel-pista");
  var diapositivas = pista ? Array.prototype.slice.call(pista.children) : [];
  var puntosCont = document.getElementById("carrusel-puntos");
  var actual = 0;

  function irA(indice, instantaneo) {
    indice = Math.max(0, Math.min(diapositivas.length - 1, indice));
    var d = diapositivas[indice];
    var destino = d.offsetLeft - (pista.clientWidth - d.clientWidth) / 2;
    pista.scrollTo({ left: destino, behavior: instantaneo || menosMovimiento ? "auto" : "smooth" });
  }

  function indiceActual() {
    var centro = pista.scrollLeft + pista.clientWidth / 2;
    var mejor = 0;
    var mejorDist = Infinity;
    diapositivas.forEach(function (d, i) {
      var c = d.offsetLeft + d.clientWidth / 2;
      var dist = Math.abs(c - centro);
      if (dist < mejorDist) { mejorDist = dist; mejor = i; }
    });
    return mejor;
  }

  if (pista && diapositivas.length) {
    // puntos
    diapositivas.forEach(function (d, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Ir a la captura " + (i + 1) + " de " + diapositivas.length);
      b.addEventListener("click", function () { irA(i); });
      puntosCont.appendChild(b);
    });
    var puntos = Array.prototype.slice.call(puntosCont.children);

    function pintarPuntos() {
      var i = indiceActual();
      if (i === actual && puntos[i].classList.contains("activo")) return;
      actual = i;
      puntos.forEach(function (p, j) { p.classList.toggle("activo", j === i); });
    }
    pintarPuntos();

    var marcoPedido = false;
    pista.addEventListener("scroll", function () {
      if (marcoPedido) return;
      marcoPedido = true;
      requestAnimationFrame(function () { pintarPuntos(); marcoPedido = false; });
    }, { passive: true });

    document.getElementById("flecha-prev").addEventListener("click", function () { irA(indiceActual() - 1); });
    document.getElementById("flecha-next").addEventListener("click", function () { irA(indiceActual() + 1); });

    carrusel.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") { ev.preventDefault(); irA(indiceActual() - 1); }
      if (ev.key === "ArrowRight") { ev.preventDefault(); irA(indiceActual() + 1); }
    });

    // arrastre con mouse (el táctil ya scrollea solo)
    var arrastrando = false;
    var inicioX = 0;
    var inicioScroll = 0;
    var seMovio = false;

    pista.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType !== "mouse") return;
      arrastrando = true;
      seMovio = false;
      inicioX = ev.clientX;
      inicioScroll = pista.scrollLeft;
      pista.classList.add("arrastrando");
      pista.setPointerCapture(ev.pointerId);
    });
    pista.addEventListener("pointermove", function (ev) {
      if (!arrastrando) return;
      var delta = ev.clientX - inicioX;
      if (Math.abs(delta) > 4) seMovio = true;
      pista.scrollLeft = inicioScroll - delta;
    });
    function soltar(ev) {
      if (!arrastrando) return;
      arrastrando = false;
      pista.classList.remove("arrastrando");
      if (seMovio) irA(indiceActual());
    }
    pista.addEventListener("pointerup", soltar);
    pista.addEventListener("pointercancel", soltar);
    // evitar que un arrastre dispare un click en las imágenes
    pista.addEventListener("click", function (ev) {
      if (seMovio) { ev.preventDefault(); seMovio = false; }
    }, true);
  }

  /* ===== Tiendas pendientes: aviso "muy pronto" ===== */
  var aviso = document.getElementById("aviso");
  var temporizador = null;

  document.querySelectorAll("a[data-pendiente]").forEach(function (enlace) {
    enlace.addEventListener("click", function (ev) {
      ev.preventDefault();
      aviso.hidden = false;
      // forzar reflujo para que la transición corra también en clicks seguidos
      void aviso.offsetWidth;
      aviso.classList.add("visible");
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        aviso.classList.remove("visible");
        temporizador = setTimeout(function () { aviso.hidden = true; }, 350);
      }, 2600);
    });
  });
})();
