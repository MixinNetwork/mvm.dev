import { base64RawURLEncode } from "@mixin.dev/mixin-node-sdk";
import { parse } from "uuid";

export const OperationTypeAddUser = 1;

export const buildComputerExtra = (operation: number, extra: Buffer) => Buffer.concat([
  Buffer.from([operation]),
  extra,
]);

export const encodeMtgExtra = (app_id: string, extra: Buffer) => {
  const data = Buffer.concat([
    parse(app_id),
    extra,
  ]);
  return base64RawURLEncode(data)
};