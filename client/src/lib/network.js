const activeNetwork = process.env.MENU_ACTIVE || "";

export const isBitcoinNetwork = activeNetwork
  .toLowerCase()
  .startsWith("bitcoin");
