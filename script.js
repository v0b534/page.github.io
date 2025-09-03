// ——— Variables globales ———
let deck = [];
let playerHand = [];
let dealerHand = [];

let playerBalance = 300;  // saldo inicial
let currentBet = 0;
let totalBets = 0; // Nueva variable para llevar el total de apuestas

const sfxDraw = new Audio('card-sounds-35956.mp3');
const sfxFlip = new Audio('flipcard-91468.mp3');
const sfxShuffle = new Audio('card-mixing-48088.mp3');
const sfxMarimba = new Audio('marimba.mp3');
const sfxChips = new Audio('poker_chips.mp3');

sfxDraw.volume = 0.5;
sfxFlip.volume = 0.5;
sfxShuffle.volume = 0.5;
sfxMarimba.volume = 0.5;
sfxChips.volume = 0.5;

const messageEl = document.getElementById('message');
const hitBtn = document.getElementById('hit');
const standBtn = document.getElementById('stand');
const restartBtn = document.getElementById('restart');
const popup = document.getElementById('popup');
const popupCloseBtn = document.getElementById('popup-close');

// Nuevos elementos para apuesta
const betInput = document.getElementById('bet-input');
const placeBetBtn = document.getElementById('place-bet');

function updateMoneyDisplay() {
  const moneyEl = document.getElementById('player-money');
  if (moneyEl) moneyEl.textContent = playerBalance;
}  

// ——— Funciones del juego ———
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // sfxShuffle.play(); ← QUITA o comenta esta línea
}

function drawCard() {
  return deck.pop();
}

function calculateScore(hand) {
  let score = 0, aces = 0;
  hand.forEach(card => {
    if (['J','Q','K'].includes(card.value)) score += 10;
    else if (card.value === 'A') { score += 11; aces++; }
    else score += parseInt(card.value);
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

/**
 * Renderiza las cartas en el contenedor indicado.
 * 
 * @param {string} containerId - ID del contenedor donde mostrar cartas
 * @param {Array} hand - Array de cartas ({value, suit})
 * @param {boolean} hideSecond - Si debe ocultar la segunda carta del dealer
 * @param {boolean} showValues - Si true muestra las cartas reales, sino cartas en blanco
 */
function renderCards(containerId, hand, hideSecond = false, showValues = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  hand.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';

    // Si es la segunda carta del dealer y debe estar oculta
    if (containerId === 'dealer-cards' && hideSecond && i === 1) {
      el.textContent = '';
      el.classList.add('card-back');
    } else if (!showValues) {
      el.textContent = '';
      el.classList.add('card-back');
    } else {
      el.textContent = `${card.value}${card.suit}`;
      el.classList.remove('card-back');
      // Si es corazón o diamante, agrega clase roja
      if (card.suit === '♥' || card.suit === '♦') {
        el.classList.add('red-suit');
      }
    }

    container.appendChild(el);
    setTimeout(() => {
      sfxFlip.play();
    }, 100 * i);
  });
}

function updateScores() {
  if (currentBet > 0) {
    document.getElementById('player-score').textContent = `Puntos: ${calculateScore(playerHand)}`;
    const dealerScoreEl = document.getElementById('dealer-score');
    const dealerCards = document.getElementById('dealer-cards');
    // Verifica si la segunda carta del dealer está oculta (tiene la clase card-back)
    const isSecondCardHidden = (
      dealerHand.length === 2 &&
      dealerCards.children.length === 2 &&
      dealerCards.children[1].classList.contains('card-back')
    );
    if (isSecondCardHidden) {
      // Solo muestra el valor de la primera carta del dealer
      let firstCard = [dealerHand[0]];
      dealerScoreEl.textContent = `Puntos: ${calculateScore(firstCard)}`;
    } else {
      dealerScoreEl.textContent = `Puntos: ${calculateScore(dealerHand)}`;
    }
  } else {
    document.getElementById('player-score').textContent = 'Puntos: ?';
    document.getElementById('dealer-score').textContent = 'Puntos: ?';
  }
}  

function showMessage(text) {
  messageEl.textContent = text;
}

function enableControls() {
  hitBtn.disabled = false;
  standBtn.disabled = false;
}

function disableControls() {
  hitBtn.disabled = true;
  standBtn.disabled = true;
}

function showPopup() {
  popup.classList.remove('hidden');
}

function hidePopup() {
  popup.classList.add('hidden');
}

// ——— Lógica de manos ———
function startGame() {
  createDeck();

  // Manipulación de probabilidades
  let favorPlayer = rigDeckForPlayerWin();
  if (!favorPlayer) {
    // Si debe favorecer al dealer, intercambia una carta alta del dealer con una baja del jugador
    createDeck();
    let highCards = deck.filter(c => ['A','K','Q','J','10'].includes(c.value));
    let lowCards = deck.filter(c => ['2','3','4','5','6'].includes(c.value));
    if (highCards.length && lowCards.length) {
      // Pone una carta alta al dealer y una baja al jugador
      let high = highCards[0];
      let low = lowCards[0];
      deck = deck.filter(c => c !== high && c !== low);
      deck.push(low); // última carta para el jugador
      deck.unshift(high); // primera carta para el dealer
    }
  }

  restartBtn.style.display = 'none';
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard()];

  renderCards('player-cards', playerHand, false, false);
  renderCards('dealer-cards', dealerHand, true, false);

  updateScores();
  showMessage('Realiza tu apuesta para comenzar.');
  disableControls();

  betInput.disabled = false;
  placeBetBtn.disabled = false;
}

