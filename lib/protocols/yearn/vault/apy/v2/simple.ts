import { VaultV2Contract__factory } from "lib/contracts/index";
import { Context } from "lib/data/context";
import { Apy, calculateFromPps } from "lib/protocols/common/apy";
import { Block, createTimedBlock, estimateBlockPrecise } from "lib/utils/block";
import { seconds } from "lib/utils/time";

import { VaultV2 } from "../../interfaces";
import { fetchHarvestCalls } from "../../reader";

function findNearestBlock(needle: Block, haystack: Block[]) {
  return haystack.reduce((a, b) =>
    Math.abs(b - needle) < Math.abs(a - needle) ? b : a
  );
}

export async function calculateSimple(
  vault: VaultV2,
  ctx: Context
): Promise<Apy> {
  const contract = VaultV2Contract__factory.connect(
    vault.address,
    ctx.provider
  );
  const harvests = await fetchHarvestCalls(vault, ctx);
  if (harvests.length < 2) {
    return {
      recommended: 0,
      composite: false,
      type: "error",
      description: "no harvests",
      data: { oneMonthSample: null, inceptionSample: null },
    };
  }
  const latest = await createTimedBlock(harvests[harvests.length - 1], ctx);
  const inception = await createTimedBlock(harvests[0], ctx);
  const oneMonth = await estimateBlockPrecise(
    latest.timestamp - seconds("4 weeks"),
    ctx
  );
  const oneMonthHarvest = findNearestBlock(oneMonth, harvests);
  const data = await calculateFromPps(
    latest.block,
    inception.block,
    { oneMonthSample: oneMonthHarvest, inceptionSample: inception.block },
    contract.pricePerShare
  );
  const apy = {
    recommended: data.oneMonthSample || 0,
    composite: false,
    type: "pricePerShareV2OneMonth",
    description: "Price per share - One month sample",
    data,
  };
  return apy;
}
