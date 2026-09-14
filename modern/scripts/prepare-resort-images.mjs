import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve("public/pics");
const outputDirectory = path.resolve("public/resort");

await mkdir(outputDirectory, { recursive: true });

const assets = [
  {
    source: "4bhk.jpeg",
    output: "hero-pool-night.webp",
    width: 2400,
    height: 1500,
    position: "centre",
    brightness: 1.08,
    saturation: 1.08,
  },
  {
    source: "5bhk.jpeg",
    output: "villa-cobalt.webp",
    width: 1600,
    height: 1900,
    position: "centre",
    brightness: 1.02,
    saturation: 1.04,
  },
  {
    source: "DSCN2471.JPG",
    output: "pool-courtyard-day.webp",
    width: 2200,
    height: 1500,
    position: "centre",
    brightness: 1.03,
    saturation: 1.04,
  },
  {
    source: "WhatsApp Image 2022-03-01 at 9.52.45 PM.jpeg",
    output: "pool-aerial.webp",
    width: 1600,
    height: 1200,
    position: "centre",
    brightness: 1.03,
    saturation: 1.05,
  },
  {
    source: "WhatsApp Image 2024-11-10 at 19.30.14_cb506012.jpg",
    output: "suite-bedroom.webp",
    width: 900,
    height: 1200,
    position: "centre",
    brightness: 1.04,
    saturation: 0.96,
  },
  {
    source: "WhatsApp Image 2024-11-10 at 19.30.30_68190249.jpg",
    output: "suite-living.webp",
    width: 1400,
    height: 900,
    position: "centre",
    brightness: 1.03,
    saturation: 0.96,
  },
  {
    source: "WhatsApp Image 2023-11-14 at 10.04.07 PM.jpeg",
    output: "villa-arrival.webp",
    width: 1600,
    height: 1200,
    position: "centre",
    brightness: 1.03,
    saturation: 1.03,
  },
];

for (const asset of assets) {
  await sharp(path.join(sourceDirectory, asset.source))
    .rotate()
    .resize(asset.width, asset.height, {
      fit: "cover",
      position: asset.position,
      withoutEnlargement: false,
    })
    .modulate({
      brightness: asset.brightness,
      saturation: asset.saturation,
    })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.5 })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(path.join(outputDirectory, asset.output));
}

console.log(`Prepared ${assets.length} resort images in ${outputDirectory}`);
