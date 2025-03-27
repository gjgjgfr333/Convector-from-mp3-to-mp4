const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const inputDir = path.join(__dirname, "input");
const outputDir = path.join(__dirname, "output");
const inputImage = path.join(__dirname, "background.jpg");
const outputAudio = path.join(outputDir, "combined.mp3");
const outputVideo = path.join(outputDir, "final_video.mp4");

// Убедимся, что папка output существует
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Шаг 1: Создание списка файлов для объединения
function createConcatList(audioFiles, listPath) {
    const content = audioFiles
        .map(file => `file '${path.join(inputDir, file).replace(/\\/g, "/")}'`)
        .join("\n");
    fs.writeFileSync(listPath, content);
}

// Шаг 2: Объединение всех mp3 в один
function concatAudioFiles(audioFiles, callback) {
    const listFile = path.join(outputDir, "concat_list.txt");
    createConcatList(audioFiles, listFile);

    ffmpeg()
        .input(listFile)
        .inputOptions("-f", "concat", "-safe", "0")
        .outputOptions("-c", "copy")
        .on("end", () => {
            console.log("✅ Аудиофайлы объединены.");
            callback();
        })
        .on("error", err => {
            console.error("❌ Ошибка при объединении аудиофайлов:", err);
        })
        .save(outputAudio);
}

// Шаг 3: Создание финального видео
function createFinalVideo() {
    ffmpeg.ffprobe(outputAudio, (err, metadata) => {
        if (err) {
            console.error("❌ Ошибка при получении длительности аудио:", err);
            return;
        }

        const duration = metadata.format.duration;

        ffmpeg()
            .input(inputImage)
            .loop(duration)
            .input(outputAudio)
            .outputOptions([
                "-c:v libx264",
                "-tune stillimage",
                "-c:a aac",
                "-b:a 192k",
                "-shortest",
                "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"
            ])
            .save(outputVideo)
            .on("end", () => console.log(`🎉 Видео создано: ${outputVideo}`))
            .on("error", err => console.error("❌ Ошибка при создании видео:", err));
    });
}

// Шаг 4: Главная функция
function processAll() {
    fs.readdir(inputDir, (err, files) => {
        if (err) {
            console.error("❌ Ошибка при чтении папки input:", err);
            return;
        }

        const audioFiles = files.filter(file => file.endsWith(".mp3"));

        if (audioFiles.length === 0) {
            console.log("⚠️ Нет MP3 файлов в папке input.");
            return;
        }

        console.log(`🔄 Найдено ${audioFiles.length} MP3. Объединяем...`);
        concatAudioFiles(audioFiles, createFinalVideo);
    });
}

// Запуск
processAll();
