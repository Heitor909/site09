const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

const largura = canvas.width;
const altura = canvas.height;

// Imagens
const naveImg = new Image();
naveImg.src = "nave.png";

const inimigoImg = new Image();
inimigoImg.src = "inimigo.png";

const fundoImg = new Image();
fundoImg.src = "fundo.jpg";

// Som
const somTiro = new Audio("tiro.wav");

// Jogador
const nave = { x: 375, y: 520, w: 50, h: 50, velocidade: 5 };
let tiros = [];
let vidas = 3;
let dano = false;
let tempoDano = 0;
let tempoPiscar = 0;
let piscando = false;

// Inimigos
let inimigos = [];
let tirosInimigos = [];
let explosoes = [];

function criarInimigos(qtd) {
  inimigos = [];
  for (let i = 0; i < qtd; i++) {
    inimigos.push({
      x: 100 + i * 80,
      y: 50,
      w: 50,
      h: 50,
      direcao: 1
    });
  }
}

criarInimigos(6);

// Controles
const teclas = {};
document.addEventListener("keydown", (e) => {
  teclas[e.key] = true;
  if (e.key === " ") {
    tiros.push({ x: nave.x + 22, y: nave.y, w: 5, h: 10 });
    somTiro.currentTime = 0;
    somTiro.play();
  }
});

document.addEventListener("keyup", (e) => {
  teclas[e.key] = false;
});

function desenharExplosoes() {
  for (let i = explosoes.length - 1; i >= 0; i--) {
    const exp = explosoes[i];
    const t = Date.now() - exp.inicio;
    if (t > 300) {
      explosoes.splice(i, 1);
      continue;
    }
    const raio = 20 + t / 10;
    const alpha = 1 - t / 300;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, raio, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${100 + Math.random() * 150}, 0, ${alpha})`;
    ctx.fill();
  }
}

function desenhar() {
  ctx.drawImage(fundoImg, 0, 0, largura, altura);

  // Nave com piscar
  if (dano) {
    if (Date.now() - tempoDano < 1000) {
      if (Date.now() - tempoPiscar > 100) {
        piscando = !piscando;
        tempoPiscar = Date.now();
      }
      if (piscando) {
        ctx.drawImage(naveImg, nave.x, nave.y, nave.w, nave.h);
      }
    } else {
      dano = false;
      ctx.drawImage(naveImg, nave.x, nave.y, nave.w, nave.h);
    }
  } else {
    ctx.drawImage(naveImg, nave.x, nave.y, nave.w, nave.h);
  }

  // Tiros do jogador
  tiros.forEach(tiro => {
    ctx.fillStyle = "red";
    ctx.fillRect(tiro.x, tiro.y, tiro.w, tiro.h);
  });

  // Inimigos
  inimigos.forEach(inimigo => {
    ctx.drawImage(inimigoImg, inimigo.x, inimigo.y, inimigo.w, inimigo.h);
  });

  // Tiros inimigos
  tirosInimigos.forEach(tiro => {
    ctx.fillStyle = "blue";
    ctx.fillRect(tiro.x, tiro.y, tiro.w, tiro.h);
  });

  // Explosões
  desenharExplosoes();

  // Vidas
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Vidas: " + vidas, 10, 25);
}

function atualizar() {
  // Movimento nave
  if (teclas["ArrowLeft"] && nave.x > 0) nave.x -= nave.velocidade;
  if (teclas["ArrowRight"] && nave.x + nave.w < largura) nave.x += nave.velocidade;

  // Tiros sobem
  tiros = tiros.filter(tiro => tiro.y > 0);
  tiros.forEach(tiro => (tiro.y -= 7));

  // Movimento inimigos
  inimigos.forEach(inimigo => {
    inimigo.x += inimigo.direcao * 2;
    if (inimigo.x <= 0 || inimigo.x + inimigo.w >= largura) {
      inimigo.direcao *= -1;
    }

    // Inimigo atira se alinhado com nave
    if (Math.abs(inimigo.x + inimigo.w / 2 - (nave.x + nave.w / 2)) < 5 && Math.random() < 0.02) {
      tirosInimigos.push({
        x: inimigo.x + inimigo.w / 2 - 2,
        y: inimigo.y + inimigo.h,
        w: 4,
        h: 10
      });
    }
  });

  // Tiros inimigos
  tirosInimigos = tirosInimigos.filter(tiro => tiro.y < altura);
  tirosInimigos.forEach(tiro => (tiro.y += 5));

  // Colisão tiro x inimigo
  for (let i = tiros.length - 1; i >= 0; i--) {
    const tiro = tiros[i];
    for (let j = inimigos.length - 1; j >= 0; j--) {
      const inimigo = inimigos[j];
      if (
        tiro.x < inimigo.x + inimigo.w &&
        tiro.x + tiro.w > inimigo.x &&
        tiro.y < inimigo.y + inimigo.h &&
        tiro.y + tiro.h > inimigo.y
      ) {
        explosoes.push({ x: inimigo.x + 25, y: inimigo.y + 25, inicio: Date.now() });
        tiros.splice(i, 1);
        inimigos.splice(j, 1);
        break;
      }
    }
  }

  // Colisão nave x tiro inimigo
  for (let i = tirosInimigos.length - 1; i >= 0; i--) {
    const tiro = tirosInimigos[i];
    if (
      tiro.x < nave.x + nave.w &&
      tiro.x + tiro.w > nave.x &&
      tiro.y < nave.y + nave.h &&
      tiro.y + tiro.h > nave.y &&
      !dano
    ) {
      explosoes.push({ x: nave.x + 25, y: nave.y + 25, inicio: Date.now() });
      tirosInimigos.splice(i, 1);
      vidas--;
      dano = true;
      tempoDano = Date.now();
      piscando = true;

      if (vidas <= 0) {
        alert("Game Over!");
        document.location.reload();
      }
    }
  }
}

function loop() {
  atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

loop();
