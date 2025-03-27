import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

// Корректный способ получения директории текущего файла
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getAudioMetadata(folderPath, imageSourcePath) {
    // Нормализуем пути для кросс-платформенной совместимости
    folderPath = path.resolve(folderPath);
    imageSourcePath = path.resolve(imageSourcePath);

    console.log("Папка с аудиофайлами:", folderPath);
    console.log("Папка с изображениями:", imageSourcePath);

    try {
        const files = await fs.promises.readdir(folderPath);
        const audioFiles = files.filter(file => /\.(mp3|flac|m4a|ogg|wav)$/i.test(file));

        const result = [];

        // Создаём папку img в той же директории, где лежит скрипт
        const imgDir = path.join(__dirname, 'img');
        if (!fs.existsSync(imgDir)) {
            fs.mkdirSync(imgDir, { recursive: true }); // recursive: true создаёт вложенные папки, если их нет
        }

        // Получаем список картинок
        const imageFiles = await fs.promises.readdir(imageSourcePath);
        const filteredImageFiles = imageFiles.filter(file =>
            /\.(jpg|jpeg|png|jfif)$/i.test(file)
        );

        console.log("Изображения:", filteredImageFiles);

        if (filteredImageFiles.length === 0) {
            console.warn('❗ Нет изображений в указанной директории:', imageSourcePath);
        }

        for (let i = 0; i < audioFiles.length; i++) {
            const file = audioFiles[i];
            const filePath = path.join(folderPath, file);
            try {
                const metadata = await parseFile(filePath);
                const common = metadata.common;

                const name = common.title || path.parse(file).name;
                const description = common.album || '';
                const author = common.artist || '';

                const item = {
                    name: { en: name, hi: "" },
                    description: { en: description, hi: "" }
                };

                if (author) {
                    item.author = author;
                }

                result.push(item);

                // Выбор уникального изображения
                if (filteredImageFiles.length > 0) {
                    const imageIndex = i % filteredImageFiles.length; // Чередуем изображения
                    const originalImageName = filteredImageFiles[imageIndex];
                    const sourceImagePath = path.join(imageSourcePath, originalImageName);

                    // Получаем расширение файла
                    const ext = path.extname(originalImageName);
                    const baseName = path.basename(originalImageName, ext);

                    // Формируем новое имя файла
                    const safeTrackName = name.replace(/[^a-z0-9а-яё]/gi, '_'); // Заменяем запрещённые символы
                    const newImageName = `${baseName}_${safeTrackName}${ext}`;

                    const destImagePath = path.join(imgDir, newImageName);
                    fs.copyFileSync(sourceImagePath, destImagePath);
                }

            } catch (err) {
                console.error(`Ошибка при обработке ${file}:`, err.message);
            }
        }


        // Путь к итоговому JSON файлу
        const outputPath = path.join(__dirname, 'metadata.json');

        // Запись в файл
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`✅ JSON-файл успешно создан: ${outputPath}`);
        console.log(`🖼️  Картинки скопированы в: ${imgDir}`);

        return result;

    } catch (err) {
        console.error('Ошибка при работе с директориями:', err.message);
    }
}

// Пример вызова
getAudioMetadata('./audio', 'D:/work/Convector-from-mp3-to-mp4/img/ambientCompress');
