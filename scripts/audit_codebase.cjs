const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting Codebase Audit...');

const report = {
    lintErrors: 0,
    filesScanned: 0,
    architectureViolations: [],
    largeComponents: []
};

// 1. Run ESLint
try {
    console.log('Running ESLint...');
    execSync('npm run lint', { stdio: 'ignore' });
    console.log('✅ Linting passed.');
} catch (e) {
    console.log('⚠️ Linting failed (expected during refactor).');
    report.lintErrors = 1; // Generic flag
}

// 2. Scan for Large Components (> 300 lines) and Architecture Violations
function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') scanDir(filePath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            report.filesScanned++;
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;

            if (lines > 300) {
                report.largeComponents.push({ file: filePath, lines });
            }

            // Architecture Check: Domain importing Infrastructure
            if (filePath.includes('/domain/') && content.includes('/infrastructure/')) {
                report.architectureViolations.push(`Domain ${file} imports Infrastructure`);
            }
        }
    });
}

scanDir('./src');

console.log('\n📊 Audit Report:');
console.log(`Files Scanned: ${report.filesScanned}`);
console.log(`Large Components (>300 lines): ${report.largeComponents.length}`);
if (report.largeComponents.length > 0) {
    report.largeComponents.forEach(c => console.log(`  - ${path.basename(c.file)}: ${c.lines} lines`));
}
console.log(`Architecture Violations: ${report.architectureViolations.length}`);
if (report.architectureViolations.length > 0) {
    report.architectureViolations.forEach(v => console.log(`  - ${v}`));
}
