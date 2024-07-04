import { setFatalErrorHandlers } from './base-utils/set-fatal-error-handlers';
import { listenDexscreenerTrending } from './core/listen-dexscreener-trending';

setFatalErrorHandlers();
listenDexscreenerTrending();

// Attention !
// This microservice only works when run on Windows. On Windows, it requires the installation of Autohotkey, 
// which is needed to run the cloudflare-bypass-script.ahk (it runs automatically during execution)

// Attention 2 !
// To run Autohotkey on a VPS, you need to connect not through RDP but via TightVNC