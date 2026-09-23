export type AssetKind =
  | 'sprite'
  | 'atlas'
  | 'audio'
  | 'font'
  | 'ui'
  | 'procedural';

export type LicenseStatus = 'approved' | 'unverified' | 'rejected';

export interface AssetLicenseRecord {
  readonly status: LicenseStatus;
  readonly creator: string;
  readonly license: string;
  readonly sourceUrl: string;
  readonly attribution: string;
  readonly reviewer: string;
  readonly notes?: string;
}

export interface AssetRecord {
  readonly id: string;
  readonly kind: AssetKind;
  readonly path: string;
  readonly width?: number;
  readonly height?: number;
  readonly preloadGroup: 'boot' | 'gameplay' | 'ui' | 'map' | 'audio';
  readonly contentHash: string;
  readonly license: AssetLicenseRecord;
}

export interface AssetManifest {
  readonly version: string;
  readonly generatedAt: string;
  readonly assets: readonly AssetRecord[];
}

export function assertAllApproved(manifest: AssetManifest): void {
  for (const asset of manifest.assets) {
    if (asset.license.status !== 'approved') {
      throw new Error(`Asset ${asset.id} is not approved (${asset.license.status})`);
    }
  }
}