function hitCard() {
  playerHand.push(drawCard());
  renderCards('player-cards', playerHand, false, true);
  updateScores();
  if (calculateScore(playerHand) > 21) {
    endGame('Te pasaste. ¡Perdiste!');
  }
}

async function stand() {
  revealDealer();
  await dealerPlayAnimated();
  const p = calculateScore(playerHand);
  const d = calculateScore(dealerHand);
  let result = '';
  if (d > 21 || p > d) result = '¡Ganaste!';
  else if (p === d) result = 'Empate.';
  else result = 'Perdiste.';
  endGame(result);
}

// Nueva función para animar la jugada del dealer
async function dealerPlayAnimated() {
  while (calculateScore(dealerHand) < 17) {
    await new Promise(resolve => setTimeout(resolve, 800));
    dealerHand.push(drawCard());
    renderCards('dealer-cards', dealerHand, false, true);
    updateScores();
  }
}

function endGame(message) {
  showMessage(message);

  // Animación de ficha al ganar (con retardo de 1 segundo)
  const chipAnim = document.getElementById('win-chip-animation');
  const chipText = document.getElementById('win-chip-text');
  if (message.includes('Ganaste') && chipAnim && chipText) {
    chipText.textContent = `¡Ganaste ${currentBet * 2} fichas!`;
    setTimeout(() => {
      chipAnim.classList.remove('hidden');
      chipAnim.querySelector('.chip-poker').style.animation = 'none';
      chipText.style.animation = 'none';
      void chipAnim.offsetWidth;
      chipAnim.querySelector('.chip-poker').style.animation = '';
      chipText.style.animation = '';

      // Inicia el sfx de marimba
      sfxMarimba.currentTime = 0;
      sfxMarimba.play();

      // Después de 3 segundos, inicia el sfx de poker_chips y oculta la animación
      setTimeout(() => {
        sfxChips.currentTime = 0;
        sfxChips.play();
        chipAnim.classList.add('hidden');
      }, 3000);
    }, 1000); // ← Espera 1 segundo antes de mostrar la animación
  }

  // Revelar la segunda carta y puntaje real si el jugador se pasa
  if (message.includes('Te pasaste')) {
    renderCards('dealer-cards', dealerHand, false, true);
    updateScores();
  }

  disableControls();

  if (message.includes('Perdiste')) {
    // Mensajes reflexivos para el popup de derrota
    const loseMessages = [
      "¿Vale la pena seguir apostando?",
      "¿Qué buscas realmente en el juego?",
      "¿Cuánto más estás dispuesto a perder?",
      "Recuerda: la casa siempre gana a largo plazo.",
      "¿Qué sentirías si dejaras de apostar hoy?",
      "¿Por qué sigues intentándolo?",
      "¿El juego te está dando lo que esperabas?",
      "A veces, perder es una oportunidad para reflexionar.",
      "¿Cuánto tiempo y dinero has invertido aquí?",
      "¿Y si hoy decides parar?",
      "¿Qué podrías hacer con este tiempo fuera del juego?",
      "El verdadero reto es dejar de apostar.",
      "¿A quién afecta tu manera de jugar?",
      "¿Qué te motiva a seguir apostando?",
      "¿Es este el entretenimiento que quieres para tu vida?"
    ];
    const randomMsg = loseMessages[Math.floor(Math.random() * loseMessages.length)];
    document.getElementById('popup-title').textContent = '¡Perdiste!';
    document.getElementById('popup-desc').textContent = randomMsg;
    showPopup();
  } else {
    hidePopup();
  }

  if (message.includes('Perdiste') || message.includes('Ganaste') || message.includes('Empate')) {
    restartBtn.style.display = 'inline-block';
  } else {
    restartBtn.style.display = 'none';
  }

  if (message.includes('Ganaste')) {
    playerBalance += currentBet * 2;
  } else if (message.includes('Empate')) {
    playerBalance += currentBet;
  }

  updateMoneyDisplay();

  currentBet = 0;

  betInput.disabled = true;
  placeBetBtn.disabled = true;
}

function revealDealer() {
  renderCards('dealer-cards', dealerHand, false, true);
  updateScores();
}

