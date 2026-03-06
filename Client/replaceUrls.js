import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        let filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src');
let count = 0;

files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('http://localhost:3000')) {
            // Replace with empty string so "http://localhost:3000/api" becomes "/api"
            const newContent = content.replace(/http:\/\/localhost:3000/g, '');
            fs.writeFileSync(file, newContent, 'utf8');
            console.log('Updated API URL in:', file);
            count++;
        }
    }
});

console.log(`\nSuccessfully updated ${count} files.`);
