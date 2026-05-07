import { useEffect, useRef, useCallback } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_X = 80;
const BIRD_RADIUS = 18;
const GRAVITY = 0.5;
const JUMP_FORCE = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 2.8;
const PIPE_INTERVAL = 1500;

type GameState = "idle" | "playing" | "dead";

interface Bird {
  y: number;
  vy: number;
  angle: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

interface GameData {
  state: GameState;
  bird: Bird;
  pipes: Pipe[];
  score: number;
  bestScore: number;
  lastPipeTime: number;
  frameId: number;
  lastTime: number;
  groundOffset: number;
}

function randomPipeHeight() {
  return 80 + Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 160);
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird) {
  ctx.save();
  ctx.translate(BIRD_X, bird.y);
  ctx.rotate(bird.angle);

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_RADIUS);
  bodyGrad.addColorStop(0, "#ffe066");
  bodyGrad.addColorStop(1, "#f5a623");
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "#e08800";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wing
  ctx.beginPath();
  ctx.ellipse(-4, 6, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "#f5a623";
  ctx.fill();

  // Eye white
  ctx.beginPath();
  ctx.arc(8, -5, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(10, -5, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();

  // Eye shine
  ctx.beginPath();
  ctx.arc(11, -6, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Beak
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(22, 2);
  ctx.lineTo(14, 5);
  ctx.closePath();
  ctx.fillStyle = "#ff6b35";
  ctx.fill();

  ctx.restore();
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: Pipe
) {
  const capH = 20;
  const capW = PIPE_WIDTH + 10;
  const capX = pipe.x - 5;

  // Top pipe body
  const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  topGrad.addColorStop(0, "#3a7d44");
  topGrad.addColorStop(0.4, "#52b969");
  topGrad.addColorStop(1, "#2d6035");
  ctx.fillStyle = topGrad;
  drawRoundRect(ctx, pipe.x, 0, PIPE_WIDTH, pipe.topHeight - capH, 4);
  ctx.fill();
  ctx.strokeStyle = "#2d6035";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top pipe cap
  const capGradT = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  capGradT.addColorStop(0, "#3a7d44");
  capGradT.addColorStop(0.4, "#5ecf77");
  capGradT.addColorStop(1, "#2d6035");
  ctx.fillStyle = capGradT;
  drawRoundRect(ctx, capX, pipe.topHeight - capH, capW, capH, 5);
  ctx.fill();
  ctx.strokeStyle = "#2d6035";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const bottomY = pipe.topHeight + PIPE_GAP;
  const bottomH = CANVAS_HEIGHT - bottomY - 80;

  // Bottom cap
  const capGradB = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  capGradB.addColorStop(0, "#3a7d44");
  capGradB.addColorStop(0.4, "#5ecf77");
  capGradB.addColorStop(1, "#2d6035");
  ctx.fillStyle = capGradB;
  drawRoundRect(ctx, capX, bottomY, capW, capH, 5);
  ctx.fill();
  ctx.strokeStyle = "#2d6035";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bottom body
  const botGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  botGrad.addColorStop(0, "#3a7d44");
  botGrad.addColorStop(0.4, "#52b969");
  botGrad.addColorStop(1, "#2d6035");
  ctx.fillStyle = botGrad;
  drawRoundRect(ctx, pipe.x, bottomY + capH, PIPE_WIDTH, bottomH - capH, 4);
  ctx.fill();
  ctx.strokeStyle = "#2d6035";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - 80);
  skyGrad.addColorStop(0, "#70c5ce");
  skyGrad.addColorStop(0.6, "#87d8e0");
  skyGrad.addColorStop(1, "#b8eaf0");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - 80);
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  const groundY = CANVAS_HEIGHT - 80;

  // Dirt layer
  const dirtGrad = ctx.createLinearGradient(0, groundY, 0, CANVAS_HEIGHT);
  dirtGrad.addColorStop(0, "#c9a96e");
  dirtGrad.addColorStop(1, "#a07850");
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, groundY, CANVAS_WIDTH, 80);

  // Grass strip
  ctx.fillStyle = "#5ab552";
  ctx.fillRect(0, groundY, CANVAS_WIDTH, 20);

  // Grass highlight
  ctx.fillStyle = "#6dd660";
  for (let i = -20; i < CANVAS_WIDTH + 20; i += 22) {
    const x = ((i + offset) % (CANVAS_WIDTH + 40)) - 20;
    ctx.beginPath();
    ctx.arc(x + 11, groundY + 4, 10, Math.PI, 0);
    ctx.fill();
  }

  // Ground line
  ctx.strokeStyle = "#3d8c3a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 20);
  ctx.lineTo(CANVAS_WIDTH, groundY + 20);
  ctx.stroke();
}

