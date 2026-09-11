// Single reader for the dual-build matrix flag (ADR-0001).
// `npm run build:mobile` sets MOBILE_BUILD=1; app code branches on this
// helper instead of reading the raw env var, so the flag has one definition
// site. (next.config.ts still reads process.env directly — config runs in
// plain node, outside the bundle.)
export function isMobileBuild(): boolean {
  return process.env.MOBILE_BUILD === "1";
}
