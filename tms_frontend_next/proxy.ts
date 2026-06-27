import { NextRequest, NextResponse } from 'next/server';

// `request` is intentionally unused; proxy is a pass-through.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}
