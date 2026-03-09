import type { RgbColor, HslColor } from './types/pixelart';

export function hexToRgb(hex: string): RgbColor {
	const n = parseInt(hex.slice(1), 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
	return (
		'#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
	);
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function formatColor(
	mode: 'rgb' | 'hsl',
	rgb: RgbColor,
	hsl: HslColor,
	alpha: number
): string {
	if (mode === 'hsl') {
		return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
	}
	return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Resolve any CSS color string to rgb()/rgba() via a temporary DOM element. */
export function colorToRgba(color: string): string {
	const tmp = document.createElement('div');
	tmp.style.color = color;
	document.body.appendChild(tmp);
	const computed = getComputedStyle(tmp).color;
	document.body.removeChild(tmp);
	const m = computed.match(/[\d.]+/g);
	if (m) {
		const a = m[3] !== undefined ? parseFloat(m[3]) : 1;
		if (a < 1) return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${a})`;
		return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
	}
	return color;
}
