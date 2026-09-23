import { assertLaunchContentComplete, CONTENT_COUNTS } from '@rakshak/game-data';
import { CONTENT_VERSION, GAME_VERSION, SCHEMA_VERSION } from '@rakshak/shared';

assertLaunchContentComplete();
console.log('Content OK', CONTENT_COUNTS);
console.log(`game=${GAME_VERSION} content=${CONTENT_VERSION} schema=${SCHEMA_VERSION}`);
