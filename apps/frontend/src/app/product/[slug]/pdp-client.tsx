'use client';

import { Section, Container } from '@components/layout';
import {
  ProductBreadcrumbs,
  ProductGallery,
  ProductInfo,
  ProductPrice,
  ProductVariants,
  PurchaseBox,
  ProductShipping,
  TechnicalSpecs,
  ProductDescription,
  ProductReviews,
  ProductQuestions,
  ProductRelations,
  StickyBuyBox,
} from '@components/product';
import type { PDPProduct } from '@components/product';

type PDPClientProps = {
  product: PDPProduct;
};

export function PDPClient({ product }: PDPClientProps) {
  return (
    <>
      <Section spacing="md">
        <Container>
          <ProductBreadcrumbs product={product} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mt-2">
            <ProductGallery product={product} />

            <div className="space-y-6">
              <ProductInfo product={product} />
              <ProductPrice product={product} />
              <ProductVariants product={product} />
              <hr className="border-border" />
              <PurchaseBox product={product} />
              <ProductShipping product={product} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-12 lg:mt-16">
            <ProductDescription product={product} />
            <TechnicalSpecs product={product} />
          </div>

          <div className="mt-12 lg:mt-16 space-y-12 lg:space-y-16">
            <ProductReviews product={product} />
            <ProductQuestions product={product} />
            <ProductRelations product={product} />
          </div>
        </Container>
      </Section>

      <StickyBuyBox product={product} />
    </>
  );
}
