<script lang="ts">
	import { onMount } from 'svelte';
	type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
	const PADDLE_W = 10;
	const PADDLE_H = 80;
	const BALL_R = 6;
	const PADDLE_SPEED = 8;
	const BALL_BASE_SPEED = 10;
	const TICK_INTERVAL = 1000 / 30;
	const PADDLE_MARGIN = 20;
	const BALL_SPEED_INCREMENT = 0.2;
	let lastTick = 0;
	const WIN_SCORE = 10;
	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ctx: CanvasRenderingContext2D;
	let gameState: GameState = $state('menu');
	let scoreP1 = $state(0);
	let scoreP2 = $state(0);
	let winner = $state('');
	let p1Y = 0;
	let p2Y = 0;
	let ballX = 0;
	let ballY = 0;
	let ballDX = 0;
	let ballDY = 0;
	let animId = 0;
	const keys: Record<string, boolean> = {};
	// --- Audio ---
	let audioCtx: AudioContext | null = null;

	function getAudioCtx(): AudioContext {
		if (!audioCtx) audioCtx = new AudioContext();
		return audioCtx;
	}

	function playHit(): void {
		const ac = getAudioCtx();
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'square';
		osc.frequency.value = 440;
		gain.gain.setValueAtTime(0.1, ac.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
		osc.connect(gain).connect(ac.destination);
		osc.start();
		osc.stop(ac.currentTime + 0.06);
	}

	function playWall(): void {
		const ac = getAudioCtx();
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'triangle';
		osc.frequency.value = 220;
		gain.gain.setValueAtTime(0.08, ac.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
		osc.connect(gain).connect(ac.destination);
		osc.start();
		osc.stop(ac.currentTime + 0.08);
	}

	function playScore(): void {
		const ac = getAudioCtx();
		const osc = ac.createOscillator();
		const gain = ac.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(300, ac.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.3);
		gain.gain.setValueAtTime(0.12, ac.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
		osc.connect(gain).connect(ac.destination);
		osc.start();
		osc.stop(ac.currentTime + 0.35);
	}

	function playWin(): void {
		const ac = getAudioCtx();
		[523, 659, 784].forEach((freq, i) => {
			const osc = ac.createOscillator();
			const gain = ac.createGain();
			osc.type = 'square';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.12, ac.currentTime + i * 0.12);
			gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.15);
			osc.connect(gain).connect(ac.destination);
			osc.start(ac.currentTime + i * 0.12);
			osc.stop(ac.currentTime + i * 0.12 + 0.15);
		});
	}

	// --- Game logic ---
	function resetBall(direction: number): void {
		const w = canvas.width;
		const h = canvas.height;
		ballX = w / 2;
		ballY = h / 2;
		const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
		ballDX = BALL_BASE_SPEED * direction * Math.cos(angle);
		ballDY = BALL_BASE_SPEED * Math.sin(angle);
	}

	function resetGame(): void {
		const h = canvas.height;
		p1Y = h / 2 - PADDLE_H / 2;
		p2Y = h / 2 - PADDLE_H / 2;
		scoreP1 = 0;
		scoreP2 = 0;
		winner = '';
		resetBall(1);
	}

	function startGame(): void {
		resetGame();
		gameState = 'playing';
		lastTick = 0;
		animId = requestAnimationFrame(loop);
	}

	function clampPaddle(y: number): number {
		return Math.max(0, Math.min(canvas.height - PADDLE_H, y));
	}

	function update(): void {
		const w = canvas.width;
		const h = canvas.height;
		const paddleMargin = PADDLE_MARGIN;
		// Move paddles
		if (keys['ArrowUp']) p1Y -= PADDLE_SPEED;
		if (keys['ArrowDown']) p1Y += PADDLE_SPEED;
		if (keys['w'] || keys['W']) p2Y -= PADDLE_SPEED;
		if (keys['s'] || keys['S']) p2Y += PADDLE_SPEED;
		p1Y = clampPaddle(p1Y);
		p2Y = clampPaddle(p2Y);
		// Move ball
		ballX += ballDX;
		ballY += ballDY;
		// Top/bottom bounce
		if (ballY - BALL_R <= 0) {
			ballY = BALL_R;
			ballDY = Math.abs(ballDY);
			playWall();
		} else if (ballY + BALL_R >= h) {
			ballY = h - BALL_R;
			ballDY = -Math.abs(ballDY);
			playWall();
		}
		// P1 paddle (right side)
		const p1X = w - paddleMargin - PADDLE_W;
		if (ballDX > 0 && ballX + BALL_R >= p1X && ballX - BALL_R <= p1X + PADDLE_W && ballY >= p1Y && ballY <= p1Y + PADDLE_H) {
			ballX = p1X - BALL_R;
			const rel = (ballY - (p1Y + PADDLE_H / 2)) / (PADDLE_H / 2);
			const angle = rel * (Math.PI / 3);
			const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY) + BALL_SPEED_INCREMENT;
			ballDX = -speed * Math.cos(angle);
			ballDY = speed * Math.sin(angle);
			playHit();
		}
		// P2 paddle (left side)
		const p2X = paddleMargin;
		if (ballDX < 0 && ballX - BALL_R <= p2X + PADDLE_W && ballX + BALL_R >= p2X && ballY >= p2Y && ballY <= p2Y + PADDLE_H) {
			ballX = p2X + PADDLE_W + BALL_R;
			const rel = (ballY - (p2Y + PADDLE_H / 2)) / (PADDLE_H / 2);
			const angle = rel * (Math.PI / 3);
			const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY) + BALL_SPEED_INCREMENT;
			ballDX = speed * Math.cos(angle);
			ballDY = speed * Math.sin(angle);
			playHit();
		}
		// Score
		if (ballX + BALL_R < 0) {
			scoreP1++;
			playScore();
			if (scoreP1 >= WIN_SCORE) {
				winner = 'Player 1';
				gameState = 'gameover';
				playWin();
				return;
			}
			resetBall(-1);
		} else if (ballX - BALL_R > w) {
			scoreP2++;
			playScore();
			if (scoreP2 >= WIN_SCORE) {
				winner = 'Player 2';
				gameState = 'gameover';
				playWin();
				return;
			}
			resetBall(1);
		}
	}

	// --- Render ---
	function draw(): void {
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		const paddleMargin = PADDLE_MARGIN;
		// Background
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, w, h);
		// Center line
		ctx.setLineDash([6, 6]);
		ctx.strokeStyle = 'rgba(255,255,255,0.15)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(w / 2, 0);
		ctx.lineTo(w / 2, h);
		ctx.stroke();
		ctx.setLineDash([]);
		// Score
		ctx.fillStyle = 'rgba(255,255,255,0.3)';
		ctx.font = 'bold 48px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(String(scoreP2), w / 2 - 50, 55);
		ctx.fillText(String(scoreP1), w / 2 + 50, 55);
		// Player labels
		ctx.fillStyle = 'rgba(255,255,255,0.2)';
		ctx.font = '12px system-ui, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText('P2 [W/S]', paddleMargin, h - 10);
		ctx.textAlign = 'center';
		ctx.fillText('R = Reset', w / 2, h - 10);
		ctx.textAlign = 'right';
		ctx.fillText('P1 [↑/↓]', w - paddleMargin, h - 10);
		// Paddles
		ctx.fillStyle = '#fd3';
		const p1X = w - paddleMargin - PADDLE_W;
		ctx.beginPath();
		ctx.roundRect(p1X, p1Y, PADDLE_W, PADDLE_H, 4);
		ctx.fill();
		ctx.fillStyle = '#4fc3f7';
		ctx.beginPath();
		ctx.roundRect(paddleMargin, p2Y, PADDLE_W, PADDLE_H, 4);
		ctx.fill();
		// Ball
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
		ctx.fill();
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
		if (timestamp - lastTick >= TICK_INTERVAL) {
			lastTick = timestamp;
			update();
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
				animId = requestAnimationFrame(loop);
			}
			return;
		}
		if (e.key === 'r' || e.key === 'R') {
			e.preventDefault();
			cancelAnimationFrame(animId);
			resetGame();
			gameState = 'menu';
			drawOverlay('PONG', 'P1: ↑↓  |  P2: W/S  |  First to 10', 'Press Space to start');
			return;
		}
		if (gameState === 'playing') {
			if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
				e.preventDefault();
				keys[e.key] = true;
			}
		}
	}

	function onKeyUp(e: KeyboardEvent): void {
		delete keys[e.key];
	}

	// --- Resize ---
	function syncSize(): void {
		const rect = container.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
		// Re-center paddles on resize
		p1Y = clampPaddle(p1Y);
		p2Y = clampPaddle(p2Y);
		if (gameState === 'menu') drawOverlay('PONG', 'P1: ↑↓  |  P2: W/S  |  First to 10', 'Press Space to start');
		else if (gameState === 'paused') drawOverlay('PAUSED', '', 'Press Space to resume');
		else if (gameState === 'gameover') drawOverlay(`${winner} wins!`, `${scoreP2} — ${scoreP1}`, 'Press Space to play again');
		else draw();
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		const ro = new ResizeObserver(() => syncSize());
		ro.observe(container);
		syncSize();
		return () => {
			ro.disconnect();
			cancelAnimationFrame(animId);
			if (audioCtx) audioCtx.close();
		};
	});
</script>

<style>
	.pong {
		width: 100%;
		height: 100%;
		outline: none;
		overflow: hidden;
		background: #1a1a2e;
	}

	canvas {
		display: block;
	}
</style>

<div class="pong" bind:this={container} tabindex="-1" onkeydown={onKeyDown} onkeyup={onKeyUp} role="grid" aria-label="Pong game">
	<canvas bind:this={canvas}></canvas>
</div>
