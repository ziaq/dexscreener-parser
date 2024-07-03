import { setFatalErrorHandlers } from '@/base-utils/setFatalErrorHandlers';
import { listenDexscreenerTrending } from '@/core/listenDexscreenerTrending';

setFatalErrorHandlers();
listenDexscreenerTrending();