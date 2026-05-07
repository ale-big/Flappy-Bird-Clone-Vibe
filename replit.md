# Flappy Bird

Clone do clássico jogo Flappy Bird — jogo de navegador onde o jogador controla um pássaro que deve desviar de canos clicando/tocando para voar.

## Run & Operate

- `pnpm --filter @workspace/flappy-bird run dev` — roda o jogo (porta dinâmica via PORT)
- `pnpm run typecheck` — checagem de tipos em todos os pacotes
- `pnpm run build` — build completo

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite
- Jogo: HTML5 Canvas, requestAnimationFrame
- Estilo: Tailwind CSS v4

## Where things live

- `artifacts/flappy-bird/src/App.tsx` — lógica completa do jogo (canvas, física, colisão, rendering)
- `artifacts/flappy-bird/src/index.css` — estilos base
- `artifacts/flappy-bird/vite.config.ts` — configuração Vite

## Architecture decisions

- Todo o jogo vive em um único componente `App.tsx` com `useRef` para estado mutável de alta frequência — evita re-renders desnecessários no loop de jogo
- `requestAnimationFrame` direto no `useEffect` com `gameRef` para estado do jogo, sem Redux/Zustand
- Canvas 2D puro, sem bibliotecas de jogo externas
- Melhor pontuação persistida em `localStorage`

## Product

- Pássaro com física de gravidade e impulso para cima ao clicar/tocar/espaço
- Canos com gap aleatório surgindo continuamente
- Tela inicial, jogo ativo, e tela de game over com pontuação e recorde
- Suporte a teclado (Espaço/ArrowUp), clique e toque (mobile)

## User preferences

_Populate as you build._

## Gotchas

- Estado do jogo fica em `gameRef.current` (não em `useState`) para não travar o loop de animação
- O `dt` é limitado a 50ms para evitar grandes saltos de física em caso de aba em segundo plano

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
