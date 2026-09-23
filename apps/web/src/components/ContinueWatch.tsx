'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatCheckpointTime, type RunCheckpointV1 } from '@rakshak/game-core';
import { readRunCheckpointSync } from '../lib/runCheckpoint';

export function ContinueWatch() {
  const [checkpoint, setCheckpoint] = useState<RunCheckpointV1 | null>(null);

  useEffect(() => {
    setCheckpoint(readRunCheckpointSync());
  }, []);

  if (!checkpoint) return null;

  return (
    <Link
      href={`/play?continue=1&guardian=${checkpoint.guardianId}&map=${checkpoint.mapId}`}
      className="nav-link primary home-continue"
    >
      Continue {checkpoint.mapId} · {formatCheckpointTime(checkpoint.tick)}
    </Link>
  );
}
