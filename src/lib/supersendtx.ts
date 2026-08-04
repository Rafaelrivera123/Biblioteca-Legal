import { SuperSendTX } from "supersendtx";

export const supersendtx = new SuperSendTX(
  process.env.SUPERSENDTX_API_KEY ?? ""
);
