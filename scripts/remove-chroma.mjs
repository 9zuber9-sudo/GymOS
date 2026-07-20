import sharp from "sharp";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error("Usage: node scripts/remove-chroma.mjs <input> <output>");
  process.exit(1);
}

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
const connected = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function isKeyPixel(pixel) {
  const index = pixel * 4;
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  return green > 120 && green - Math.max(red, blue) > 20;
}

function enqueue(pixel) {
  if (connected[pixel] || !isKeyPixel(pixel)) return;
  connected[pixel] = 1;
  queue[tail++] = pixel;
}

for (let x = 0; x < info.width; x += 1) {
  enqueue(x);
  enqueue((info.height - 1) * info.width + x);
}
for (let y = 0; y < info.height; y += 1) {
  enqueue(y * info.width);
  enqueue(y * info.width + info.width - 1);
}

while (head < tail) {
  const pixel = queue[head++];
  const x = pixel % info.width;
  const y = Math.floor(pixel / info.width);
  if (x > 0) enqueue(pixel - 1);
  if (x + 1 < info.width) enqueue(pixel + 1);
  if (y > 0) enqueue(pixel - info.width);
  if (y + 1 < info.height) enqueue(pixel + info.width);
}

for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  if (!connected[pixel]) continue;
  const index = pixel * 4;
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const dominance = green - Math.max(red, blue);

  if (green > 150 && dominance > 28) {
    const greenStrength = Math.min(1, Math.max(0, (green - 150) / 80));
    const dominanceStrength = Math.min(1, Math.max(0, (dominance - 28) / 90));
    const removal = greenStrength * dominanceStrength;
    data[index + 3] = Math.round(255 * (1 - removal));
    data[index + 1] = Math.min(
      green,
      Math.max(red, blue) + Math.round(28 * (1 - removal)),
    );
  }
}

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .resize(512, 512, { fit: "inside" })
  .png({ compressionLevel: 9 })
  .toFile(output);
