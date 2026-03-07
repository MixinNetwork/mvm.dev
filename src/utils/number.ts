import BigNumber from "bignumber.js";

export const add = (
  a: string | number | BigNumber,
  b: string | number | BigNumber,
) => {
  const ba = BigNumber.isBigNumber(a) ? a : BigNumber(a);
  const bb = BigNumber.isBigNumber(b) ? b : BigNumber(b);
  return ba.plus(bb);
};

export const mul = (a: string | number | BigNumber, b: string | number | BigNumber) => {
  const ba = BigNumber.isBigNumber(a) ? a : BigNumber(a);
  const bb = BigNumber.isBigNumber(b) ? b : BigNumber(b);
  return ba.multipliedBy(bb);
};

export const gt = (
  a: string | number | BigNumber,
  b: string | number | BigNumber,
) => {
  const ba = BigNumber.isBigNumber(a) ? a : BigNumber(a);
  const bb = BigNumber.isBigNumber(b) ? b : BigNumber(b);
  return ba.gt(bb);
};
