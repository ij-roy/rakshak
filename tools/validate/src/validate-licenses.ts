import { ASSET_MANIFEST, assertAllApproved } from '@rakshak/assets';

assertAllApproved(ASSET_MANIFEST);
console.log(`Assets OK (${ASSET_MANIFEST.assets.length} approved procedural records)`);
