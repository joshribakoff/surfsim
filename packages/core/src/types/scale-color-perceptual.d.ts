declare module 'scale-color-perceptual/viridis' {
  /**
   * Maps a value in [0, 1] to a hex color string from the Viridis colormap.
   * 0 = dark purple, 1 = bright yellow
   */
  export default function viridis(t: number): string;
}

declare module 'scale-color-perceptual/magma' {
  export default function magma(t: number): string;
}

declare module 'scale-color-perceptual/inferno' {
  export default function inferno(t: number): string;
}

declare module 'scale-color-perceptual/plasma' {
  export default function plasma(t: number): string;
}
