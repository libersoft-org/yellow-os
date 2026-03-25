<script lang="ts">
	import { getWindow } from '../../scripts/window-context.ts';
	import Clickable from '../../components/Clickable/Clickable.svelte';
	const win = getWindow();
	win.title = 'Calculator';
	win.icon = '/img/apps/calculator.svg';
	win.width = 280;
	win.height = 420;
	let display = $state('0');
	let previousValue = $state<number | null>(null);
	let operator = $state<string | null>(null);
	let waitingForOperand = $state(false);
	let lastExpression = $state('');

	function inputDigit(digit: string): void {
		if (waitingForOperand) {
			display = digit;
			waitingForOperand = false;
		} else display = display === '0' ? digit : display + digit;
	}

	function inputDecimal(): void {
		if (waitingForOperand) {
			display = '0.';
			waitingForOperand = false;
			return;
		}
		if (!display.includes('.')) {
			display += '.';
		}
	}

	function toggleSign(): void {
		const val = parseFloat(display);
		display = String(-val);
	}

	function inputPercent(): void {
		const val = parseFloat(display);
		display = String(val / 100);
	}

	function round(n: number): number {
		return Math.round(n * 1e12) / 1e12;
	}

	function calculate(left: number, right: number, op: string): number {
		switch (op) {
			case '+':
				return round(left + right);
			case '−':
				return round(left - right);
			case '×':
				return round(left * right);
			case '÷':
				return right !== 0 ? round(left / right) : NaN;
			default:
				return right;
		}
	}

	function handleOperator(nextOperator: string): void {
		const current = parseFloat(display);

		if (operator && !waitingForOperand) {
			const result = calculate(previousValue!, current, operator);
			lastExpression = `${previousValue} ${operator} ${current} =`;
			if (isNaN(result)) {
				display = 'Error';
				previousValue = null;
				operator = null;
			} else {
				display = String(result);
				previousValue = result;
			}
		} else {
			previousValue = current;
		}

		operator = nextOperator;
		waitingForOperand = true;
	}

	function handleEquals(): void {
		if (operator === null || previousValue === null) return;
		const current = parseFloat(display);
		const result = calculate(previousValue, current, operator);
		lastExpression = `${previousValue} ${operator} ${current} =`;
		display = isNaN(result) ? 'Error' : String(result);
		previousValue = null;
		operator = null;
		waitingForOperand = true;
	}

	function clear(): void {
		display = '0';
		previousValue = null;
		operator = null;
		waitingForOperand = false;
		lastExpression = '';
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
		else if (e.key === '.') inputDecimal();
		else if (e.key === '+') handleOperator('+');
		else if (e.key === '-') handleOperator('−');
		else if (e.key === '*') handleOperator('×');
		else if (e.key === '/') {
			e.preventDefault();
			handleOperator('÷');
		} else if (e.key === 'Enter' || e.key === '=') handleEquals();
		else if (e.key === 'Escape') clear();
		else if (e.key === '%') inputPercent();
		else if (e.key === 'Backspace') {
			if (!waitingForOperand && display.length > 1) {
				display = display.slice(0, -1);
			} else {
				display = '0';
			}
		}
	}

	const buttons = [
		{ label: 'C', action: clear, class: 'fn' },
		{ label: '±', action: toggleSign, class: 'fn' },
		{ label: '%', action: inputPercent, class: 'fn' },
		{ label: '÷', action: () => handleOperator('÷'), class: 'op' },
		{ label: '7', action: () => inputDigit('7') },
		{ label: '8', action: () => inputDigit('8') },
		{ label: '9', action: () => inputDigit('9') },
		{ label: '×', action: () => handleOperator('×'), class: 'op' },
		{ label: '4', action: () => inputDigit('4') },
		{ label: '5', action: () => inputDigit('5') },
		{ label: '6', action: () => inputDigit('6') },
		{ label: '−', action: () => handleOperator('−'), class: 'op' },
		{ label: '1', action: () => inputDigit('1') },
		{ label: '2', action: () => inputDigit('2') },
		{ label: '3', action: () => inputDigit('3') },
		{ label: '+', action: () => handleOperator('+'), class: 'op' },
		{ label: '0', action: () => inputDigit('0'), class: 'zero' },
		{ label: '.', action: inputDecimal },
		{ label: '=', action: handleEquals, class: 'op' },
	];
</script>

<style>
	.calculator {
		display: flex;
		flex-direction: column;
		height: 100%;
		user-select: none;
		container-type: size;
		outline: none;
	}

	.display {
		padding: 16px 20px 12px;
		text-align: right;
		background: rgba(0, 0, 0, 0.3);
	}

	.expression {
		font-size: 3cqi;
		color: var(--color-text-dim);
		height: 4cqi;
	}

	.value {
		font-size: 9cqi;
		font-variant-numeric: tabular-nums;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.buttons {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		flex: 1;
		background: rgba(0, 0, 0, 0.2);
	}

	.btn {
		background: var(--color-surface-2);
		color: var(--color-text);
		font-size: 5cqi;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.1s;
		height: 100%;
	}

	.btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.btn:active {
		background: rgba(255, 255, 255, 0.2);
	}

	.btn.fn {
		background: var(--color-surface);
		color: var(--color-text-dim);
	}

	.btn.op {
		background: var(--color-accent);
		color: #000;
		font-weight: bold;
	}

	.btn.op:hover {
		background: #ffc800;
	}
</style>

<div class="calculator" tabindex="-1" onkeydown={handleKeydown} role="grid" aria-label="Calculator">
	<div class="display">
		<div class="expression">{lastExpression}</div>
		<div class="value">{display}</div>
	</div>
	<div class="buttons">
		{#each buttons as btn}
			<Clickable onclick={btn.action} style={btn.class === 'zero' ? 'grid-column: span 2' : undefined}>
				<div class="btn" class:fn={btn.class === 'fn'} class:op={btn.class === 'op'}>{btn.label}</div>
			</Clickable>
		{/each}
	</div>
</div>
