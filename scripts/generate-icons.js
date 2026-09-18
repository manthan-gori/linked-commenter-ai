const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const svgPath = path.resolve(__dirname, '../extension/icons/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const sizes = [16, 48, 128];

// Find Chrome or Edge executable
function findBrowser() {
    const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return 'msedge';
}

const browser = findBrowser();

sizes.forEach((size) => {
    const outPng = path.resolve(__dirname, `../extension/icons/icon${size}.png`);
    const tempHtml = path.resolve(__dirname, `temp_${size}.html`);

    const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  svg { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

    fs.writeFileSync(tempHtml, html, 'utf8');

    try {
        const cmd = `"${browser}" --headless --disable-gpu --force-device-scale-factor=1 --default-background-color=00000000 --window-size=${size},${size} --screenshot="${outPng}" "file://${tempHtml}"`;
        execSync(cmd, { stdio: 'pipe' });
        console.log(`Generated icon${size}.png`);
    } catch (e) {
        console.error(`Failed icon${size}.png:`, e.message);
    } finally {
        if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml);
    }
});
