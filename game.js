(() => {
  'use strict';

  const ALPHA = 0.05;
  const POINTS = 100;
  const shipments = [
    { name: 'Tazas de cerámica', category: 'CERÁMICA', code: 'C-1842', icon: '☕', sample: '30 piezas · revisión de fracturas', p: 0.18, compliant: true },
    { name: 'Tornillos de acero', category: 'HERRAJES', code: 'H-0927', icon: '🔩', sample: '50 piezas · variación de longitud', p: 0.008, compliant: false },
    { name: 'Vasos de vidrio', category: 'CRISTALERÍA', code: 'V-3106', icon: '🥛', sample: '36 piezas · resistencia del borde', p: 0.03, compliant: true },
    { name: 'Cable de cobre', category: 'ELÉCTRICO', code: 'E-7714', icon: '🧵', sample: '40 rollos · prueba de aislamiento', p: 0.14, compliant: false },
    { name: 'Frascos herméticos', category: 'ENVASES', code: 'F-0520', icon: '🫙', sample: '30 piezas · prueba de sellado', p: 0.05, compliant: false },
    { name: 'Focos LED', category: 'ILUMINACIÓN', code: 'L-4481', icon: '💡', sample: '32 unidades · duración de encendido', p: 0.08, compliant: true },
    { name: 'Latas de conserva', category: 'ALIMENTOS', code: 'A-6113', icon: '🥫', sample: '45 piezas · revisión de deformación', p: 0.002, compliant: false },
    { name: 'Bolsas de harina', category: 'ABARROTES', code: 'B-2035', icon: '🛍️', sample: '30 bolsas · control de peso neto', p: 0.60, compliant: true }
  ];

  const screens = {
    intro: document.getElementById('intro-screen'),
    game: document.getElementById('game-screen'),
    results: document.getElementById('results-screen')
  };
  const elements = {
    start: document.getElementById('start-button'),
    next: document.getElementById('next-button'),
    replay: document.getElementById('replay-button'),
    score: document.getElementById('score-value'),
    round: document.getElementById('round-number'),
    progressText: document.getElementById('progress-text'),
    progressBar: document.querySelector('.progress-track'),
    progressFill: document.getElementById('progress-fill'),
    code: document.getElementById('batch-code'),
    art: document.getElementById('product-art'),
    category: document.getElementById('product-category'),
    name: document.getElementById('product-name'),
    sample: document.getElementById('product-sample'),
    pValue: document.getElementById('p-value'),
    evidence: document.getElementById('evidence-note'),
    scaleFill: document.getElementById('scale-fill'),
    decisionHint: document.getElementById('decision-hint'),
    decisionArea: document.getElementById('decision-area'),
    feedback: document.getElementById('feedback-panel'),
    feedbackMark: document.getElementById('feedback-mark'),
    feedbackKicker: document.getElementById('feedback-kicker'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackCopy: document.getElementById('feedback-copy'),
    feedbackFact: document.getElementById('feedback-fact'),
    pointsChange: document.getElementById('points-change'),
    finalScore: document.getElementById('final-score'),
    resultsLede: document.getElementById('results-lede'),
    statCorrect: document.getElementById('stat-correct'),
    statTypeOne: document.getElementById('stat-type-one'),
    statTypeTwo: document.getElementById('stat-type-two')
  };
  const state = { deck: [], index: 0, score: 0, correct: 0, typeOne: 0, typeTwo: 0, answered: false };

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showScreen(which) {
    Object.keys(screens).forEach((key) => screens[key].classList.toggle('is-hidden', key !== which));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatP(value) {
    if (value === 0.05) return '0.050';
    if (value < 0.01) return value.toFixed(3);
    return value.toFixed(2);
  }

  function currentShipment() { return state.deck[state.index]; }

  function updateProgress() {
    const completed = state.index;
    const total = state.deck.length;
    const round = Math.min(completed + 1, total);
    document.getElementById('game-title').setAttribute('aria-label', 'Revisión en curso');
    elements.round.textContent = String(round).padStart(2, '0');
    elements.progressText.textContent = completed + ' de ' + total + ' inspeccionados';
    elements.progressFill.style.width = ((completed / total) * 100) + '%';
    elements.progressBar.setAttribute('aria-valuenow', String(completed));
  }

  function renderShipment() {
    const item = currentShipment();
    state.answered = false;
    elements.code.textContent = 'LOTE ' + item.code;
    elements.art.textContent = item.icon;
    elements.category.textContent = item.category;
    elements.name.textContent = item.name;
    elements.sample.textContent = item.sample;
    elements.pValue.textContent = formatP(item.p);
    const significant = item.p <= ALPHA;
    const decision = significant ? 'rechazar H₀' : 'no rechazar H₀';
    const evidence = significant ? 'Evidencia fuerte\ncontra H₀' : 'Evidencia insuficiente\npara rechazar H₀';
    elements.evidence.classList.toggle('is-nonsignificant', !significant);
    elements.evidence.lastElementChild.textContent = evidence;
    elements.scaleFill.style.width = Math.min((item.p / 0.20) * 100, 100) + '%';
    elements.scaleFill.classList.toggle('is-over-alpha', !significant);
    elements.decisionHint.innerHTML = '<span class="hint-icon">↳</span><span>Con α = 0.05, este resultado sugiere <b>' + decision + '</b>.</span>';
    elements.decisionArea.classList.remove('is-hidden');
    elements.feedback.classList.add('is-hidden');
    updateProgress();
    document.querySelectorAll('.decision-button').forEach((button) => { button.disabled = false; });
  }

  function startGame() {
    state.deck = shuffle(shipments);
    state.index = 0;
    state.score = 0;
    state.correct = 0;
    state.typeOne = 0;
    state.typeTwo = 0;
    elements.score.textContent = '0';
    showScreen('game');
    renderShipment();
  }

  function registerDecision(decision) {
    if (state.answered) return;
    state.answered = true;
    const item = currentShipment();
    const rejected = decision === 'reject';
    const correct = (rejected && !item.compliant) || (!rejected && item.compliant);
    const typeOne = rejected && item.compliant;
    const typeTwo = !rejected && !item.compliant;
    const scoreDelta = correct ? POINTS : -POINTS;
    state.score += scoreDelta;
    if (correct) state.correct += 1;
    if (typeOne) state.typeOne += 1;
    if (typeTwo) state.typeTwo += 1;
    elements.score.textContent = String(state.score);
    document.querySelectorAll('.decision-button').forEach((button) => { button.disabled = true; });
    elements.decisionArea.classList.add('is-hidden');
    elements.feedback.classList.remove('is-hidden', 'is-error');
    elements.feedback.classList.toggle('is-error', !correct);
    elements.feedbackMark.textContent = correct ? '✓' : '!';
    elements.feedbackKicker.textContent = correct ? 'BUENA INSPECCIÓN' : 'ERROR DE DECISIÓN';
    elements.pointsChange.textContent = (scoreDelta > 0 ? '+' : '') + scoreDelta;

    const actual = item.compliant ? 'conforme' : 'defectuoso';
    const suggested = item.p <= ALPHA ? 'rechazar H₀' : 'no rechazar H₀';
    if (typeOne) {
      elements.feedbackTitle.textContent = 'Error tipo I';
      elements.feedbackCopy.textContent = 'Rechazaste H₀ aunque el lote era conforme. En la simulación, eso detuvo un lote bueno y resta puntos.';
    } else if (typeTwo) {
      elements.feedbackTitle.textContent = 'Error tipo II';
      elements.feedbackCopy.textContent = 'No rechazaste H₀ aunque el lote era defectuoso. En la simulación, eso dejó pasar un lote malo y resta puntos.';
    } else if (correct) {
      elements.feedbackTitle.textContent = rejected ? 'Lote detenido a tiempo' : 'Lote liberado correctamente';
      elements.feedbackCopy.textContent = 'La decisión coincidió con la condición real del lote en esta simulación. Sumas puntos.';
    }
    elements.feedbackFact.innerHTML = '<b>Informe:</b> p = ' + formatP(item.p) + ' y α = 0.05 sugerían ' + suggested + '. <b>Realidad simulada:</b> lote ' + actual + '. ' + (typeOne ? 'Este es el caso de una H₀ verdadera que se rechaza.' : typeTwo ? 'Este es el caso de una H₀ falsa que no se rechaza.' : 'El valor p orienta la decisión, pero no revela por sí solo la condición real.');
    const isLastLot = state.index === state.deck.length - 1;
    elements.next.innerHTML = (isLastLot ? 'Ver resultados' : 'Siguiente lote') + ' <span aria-hidden="true">' + (isLastLot ? '↗' : '→') + '</span>';
  }

  function advance() {
    if (!state.answered) return;
    state.index += 1;
    if (state.index >= state.deck.length) {
      showResults();
      return;
    }
    renderShipment();
  }

  function showResults() {
    elements.finalScore.textContent = String(state.score);
    elements.statCorrect.textContent = state.correct + '/' + state.deck.length;
    elements.statTypeOne.textContent = String(state.typeOne);
    elements.statTypeTwo.textContent = String(state.typeTwo);
    if (state.correct === state.deck.length) {
      elements.resultsLede.textContent = 'Inspección impecable. Ningún lote bueno fue detenido y ningún lote defectuoso pasó.';
    } else if (state.correct >= 5) {
      elements.resultsLede.textContent = 'Buen turno. Repasa los errores estadísticos para afinar el criterio de inspección.';
    } else {
      elements.resultsLede.textContent = 'Turno de práctica completado. La comparación p y α ayuda a decidir, pero no da certeza sobre cada lote.';
    }
    showScreen('results');
  }

  elements.start.addEventListener('click', startGame);
  elements.replay.addEventListener('click', startGame);
  elements.next.addEventListener('click', advance);
  document.querySelectorAll('.decision-button').forEach((button) => {
    button.addEventListener('click', () => registerDecision(button.dataset.decision));
  });
  document.addEventListener('keydown', (event) => {
    if (screens.game.classList.contains('is-hidden') || state.answered) return;
    if (event.key === '1') registerDecision('reject');
    if (event.key === '2') registerDecision('release');
  });
})();