function drawClouds(ctx: CanvasRenderingContext2D, offset: number) {
  const clouds = [
    { x: 60, y: 60, scale: 1 },
    { x: 200, y: 100, scale: 0.7 },
    { x: 320, y: 50, scale: 1.2 },
  ];

  clouds.forEach((cloud) => {
    const cx = ((cloud.x - offset * 0.3) % (CANVAS_WIDTH + 100)) - 50;
    ctx.save();
    ctx.translate(cx, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);
    ctx.globalAlpha = 0.85;

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.arc(28, -8, 20, 0, Math.PI * 2);
    ctx.arc(52, 0, 24, 0, Math.PI * 2);
    ctx.arc(28, 12, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.save();
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 5;
  ctx.strokeText(String(score), CANVAS_WIDTH / 2, 80);
  ctx.fillText(String(score), CANVAS_WIDTH / 2, 80);
  ctx.restore();
}

function drawIdleScreen(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // Panel
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  drawRoundRect(ctx, CANVAS_WIDTH / 2 - 130, 180, 260, 160, 16);
  ctx.fill();

  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff5cc";
  ctx.strokeStyle = "#8b5e00";
  ctx.lineWidth = 5;
  ctx.strokeText("FLAPPY BIRD", CANVAS_WIDTH / 2, 240);
  ctx.fillText("FLAPPY BIRD", CANVAS_WIDTH / 2, 240);

  ctx.font = "18px Arial";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.strokeText("Pressione ESPAÇO ou toque", CANVAS_WIDTH / 2, 288);
  ctx.fillText("Pressione ESPAÇO ou toque", CANVAS_WIDTH / 2, 288);
  ctx.strokeText("para começar", CANVAS_WIDTH / 2, 314);
  ctx.fillText("para começar", CANVAS_WIDTH / 2, 314);

  ctx.restore();
}

function drawGameOver(
  ctx: CanvasRenderingContext2D,
  score: number,
  best: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Panel
  ctx.fillStyle = "#fff5cc";
  drawRoundRect(ctx, CANVAS_WIDTH / 2 - 140, 160, 280, 220, 18);
  ctx.fill();
  ctx.strokeStyle = "#c8900a";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#c0392b";
  ctx.strokeStyle = "#7b0000";
  ctx.lineWidth = 4;
  ctx.strokeText("GAME OVER", CANVAS_WIDTH / 2, 218);
  ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, 218);

  ctx.font = "20px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText(`Pontuação: ${score}`, CANVAS_WIDTH / 2, 260);
  ctx.fillText(`Melhor: ${best}`, CANVAS_WIDTH / 2, 292);

  // Restart button hint
  ctx.fillStyle = "#f5a623";
  drawRoundRect(ctx, CANVAS_WIDTH / 2 - 90, 318, 180, 44, 10);
  ctx.fill();
  ctx.strokeStyle = "#c07800";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "bold 17px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Jogar Novamente", CANVAS_WIDTH / 2, 346);

  ctx.restore();
}

function checkCollision(bird: Bird, pipes: Pipe[]): boolean {
  const groundY = CANVAS_HEIGHT - 80;

  // Ground / ceiling
  if (bird.y + BIRD_RADIUS >= groundY || bird.y - BIRD_RADIUS <= 0) return true;

  // Pipes
  for (const pipe of pipes) {
    const birdLeft = BIRD_X - BIRD_RADIUS;
    const birdRight = BIRD_X + BIRD_RADIUS;
    const birdTop = bird.y - BIRD_RADIUS;
    const birdBottom = bird.y + BIRD_RADIUS;

    if (birdRight > pipe.x + 5 && birdLeft < pipe.x + PIPE_WIDTH - 5) {
      if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
        return true;
      }
    }
  }
  return false;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>({
    state: "idle",
    bird: { y: CANVAS_HEIGHT / 2, vy: 0, angle: 0 },
    pipes: [],
    score: 0,
    bestScore: 0,
    lastPipeTime: 0,
    frameId: 0,
    lastTime: 0,
    groundOffset: 0,
  });

  const jump = useCallback(() => {
    const g = gameRef.current;
    if (g.state === "idle") {
      g.state = "playing";
      g.bird.vy = JUMP_FORCE;
    } else if (g.state === "playing") {
      g.bird.vy = JUMP_FORCE;
    } else if (g.state === "dead") {
      g.state = "idle";
      g.bird = { y: CANVAS_HEIGHT / 2, vy: 0, angle: 0 };
      g.pipes = [];
      g.score = 0;
      g.lastPipeTime = 0;
      g.groundOffset = 0;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    let savedBest = parseInt(localStorage.getItem("flappy_best") ?? "0", 10);
    g.bestScore = isNaN(savedBest) ? 0 : savedBest;

    function gameLoop(timestamp: number) {
      if (!ctx || !canvas) return;
      const dt = Math.min(timestamp - g.lastTime, 50);
      g.lastTime = timestamp;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawBackground(ctx);
      drawClouds(ctx, g.groundOffset);

      if (g.state === "playing") {
        // Physics
        g.bird.vy += GRAVITY;
        g.bird.y += g.bird.vy;
        g.bird.angle = Math.max(-0.4, Math.min(Math.PI / 2, g.bird.vy * 0.065));

        // Ground scroll
        g.groundOffset = (g.groundOffset + PIPE_SPEED) % (CANVAS_WIDTH + 100);

        // Spawn pipes
        if (timestamp - g.lastPipeTime > PIPE_INTERVAL) {
          g.pipes.push({ x: CANVAS_WIDTH + 10, topHeight: randomPipeHeight(), scored: false });
          g.lastPipeTime = timestamp;
        }

        // Move pipes & score
        for (const pipe of g.pipes) {
          pipe.x -= PIPE_SPEED;
          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_RADIUS) {
            pipe.scored = true;
            g.score++;
          }
        }
        g.pipes = g.pipes.filter((p) => p.x + PIPE_WIDTH > -20);

        // Collision
        if (checkCollision(g.bird, g.pipes)) {
          g.state = "dead";
          if (g.score > g.bestScore) {
            g.bestScore = g.score;
            localStorage.setItem("flappy_best", String(g.bestScore));
          }
        }
      } else if (g.state === "idle") {
        // Gentle float
        g.bird.y = CANVAS_HEIGHT / 2 + Math.sin(timestamp * 0.003) * 12;
        g.bird.angle = 0;
      }

      // Draw pipes
      for (const pipe of g.pipes) {
        drawPipe(ctx, pipe);
      }

      drawGround(ctx, g.groundOffset);
      drawBird(ctx, g.bird);

      if (g.state === "playing" || g.state === "dead") {
        drawScore(ctx, g.score);
      }

      if (g.state === "idle") drawIdleScreen(ctx);
      if (g.state === "dead") drawGameOver(ctx, g.score, g.bestScore);

      g.frameId = requestAnimationFrame(gameLoop);
    }

    g.lastTime = performance.now();
    g.frameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(g.frameId);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault();
          jump();
        }}
        style={{
          borderRadius: 12,
          boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          cursor: "pointer",
          touchAction: "none",
          maxHeight: "90vh",
          maxWidth: "95vw",
        }}
      />
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 13,
          marginTop: 12,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Espaço / Clique / Toque para voar
      </p>
    </div>
  );
}
