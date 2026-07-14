export interface FileIdentity {
  uid: number;
  groups: Set<number>;
}

export interface FileModeStats {
  uid: number;
  gid: number;
  mode: number;
}

export function inspectModeForIdentity(
  stats: FileModeStats,
  identity: FileIdentity,
): {
  readable: boolean;
  writable: boolean;
  executable: boolean;
};
