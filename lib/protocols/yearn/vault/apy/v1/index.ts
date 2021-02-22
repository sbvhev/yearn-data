import { Context } from "lib/data/context";
import { Apy } from "lib/protocols/common/apy";
import * as curve from "lib/protocols/curve";

import { VaultV1 } from "../../interfaces";
import { calculateSimple } from "./simple";

export async function calculate(vault: VaultV1, ctx: Context): Promise<Apy> {
  const vaultTokenAddress = vault.token.address;
  const isCurveVault = await curve.hasCurvePool(vaultTokenAddress, ctx);

  if (isCurveVault) {
    return await curve.calculateApy(vaultTokenAddress, ctx);
  }
  return await calculateSimple(vault, ctx);
}

export { calculateSimple };
