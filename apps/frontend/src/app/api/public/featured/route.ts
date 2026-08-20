import { NextResponse } from 'next/server';
import { getTenantId } from '@lib/auth/tenant';
import { listFeaturedProducts } from '@lib/products/featured';

export async function GET() {
  const items = await listFeaturedProducts(getTenantId());
  return NextResponse.json({ items });
}