// ——— Eventos UI ———
hitBtn.addEventListener('click', hitCard);
standBtn.addEventListener('click', stand);
restartBtn.addEventListener('click', () => {
  currentBet = 0;
  betInput.value = 50; // ← Esto asegura que el input vuelva a 50 al reiniciar
  betInput.disabled = false;
  placeBetBtn.disabled = false;
  restartBtn.style.display = 'none';
  startGame();
});
popupCloseBtn.addEventListener('click', hidePopup);

placeBetBtn.addEventListener('click', async () => {
  const bet = parseInt(betInput.value);
  if (isNaN(bet) || bet < 50) {
    // Mostrar el popup con mensaje personalizado
    document.getElementById('popup-title').textContent = 'Apuesta inválida';
    document.getElementById('popup-desc').textContent = 'La apuesta mínima es de 50 fichas.';
    showPopup();
    return;
  }
  if (bet > playerBalance || playerBalance <= 0) {
    showPopupById('no-chips-popup');
    return;
  }  

  currentBet = bet;
  playerBalance -= currentBet;
  totalBets++; // Actualizar el total de apuestas
  updateMoneyDisplay();

  betInput.disabled = true;
  placeBetBtn.disabled = true;

  // Mostrar cartas reales (ya se apostó)
  renderCards('player-cards', playerHand, false, true);
  renderCards('dealer-cards', dealerHand, true, true);

  enableControls();
  showMessage('Apuesta realizada, juega tu mano.');

  updateScores();

  // --- NUEVO: Verificar Blackjack instantáneo ---
  if (calculateScore(playerHand) === 21 && playerHand.length === 2) {
    disableControls();
    revealDealer();
    await dealerPlayAnimatedBlackjack();
    const p = calculateScore(playerHand);
    const d = calculateScore(dealerHand);
    let result = '';
    if (d === 21) result = 'Empate.';
    else result = '¡Blackjack! ¡Ganaste!';
    endGame(result);
  }
});

// Nueva función para animar la jugada del dealer solo si el jugador tiene blackjack
async function dealerPlayAnimatedBlackjack() {
  // El dealer solo roba si tiene menos de 21
  while (calculateScore(dealerHand) < 21) {
    await new Promise(resolve => setTimeout(resolve, 800));
    dealerHand.push(drawCard());
    renderCards('dealer-cards', dealerHand, false, true);
    updateScores();
  }
}

function rigDeckForPlayerWin() {
  // Si el jugador tiene menos de 10 apuestas, o apuesta poco, favorece al jugador
  if (totalBets <= 10) return true;
  // Si apuesta poco, más chances de ganar
  if (currentBet <= 100 && Math.random() < 0.5) return true;
  // Si apuesta mucho, menos chances de ganar
  if (currentBet > 300 && Math.random() < 0.8) return false;
  // Después de 10 apuestas, favorece al dealer
  return false;
}

window.addEventListener('DOMContentLoaded', () => {
  startGame();

  // Valor por defecto en el input de apuesta
  betInput.value = 50;

  // Ads alternancia
  const adImg = document.getElementById('ad-img');
  const adLink = document.getElementById('ad-link');
  if (adImg && adLink) {
    let adIndex = 0;
    function showAd(index) {
      adImg.src = ads[index].img;
      adImg.alt = ads[index].alt;
      adLink.href = ads[index].link;
    }
    showAd(adIndex);
    setInterval(() => {
      adIndex = (adIndex + 1) % ads.length;
      showAd(adIndex);
    }, 10000);
  }
});

// Tiempo máximo en milisegundos (ej. 1 hora = 3600000 ms)
const tiempoMaximo = 30 * 60 * 1000;

// Después de este tiempo, se muestra el popup
setTimeout(() => {
  const popup = document.getElementById("timeout-popup");
  if (popup) {
    popup.classList.remove("hidden");
    popup.style.zIndex = "9999"; // asegurarse que esté encima de todo
  }

  // Opcional: bloquear interacción (elimina botones, etc.)
  document.body.innerHTML += `<style>
    button, input, .controls, .betting, #game-board { 
      pointer-events: none !important; 
      filter: blur(2px); 
    }
  </style>`;

}, tiempoMaximo);

const ads = [
  {
    img: "turismo.jpg",
    link: "https://www.microsoft.com/",
    alt: "Microsoft"
  },
  {
    img: "cocaaaa.jpg",
    link: "https://www.github.com/",
    alt: "GitHub"
  },
  {
    img: "copa.jpg",
    link: "https://www.github.com/",
    alt: "GitHub"
  },
  {
    img: "ludopatia.jpg",
    link: "https://findahelpline.com/es-419/countries/ar/topics/gambling",
    alt: "Ludopatia"
  },
  {
    img: "boxeo.jpg",
    link: "https://www.google.com/",
    alt: "Google"
  }
];

function showPopupById(id) {
  const popup = document.getElementById(id);
  if (popup) popup.classList.remove('hidden');
}

function closePopup(id) {
  const popup = document.getElementById(id);
  if (popup) popup.classList.add('hidden');
}
