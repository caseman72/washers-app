import sharp from 'sharp';
import { readFileSync } from 'fs';

const sizes = [
  { size: 32, name: 'favicon-32.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

const svgBuffer = readFileSync('./washer-icon.svg');

console.log('Generating favicon files...\n');

for (const { size, name } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`./public/${name}`);

  console.log(`✓ Generated ${name} (${size}x${size})`);
}

console.log('\n✅ All favicon files generated successfully!');
