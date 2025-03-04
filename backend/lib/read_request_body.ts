import { type IncomingMessage } from "node:http";

export async function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let bodyChunks: Buffer[] = [];

    req
      .on('data', (chunk: Buffer) => bodyChunks.push(chunk))
      .on('error', (err) => reject(err))
      .on('end', () => {
        resolve(Buffer.concat(bodyChunks).toString())
      })
  });
}
