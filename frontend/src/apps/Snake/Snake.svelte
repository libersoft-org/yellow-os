<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import { onMount } from 'svelte';
	const win = getWindow();
	win.title = 'Snake';
	win.icon = '/img/apps/snake.svg';
	win.width = 480;
	win.height = 480;
	win.minWidth = 320;
	win.minHeight = 320;
	win.position = 'center';
	type Dir = 'up' | 'down' | 'left' | 'right';
	type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
	type Point = { x: number; y: number };
	const GRID = 20;
	const GAME_WIDTH = 480;
	const GAME_HEIGHT = 480;
	const BASE_INTERVAL = 150;
	const MIN_INTERVAL = 60;
	const SPEED_STEP = 3;
	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D;
	let gameState: GameState = $state('menu');
	let score = $state(0);
	let highScore = $state(0);
	let snake: Point[] = [];
	let food: Point = { x: 0, y: 0 };
	let dir: Dir = 'right';
	let nextDir: Dir = 'right';
	let cols = 0;
	let rows = 0;
	let lastTick = 0;
	let animId = 0;
	// --- Audio ---
	let audioCtx: AudioContext | null = null;

	function getAudioCtx(): AudioContext {
		if (!audioCtx) audioCtx = new AudioContext();
		return audioCtx;
	}

	function playEat(): void {
		const ac = getAudioCtx();
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(440, ac.currentTime);
		osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.08);
		gain.gain.setValueAtTime(0.15, ac.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
		osc.connect(gain).connect(ac.destination);
		osc.start();
		osc.stop(ac.currentTime + 0.12);
	}

	function playGameOver(): void {
		const ac = getAudioCtx();
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(300, ac.currentTime);
		osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.4);
		gain.gain.setValueAtTime(0.15, ac.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
		osc.connect(gain).connect(ac.destination);
		osc.start();
		osc.stop(ac.currentTime + 0.5);
	}

	function playStart(): void {
		const ac = getAudioCtx();
		[440, 660].forEach((freq, i) => {
			const osc = ac.createOscillator();
			const gain = ac.createGain();
			osc.type = 'square';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.12, ac.currentTime + i * 0.1);
			gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.1);
			osc.connect(gain).connect(ac.destination);
			osc.start(ac.currentTime + i * 0.1);
			osc.stop(ac.currentTime + i * 0.1 + 0.1);
		});
	}

	// --- Game logic ---
	function calcGrid(): void {
		cols = Math.floor(GAME_WIDTH / GRID);
		rows = Math.floor(GAME_HEIGHT / GRID);
	}

	function spawnFood(): void {
		const total = cols * rows;
		if (snake.length >= total) return;
		const occupied = new Set(snake.map(s => s.y * cols + s.x));
		const free: Point[] = [];
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				if (!occupied.has(y * cols + x)) free.push({ x, y });
			}
		}
		food = free[Math.floor(Math.random() * free.length)]!;
	}

	function resetGame(): void {
		calcGrid();
		const cx = Math.floor(cols / 2);
		const cy = Math.floor(rows / 2);
		snake = [
			{ x: cx, y: cy },
			{ x: cx - 1, y: cy },
			{ x: cx - 2, y: cy },
		];
		dir = 'right';
		nextDir = 'right';
		score = 0;
		spawnFood();
	}

	function startGame(): void {
		resetGame();
		gameState = 'playing';
		lastTick = 0;
		playStart();
		loop(0);
	}

	const SPEED_DECREMENT = 8;

	function getInterval(): number {
		return Math.max(MIN_INTERVAL, BASE_INTERVAL - Math.floor(score / SPEED_STEP) * SPEED_DECREMENT);
	}

	function tick(): boolean {
		dir = nextDir;
		const s = snake[0];
		if (!s) return false;
		const head: Point = { x: s.x, y: s.y };
		if (dir === 'up') head.y--;
		else if (dir === 'down') head.y++;
		else if (dir === 'left') head.x--;
		else head.x++;
		// Wall collision
		if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
			endGame();
			return false;
		}
		// Self collision
		if (snake.some(s => s.x === head.x && s.y === head.y)) {
			endGame();
			return false;
		}
		snake.unshift(head);
		if (head.x === food.x && head.y === food.y) {
			score++;
			playEat();
			spawnFood();
		} else snake.pop();
		return true;
	}

	function endGame(): void {
		gameState = 'gameover';
		playGameOver();
		if (score > highScore) {
			highScore = score;
			try {
				localStorage.setItem('yellow-os-snake-highscore', String(highScore));
			} catch {}
		}
		cancelAnimationFrame(animId);
	}

	// --- Render ---
	function draw(): void {
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		// Background
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, w, h);
		// Grid
		ctx.strokeStyle = 'rgba(255,255,255,0.04)';
		ctx.lineWidth = 1;
		for (let x = 0; x <= cols; x++) {
			ctx.beginPath();
			ctx.moveTo(x * GRID, 0);
			ctx.lineTo(x * GRID, rows * GRID);
			ctx.stroke();
		}
		for (let y = 0; y <= rows; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * GRID);
			ctx.lineTo(cols * GRID, y * GRID);
			ctx.stroke();
		}
		// Food
		ctx.fillStyle = '#e53935';
		ctx.beginPath();
		ctx.roundRect(food.x * GRID + 2, food.y * GRID + 2, GRID - 4, GRID - 4, 4);
		ctx.fill();
		// Snake
		snake.forEach((seg, i) => {
			const t = i / snake.length;
			const r = Math.round(230 - t * 80);
			const g = Math.round(184 - t * 60);
			const b = Math.round(0 + t * 20);
			ctx.fillStyle = `rgb(${r},${g},${b})`;
			ctx.beginPath();
			ctx.roundRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2, i === 0 ? 6 : 3);
			ctx.fill();
		});
		// Score
		ctx.fillStyle = 'rgba(255,255,255,0.6)';
		ctx.font = '14px system-ui, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(`Score: ${score}`, 8, 20);
		// Hint
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.font = '12px system-ui, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText('Space = Pause', w - 8, 20);
	}

	function drawOverlay(title: string, subtitle: string, action: string): void {
		draw();
		ctx.fillStyle = 'rgba(0,0,0,0.6)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.textAlign = 'center';
		const cx = canvas.width / 2;
		const cy = canvas.height / 2;
		ctx.fillStyle = '#fd3';
		ctx.font = 'bold 28px system-ui, sans-serif';
		ctx.fillText(title, cx, cy - 30);
		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.font = '14px system-ui, sans-serif';
		ctx.fillText(subtitle, cx, cy + 5);
		ctx.fillStyle = 'rgba(255,255,255,0.4)';
		ctx.font = '13px system-ui, sans-serif';
		ctx.fillText(action, cx, cy + 35);
	}

	// --- Loop ---
	function loop(timestamp: number): void {
		if (gameState !== 'playing') return;
		if (timestamp - lastTick >= getInterval()) {
			lastTick = timestamp;
			const alive = tick();
			if (!alive) {
				drawOverlay('GAME OVER', `Score: ${score}  |  Best: ${highScore}`, 'Press Space to play again');
				return;
			}
		}
		draw();
		animId = requestAnimationFrame(loop);
	}

	// --- Input ---
	function onKeyDown(e: KeyboardEvent): void {
		if (e.key === ' ') {
			e.preventDefault();
			if (gameState === 'menu' || gameState === 'gameover') startGame();
			else if (gameState === 'playing') {
				gameState = 'paused';
				cancelAnimationFrame(animId);
				drawOverlay('PAUSED', '', 'Press Space to resume');
			} else if (gameState === 'paused') {
				gameState = 'playing';
				lastTick = 0;
				loop(0);
			}
			return;
		}
		if (gameState !== 'playing') return;
		const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
		let newDir: Dir | null = null;
		if (e.key === 'ArrowUp') newDir = 'up';
		else if (e.key === 'ArrowDown') newDir = 'down';
		else if (e.key === 'ArrowLeft') newDir = 'left';
		else if (e.key === 'ArrowRight') newDir = 'right';
		if (newDir) {
			e.preventDefault();
			if (newDir !== opposite[dir]) nextDir = newDir;
		}
	}

	// --- Resize ---
	function syncSize(): void {
		if (gameState === 'menu') drawOverlay('SNAKE', `High Score: ${highScore}`, 'Press Space to start');
		else if (gameState === 'paused') drawOverlay('PAUSED', '', 'Press Space to resume');
		else if (gameState === 'gameover') drawOverlay('GAME OVER', `Score: ${score}  |  Best: ${highScore}`, 'Press Space to play again');
		else draw();
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		canvas.width = GAME_WIDTH;
		canvas.height = GAME_HEIGHT;
		calcGrid();
		try {
			highScore = Number(localStorage.getItem('yellow-os-snake-highscore')) || 0;
		} catch {}
		const ro = new ResizeObserver(() => syncSize());
		ro.observe(container);
		syncSize();
		drawOverlay('SNAKE', `High Score: ${highScore}`, 'Press Space to start');
		return () => {
			ro.disconnect();
			cancelAnimationFrame(animId);
			if (audioCtx) audioCtx.close();
		};
	});
</script>

<style>
	.snake {
		width: 100%;
		height: 100%;
		outline: none;
		overflow: hidden;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>

<div class="snake" bind:this={container} tabindex="-1" onkeydown={onKeyDown} role="grid" aria-label="Snake game">
	<canvas bind:this={canvas}></canvas>
</div>
