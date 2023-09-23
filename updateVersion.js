const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const version = packageJson.version;

const mainifestPath = './public/manifest.json';
const mainifestJson = JSON.parse(fs.readFileSync(mainifestPath, 'utf-8'));
mainifestJson.version = version
fs.writeFile(mainifestPath, JSON.stringify(mainifestJson, null, 2), () => {
  console.log('版本更新成功');
});

