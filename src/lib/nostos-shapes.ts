// Nostos: the seven star marks, one per theme, drawn at radius about 1.3 (in a -1.5 -1.5 3 3 box). The
// map draws its stars with them; a lesson's connection cards carry the same marks.
// Simple shapes in the site's own language (client direction, 9 and 10 November 2026: marks drawn
// from the site rather than plain geometric stars, but kept simple; an owl, a boat, a lyre and a
// rayed sun were tried and dropped):
//   the path: an arch, the site's doorway · soul and mind: the butterfly, ψυχή · the good life: an
//   olive sprig · cosmos and the One: the monad, a point in a circle · ways of knowing: a flame ·
//   thinkers: the four-point star of the site's drawings, the lights we steer by · gods and myths: a
//   crescent moon.

const leaf = (cx: number, cy: number, angle: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx=".4" ry=".155" transform="rotate(${angle} ${cx} ${cy})"/>`;

export const starShapes: Record<string, string> = {
  // an arch, like the doorways and windows of the site
  path: '<path d="M-.95 1.25V-.2A.95.95 0 0 1 .95-.2V1.25Z" fill="currentColor"/>',
  // the butterfly (ψυχή is also the word for it): four wings and a body
  soul:
    '<g fill="currentColor"><path d="M-.04-.12C-.36-1.24-1.46-1.2-1.26-.34C-1.14.06-.52.1-.04-.02Z"/>' +
    '<path d="M.04-.12C.36-1.24 1.46-1.2 1.26-.34C1.14.06.52.1.04-.02Z"/>' +
    '<path d="M-.04.06C-.46.16-1.06.46-.86 1C-.66 1.34-.16.9-.04.32Z"/>' +
    '<path d="M.04.06C.46.16 1.06.46.86 1C.66 1.34.16.9.04.32Z"/>' +
    '<ellipse cy=".08" rx=".1" ry=".62"/></g>' +
    '<path d="M-.05-.5Q-.22-.98-.46-1.1M.05-.5Q.22-.98.46-1.1" fill="none" stroke="currentColor" stroke-width=".08" stroke-linecap="round"/>',
  // an olive sprig: a stem, three pairs of leaves and one at the tip, and an olive
  ethics:
    '<path d="M0 1.36Q.12.2 0-1" fill="none" stroke="currentColor" stroke-width=".13" stroke-linecap="round"/>' +
    `<g fill="currentColor">${leaf(-0.3, 0.55, 45)}${leaf(0.3, 0.55, -45)}${leaf(-0.3, 0, 45)}${leaf(0.3, 0, -45)}` +
    `${leaf(-0.3, -0.55, 45)}${leaf(0.3, -0.55, -45)}${leaf(0, -1.02, 90)}<circle cx=".52" cy=".98" r=".17"/></g>`,
  // the monad: a point in a circle
  cosmos: '<circle r=".36" fill="currentColor"/><circle r=".98" fill="none" stroke="currentColor" stroke-width=".22"/>',
  // a flame, with the lick of its heart cut out of it
  ways:
    '<path fill="currentColor" fill-rule="evenodd" d="M0-1.4C.55-.7.95-.25.9.35C.85 1 .4 1.3 0 1.3C-.4 1.3-.85 1-.9.35C-.95-.25-.55-.7 0-1.4Z' +
    'M0-.2C.25.15.45.4.4.7C.35 1 .15 1.05 0 1.05C-.15 1.05-.35 1-.4.7C-.45.4-.25.15 0-.2Z"/>',
  // the four-point star of the site's drawings
  thinkers: '<path d="M0-1.42Q.2-.2 1.42 0Q.2.2 0 1.42Q-.2.2-1.42 0Q-.2-.2 0-1.42Z" fill="currentColor"/>',
  // a crescent moon
  gods: '<path d="M.8-1.2A1.25 1.25 0 1 0 .8 1.2A1.6 1.6 0 0 1 .8-1.2Z" fill="currentColor"/>',
};
