const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputFolder = path.join(__dirname, 'img/ambient');
const outputFolder = path.join(__dirname, 'img/ambientCompress');
const maxSizeKB = 800; // Целевой размер в килобайтах (0.8MB)
const minQuality = 30; // Минимальное качество
const maxQuality = 85; // Максимальное начальное качество

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('Ошибка при чтении папки:', err);
        return;
    }

    files.forEach(async (file) => {
        const inputPath = path.join(inputFolder, file);
        const outputPath = path.join(outputFolder, file);

        try {
            let quality = maxQuality;
            let metadata = await sharp(inputPath).metadata();
            let width = metadata.width;
            let height = metadata.height;

            while (quality >= minQuality) {
                await sharp(inputPath)
                    .resize({ width }) // Уменьшаем ширину, если потребуется
                    .jpeg({ quality, progressive: true, mozjpeg: true })
                    .toFile(outputPath);

                const newSizeKB = fs.statSync(outputPath).size / 1024;
                if (newSizeKB <= maxSizeKB) {
                    console.log(`✅ Сжато: ${file} (${newSizeKB.toFixed(2)} KB)`);
                    return;
                }

                quality -= 5; // Снижаем качество и пробуем снова
            }

            console.log(`⚠️ Файл ${file} все еще больше 800KB (${fs.statSync(outputPath).size / 1024} KB), уменьшаем размер...`);

            // Дополнительно уменьшаем размер изображения, если качество не помогло
            const scaleFactor = 0.9; // Уменьшение масштаба
            width = Math.floor(width * scaleFactor);
            height = Math.floor(height * scaleFactor);

            await sharp(inputPath)
                .resize({ width, height }) // Уменьшаем разрешение
                .jpeg({ quality: minQuality, progressive: true, mozjpeg: true })
                .toFile(outputPath);

            console.log(`✅ Окончательно уменьшено: ${file} (${fs.statSync(outputPath).size / 1024} KB)`);

        } catch (error) {
            console.error(`❌ Ошибка обработки ${file}:`, error);
        }
    });
});
