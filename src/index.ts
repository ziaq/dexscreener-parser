import { setFatalErrorHandlers } from './base-utils/setFatalErrorHandlers';
import { listenDexscreenerTrending } from './core/listenDexscreenerTrending';

setFatalErrorHandlers();
listenDexscreenerTrending();

// Attention !
// This microservice only works when run on Windows. On Windows, it requires the installation of Autohotkey, 
// which is needed to run the cloudflare-bypass-script.ahk (it runs automatically during execution)