const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /\b(text|bg|border|ring|from|via|to|fill)-(blue|red|green|yellow|purple|indigo|pink|emerald|teal|cyan|fuchsia|rose|violet|orange|amber|lime)-(\d{2,3}(?:\/\d{1,2})?)\b/g;
      
      const newContent = content.replace(regex, (match, type, color, weightStr) => {
        const weight = parseInt(weightStr.split('/')[0], 10);
        let monoWeight = '500';
        
        if (weight >= 700) monoWeight = '900';
        else if (weight >= 500) monoWeight = '800'; // Make sure there is enough contrast
        else if (weight >= 300) monoWeight = '300';
        else monoWeight = '100';

        const hasOpacity = weightStr.includes('/');
        const opacity = hasOpacity ? `/${weightStr.split('/')[1]}` : '';

        // For dark mode variants, we might want to just stick to abstract classes later, but for now map to zinc.
        // Actually, Shadcn's primary/secondary/muted are better, but mapping to zinc is safer for generic replacements.
        return `${type}-zinc-${monoWeight}${opacity}`;
      });

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(dir => {
  const fullDirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullDirPath)) {
    processDirectory(fullDirPath);
  }
});
