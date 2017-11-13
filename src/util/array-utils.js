export function ensureArray (x) {
  return x == null ? [] : Array.isArray(x) ? x : [x]
}

export function undoEnsureArray (x) {
  return x != null && x.length === 1 ? x[0] : x
}
