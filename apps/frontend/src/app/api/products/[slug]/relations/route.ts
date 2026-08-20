import { NextResponse } from 'next/server';
import { getTenantId } from '@lib/auth/tenant';
import { getProductRelationsForPdp } from '@lib/products/relations';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getProductRelationsForPdp(getTenantId(), slug);
  return NextResponse.json(result);
}