import { GIFEncoder, applyPalette, quantize, type GifPalette } from "gifenc";

type GifWorkerRequest = {
  delayMs: number;
  first: boolean;
  height: number;
  palette?: GifPalette;
  rgba: ArrayBuffer;
  type: "encode-frame";
  width: number;
};

type GifWorkerResponse =
  | { bytes: ArrayBuffer; palette?: GifPalette; type: "frame-complete" }
  | { message: string; type: "error" };

const paletteFormat = "rgb444";
const paletteColorCount = 32;

function encodeFrame(request: GifWorkerRequest): {
  bytes: ArrayBuffer;
  palette: GifPalette;
} {
  const rgba = new Uint8ClampedArray(request.rgba);
  const palette = request.palette ?? quantize(rgba, paletteColorCount, {
    format: paletteFormat,
  });
  const indexedFrame = applyPalette(rgba, palette, paletteFormat);
  const colorDepth = Math.max(2, Math.ceil(Math.log2(palette.length)));
  const encoder = GIFEncoder({ auto: request.first });
  encoder.writeFrame(indexedFrame, request.width, request.height, {
    colorDepth,
    delay: request.delayMs,
    palette: request.first ? palette : undefined,
    repeat: 0,
  });
  const bytes = encoder.bytes();
  const output = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  return { bytes: output, palette };
}

function postResponse(response: GifWorkerResponse, transfer: Transferable[] = []): void {
  self.postMessage(response, { transfer });
}

self.addEventListener("message", (event: MessageEvent<GifWorkerRequest>) => {
  try {
    const result = encodeFrame(event.data);
    postResponse(
      {
        bytes: result.bytes,
        palette: event.data.first ? result.palette : undefined,
        type: "frame-complete",
      },
      [result.bytes],
    );
  } catch (error) {
    postResponse({
      message: error instanceof Error ? error.message : "GIF encoding failed.",
      type: "error",
    });
  }
});
