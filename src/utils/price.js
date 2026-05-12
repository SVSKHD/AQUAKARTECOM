// priceUtils.ts

const GST_RATE = 0.18;
const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const priceUtils = {
  getBasePrice(price) {
    return roundToTwo((Number(price) || 0) / (1 + GST_RATE));
  },

  getGSTValue(price) {
    const basePrice = this.getBasePrice(price);
    return roundToTwo((Number(price) || 0) - basePrice);
  },
};
export default priceUtils;
