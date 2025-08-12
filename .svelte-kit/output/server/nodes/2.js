import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.DNsoGzLX.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/BAwcUvDs.js","_app/immutable/chunks/DM8_hwOS.js","_app/immutable/chunks/CM00UAAG.js","_app/immutable/chunks/BrpL4lDg.js","_app/immutable/chunks/DOZk1u3L.js"];
export const stylesheets = ["_app/immutable/assets/2.BnGwteac.css"];
export const fonts = [];
