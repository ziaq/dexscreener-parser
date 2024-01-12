const setFatalErrorHandlers = require('./base-utils/setFatalErrorHandlers');
const listenDexscreenerTrending = require('./core/listenDexscreenerTrending');

setFatalErrorHandlers();

listenDexscreenerTrending();