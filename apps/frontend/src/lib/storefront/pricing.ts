export type VariantPriceLike = {
  listAmount: number;
  saleAmount: number | null;
  promotionalAmount: number | null;
  promotionalStartsAt: Date | null;
  promotionalEndsAt: Date | null;
};

export function computeDisplayPrice(
  price: VariantPriceLike | null | undefined,
  now: Date = new Date(),
): { price: number; originalPrice?: number; discount?: number } {
  if (!price) return { price: 0 };

  const promoActive =
    price.promotionalAmount !== null &&
    price.promotionalAmount > 0 &&
    (!price.promotionalStartsAt || price.promotionalStartsAt <= now) &&
    (!price.promotionalEndsAt || price.promotionalEndsAt >= now);

  const base = price.saleAmount ?? price.listAmount;
  const effective = promoActive ? price.promotionalAmount! : base;

  let originalPrice: number | undefined;
  if (promoActive && base !== effective) {
    originalPrice = base;
  } else if (!promoActive && price.saleAmount !== null && price.saleAmount < price.listAmount) {
    originalPrice = price.listAmount;
  }

  const discount =
    originalPrice !== undefined && originalPrice > effective
      ? Math.round(((originalPrice - effective) / originalPrice) * 100)
      : undefined;

  return {
    price: effective,
    originalPrice: originalPrice && originalPrice > effective ? originalPrice : undefined,
    discount: discount && discount > 0 ? discount : undefined,
  };
}