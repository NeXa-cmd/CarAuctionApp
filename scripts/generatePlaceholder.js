const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 400x300 canvas
const canvas = createCanvas(400, 300);
const ctx = canvas.getContext('2d');

// Fill background
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, 400, 300);

// Draw car placeholder text
ctx.fillStyle = '#999999';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Car Image', 200, 150);

// Save the image
const buffer = canvas.toBuffer('image/jpeg');
fs.writeFileSync('../src/assets/car-placeholder.jpg', buffer);
