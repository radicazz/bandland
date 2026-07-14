export function inspectModeForIdentity(stats, identity) {
  if (identity.uid === 0) {
    return { readable: true, writable: true, executable: true };
  }

  const shift = stats.uid === identity.uid ? 6 : identity.groups.has(stats.gid) ? 3 : 0;
  const permissions = (stats.mode >> shift) & 0b111;

  return {
    readable: Boolean(permissions & 0b100),
    writable: Boolean(permissions & 0b010),
    executable: Boolean(permissions & 0b001),
  };
}
