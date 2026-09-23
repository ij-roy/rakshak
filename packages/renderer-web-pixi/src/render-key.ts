/** Pool ids stay below this. A larger id would share a node with the next kind. */
const ID_STRIDE = 1_048_576;

const extraKind = new Map<string, number>();
let nextExtra = 10;

function codeFor(kind: string): number {
  switch (kind) {
    case 'player':
      return 1;
    case 'enemy':
      return 2;
    case 'elite':
      return 3;
    case 'boss':
      return 4;
    case 'projectile':
      return 5;
    case 'pickup':
      return 6;
    case 'particle':
      return 7;
    case 'damage_label':
      return 8;
    case 'telegraph':
      return 9;
    default: {
      let code = extraKind.get(kind);
      if (code === undefined) {
        code = nextExtra;
        nextExtra += 1;
        extraKind.set(kind, code);
      }
      return code;
    }
  }
}

/** Pool-local ids restart at 1 for every kind. The node id includes the kind without building a string. */
export function renderNodeId(kind: string, id: number): number {
  return codeFor(kind) * ID_STRIDE + id;
}
