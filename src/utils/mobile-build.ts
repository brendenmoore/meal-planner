// Single reader for the dual-build matrix flag (ADR-0001).
// `npm run build:mobile` sets MOBILE_BUILD=1; next.config.ts bridges it into
// the bundle as NEXT_PUBLIC_MOBILE_BUILD because client bundles only inline
// NEXT_PUBLIC_* vars (a bare MOBILE_BUILD read is always false in the
// browser). App code branches on this helper instead of reading raw env vars,
// so the flag has one definition site. (next.config.ts still reads
// process.env directly — config runs in plain node, outside the bundle.)
export function isMobileBuild(): boolean {
  return (
    process.env.MOBILE_BUILD === "1" ||
    process.env.NEXT_PUBLIC_MOBILE_BUILD === "1"
  );
}
