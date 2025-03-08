const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const inputDir = path.join(__dirname, "input");  // Папка с аудиофайлами
const outputDir = path.join(__dirname, "output"); // Папка для сохранения видео
const inputImage = path.join(__dirname, "background.jpg"); // Фоновое изображение

// Убедимся, что папка output существует
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Функция для обработки одного аудиофайла
function processAudioFile(audioFile) {
    const inputAudio = path.join(inputDir, audioFile);
    const outputVideo = path.join(outputDir, `${path.parse(audioFile).name}.mp4`);

    // Получаем длительность аудио
    ffmpeg(inputAudio).ffprobe((err, metadata) => {
        if (err) {
            console.error(`❌ Ошибка при получении метаданных для ${audioFile}:`, err);
            return;
        }

        const audioDuration = metadata.format.duration;

        ffmpeg()
            .input(inputImage)
            .loop(audioDuration) // Фон на всю длину аудио
            .input(inputAudio)
            .outputOptions([
                "-c:v libx264",
                "-tune stillimage",
                "-c:a aac",
                "-b:a 192k",
                "-shortest",
                "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"
            ])
            .save(outputVideo)
            .on("end", () => console.log(`✅ Видео создано: ${outputVideo}`))
            .on("error", (err) => console.error(`❌ Ошибка при обработке ${audioFile}:`, err));
    });
}

// Функция для обработки всех аудиофайлов в папке input
function processAllAudioFiles() {
    fs.readdir(inputDir, (err, files) => {
        if (err) {
            console.error("❌ Ошибка при чтении папки input:", err);
            return;
        }

        // Фильтруем только mp3-файлы
        const audioFiles = files.filter(file => file.endsWith(".mp3"));

        if (audioFiles.length === 0) {
            console.log("❌ В папке input нет MP3 файлов.");
            return;
        }

        console.log(`🔄 Найдено ${audioFiles.length} аудиофайлов. Начинаем обработку...`);
        audioFiles.forEach(processAudioFile);
    });
}

// Запускаем обработку всех файлов
processAllAudioFiles();
