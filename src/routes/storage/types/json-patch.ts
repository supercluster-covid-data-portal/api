interface Patch {
  path: string;
}

interface AddPatch extends Patch {
  op: 'add';
  value: any;
}

interface CopyPatch extends Patch {
  op: 'copy';
  from: string;
}

interface MovePatch extends Patch {
  op: 'move';
  from: string;
}

interface RemovePatch extends Patch {
  op: 'remove';
}

interface ReplacePatch extends Patch {
  op: 'replace';
  value: any;
}

interface TestPatch extends Patch {
  op: 'test';
  value: any;
}

export type PatchInstruction =
  | AddPatch
  | RemovePatch
  | ReplacePatch
  | MovePatch
  | CopyPatch
  | TestPatch;

export class JSONPatchError extends Error {}
export class InvalidPointerError extends Error {}
export class InvalidPatchError extends JSONPatchError {}
export class PatchConflictError extends JSONPatchError {}
export class PatchTestFailed extends Error {}
