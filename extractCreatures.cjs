// Script to extract creatures data from legacy controller.js
// Run with: node extractCreatures.cjs > src/data/creatures.json

const fs = require('fs');
const content = fs.readFileSync('../controller.js', 'utf8');

// Find the creatures object - look for the closing brace more carefully
const startMatch = content.indexOf('$scope.creatures={');
if (startMatch === -1) {
  console.error('Could not find creatures data start');
  process.exit(1);
}

// Find the corresponding end by counting braces
let braceCount = 0;
let endIdx = startMatch;
let started = false;
for (let i = startMatch; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
    started = true;
  } else if (content[i] === '}') {
    braceCount--;
    if (started && braceCount === 0) {
      endIdx = i;
      break;
    }
  }
}

const creaturesStr = content.substring(startMatch + 17, endIdx);
const creatures = {};

// Split by creature entries (name followed by colon and opening brace)
const creatureBlocks = creaturesStr.split(/\n\t\t(?=\w+:|".+?":)/);

for (const block of creatureBlocks) {
  if (!block.trim()) continue;

  // Match creature name
  const nameMatch = block.match(/^(\w+|".+?")\s*:\s*\{/);
  if (!nameMatch) continue;

  const name = nameMatch[1].replace(/"/g, '');
  const creature = {};

  // Extract birthtype
  const birthtypeMatch = block.match(/birthtype:\s*"(\w+)"/);
  if (birthtypeMatch) creature.birthtype = birthtypeMatch[1];

  // Extract type (diet) - match \ttype: not birthtype:
  const typeMatch = block.match(/\ttype:\s*"(\w+)"/);
  if (typeMatch) creature.type = typeMatch[1];

  // Extract numeric properties
  const numericProps = ['basefoodrate', 'babyfoodrate', 'extrababyfoodrate',
    'agespeed', 'agespeedmult', 'eggspeed', 'eggspeedmult',
    'gestationspeed', 'gestationspeedmult', 'weight'];

  for (const prop of numericProps) {
    const propMatch = block.match(new RegExp(`${prop}:\\s*([\\d.]+)`));
    if (propMatch) {
      creature[prop] = parseFloat(propMatch[1]);
    }
  }

  if (Object.keys(creature).length > 0) {
    creatures[name] = creature;
  }
}

console.log(JSON.stringify(creatures, null, 2));
