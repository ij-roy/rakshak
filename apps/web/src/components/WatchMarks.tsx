import type { GuardianId, MapId } from '@rakshak/game-data';

export function GuardianMark({ id }: { id: GuardianId }) {
  return (
    <svg className="watch-mark" viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" fill="#141624" />
      {id === 'asha' ? (
        <>
          <path d="M34 78 L48 28 L62 78 Z" fill="#343A73" />
          <circle cx="48" cy="22" r="8" fill="#E5D2A6" />
          <path d="M58 40 L78 48 L78 70 L68 80 L58 70 Z" fill="#58A6B3" />
        </>
      ) : null}
      {id === 'veer' ? (
        <>
          <path d="M40 80 L48 30 L56 80 Z" fill="#343A73" />
          <circle cx="48" cy="24" r="8" fill="#E5D2A6" />
          <path d="M22 58 Q 48 18 74 58" fill="none" stroke="#C28A2C" strokeWidth="4" />
          <path d="M48 34 L48 70" stroke="#C28A2C" strokeWidth="3" />
        </>
      ) : null}
      {id === 'tara' ? (
        <>
          <path d="M36 80 L48 36 L60 80 Z" fill="#343A73" />
          <circle cx="48" cy="28" r="8" fill="#E5D2A6" />
          <circle cx="68" cy="58" r="14" fill="#D65332" />
          <circle cx="68" cy="54" r="6" fill="#E5D2A6" />
        </>
      ) : null}
      {id === 'nila' ? (
        <>
          <path d="M38 80 L48 32 L58 80 Z" fill="#343A73" />
          <circle cx="48" cy="24" r="8" fill="#E5D2A6" />
          <circle cx="70" cy="56" r="14" fill="none" stroke="#58A6B3" strokeWidth="4" />
          <circle cx="70" cy="56" r="4" fill="#58A6B3" />
        </>
      ) : null}
    </svg>
  );
}

export function MapMark({ id }: { id: MapId }) {
  return (
    <svg className="watch-mark" viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" fill="#0B0C14" />
      {id === 'gaon' ? (
        <>
          <path d="M0 62 H96 V96 H0 Z" fill="#141624" />
          <rect x="18" y="48" width="22" height="18" fill="#191B2B" />
          <rect x="62" y="28" width="4" height="40" fill="#C28A2C" />
          <circle cx="64" cy="24" r="8" fill="#D65332" />
        </>
      ) : null}
      {id === 'van' ? (
        <>
          <path d="M0 70 H96 V96 H0 Z" fill="#141624" />
          <path d="M20 70 L34 28 L48 70 Z" fill="#5F9D62" />
          <path d="M46 70 L62 22 L78 70 Z" fill="#343A73" />
        </>
      ) : null}
      {id === 'marusthal' ? (
        <>
          <path d="M0 58 Q 30 40 48 58 T 96 52 V96 H0 Z" fill="#C28A2C" opacity="0.35" />
          <path d="M8 40 H88" stroke="#58A6B3" strokeWidth="3" />
          <path d="M8 52 H88" stroke="#58A6B3" strokeWidth="3" />
        </>
      ) : null}
      {id === 'durg' ? (
        <>
          <path d="M0 72 H96 V96 H0 Z" fill="#141624" />
          <rect x="20" y="24" width="10" height="52" fill="#343A73" />
          <rect x="66" y="24" width="10" height="52" fill="#343A73" />
          <rect x="30" y="40" width="36" height="8" fill="#C28A2C" />
        </>
      ) : null}
    </svg>
  );
}
