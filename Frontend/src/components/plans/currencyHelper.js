// src/components/plans/currencyHelper.js
import cc from "currency-codes";

const currencyMap = {};
cc.data.forEach((c) => {
  currencyMap[c.code] = `${c.code} – ${c.currency}`;
});
export const getCurrencyOptions = () => Object.entries(currencyMap);