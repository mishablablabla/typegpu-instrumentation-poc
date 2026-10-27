// the app plus a static import of the tap that is never called (what a non-user's bundle would look like if the import stayed)
import { tapDevice } from '../src/deviceTap.ts';
import './app.ts';
void tapDevice;
