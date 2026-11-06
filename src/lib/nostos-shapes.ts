// Nostos: the seven star shapes, one per theme, drawn at radius 1 (in a -1.5 -1.5 3 3 box). The map
// draws its stars with them; a lesson's connection cards carry the same marks.
const ring = (points: number, outer: number, inner: number) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    return `${(Math.cos(a) * r).toFixed(3)},${(Math.sin(a) * r).toFixed(3)}`;
  }).join(' ');

export const starShapes: Record<string, string> = {
  path: '<circle r="1" fill="currentColor"/>',
  soul: '<path d="M0-1.42Q.2-.2 1.42 0Q.2.2 0 1.42Q-.2.2-1.42 0Q-.2-.2 0-1.42Z" fill="currentColor"/>',
  ethics: `<polygon points="${ring(8, 1.3, 0.66)}" fill="currentColor"/>`,
  cosmos: '<circle r=".68" fill="currentColor"/><circle r="1.08" fill="none" stroke="currentColor" stroke-width=".18"/>',
  ways: '<path d="M0-1.36L1.02 0 0 1.36-1.02 0Z" fill="currentColor"/>',
  thinkers: '<path d="M-.34-1.2H.34V-.34H1.2V.34H.34V1.2H-.34V.34H-1.2V-.34H-.34Z" fill="currentColor"/>',
  gods: `<polygon points="${ring(6, 1.34, 0.52)}" fill="currentColor"/>`,
};
