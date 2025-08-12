export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "trans-model-leg/_app",
	assets: new Set([".DS_Store",".nojekyll","ai2html-config.json","ai2html-output/trans_map-full.png","ai2html-output/trans_map-medium.png","ai2html-output/trans_map-mobile.png","ai2html-output/trans_map.html","ak_safe.html","doc.txt","favicon.svg","fiwsa_bills_updated.csv","mi_safe.hmtl.html","mi_safe.html","montana_act.html","montana_act.txt","original_act.html","original_act.txt","safe_act.csv","sc_safe.html","trans_map.ai"]),
	mimeTypes: {".json":"application/json",".png":"image/png",".html":"text/html",".txt":"text/plain",".svg":"image/svg+xml",".csv":"text/csv",".ai":"application/postscript"},
	_: {
		client: {start:"_app/immutable/entry/start.TIPe-Feb.js",app:"_app/immutable/entry/app.D-xADf3C.js",imports:["_app/immutable/entry/start.TIPe-Feb.js","_app/immutable/chunks/Cj46NoHP.js","_app/immutable/chunks/CM00UAAG.js","_app/immutable/chunks/DM8_hwOS.js","_app/immutable/chunks/DOZk1u3L.js","_app/immutable/entry/app.D-xADf3C.js","_app/immutable/chunks/DM8_hwOS.js","_app/immutable/chunks/CM00UAAG.js","_app/immutable/chunks/NZTpNUN0.js","_app/immutable/chunks/BrpL4lDg.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/trans-model-leg/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
