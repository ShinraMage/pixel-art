export type ColorMode = 'rgb' | 'hsl';

export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

export interface HslColor {
	h: number;
	s: number;
	l: number;
}

export interface PixelGrid {
	cols: number;
	rows: number;
	cells: string[]; // flat array of color strings, length = cols * rows
}

export const BLANK = 'rgba(0,0,0,0)';
