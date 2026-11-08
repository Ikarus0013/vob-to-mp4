# VOB to MP4 Converter

This web application converts DVD video files (VOB) to MP4 files with FFmpeg.

## What it does

- The application shows a web page in your browser.
- You select one or more VOB files, or you drag the files onto the page.
- The page sends the files to the server one after the other.
- The server converts the file to MP4 with H.264 video and AAC audio.
- You download the MP4 file from the page.

## Requirements

- macOS, Linux, or Windows.
- Node.js 18 or later, and npm.
- FFmpeg. The `ffmpeg` and `ffprobe` commands must be in your `PATH`.
- A web browser.
- Free disk space. You need space for the VOB file and for the MP4 file.

## Install

1. Get the code.

   ```bash
   git clone https://github.com/Ikarus0013/vob-to-mp4.git
   cd vob-to-mp4
   ```

2. Install the Node.js dependencies.

   ```bash
   npm install
   ```

3. Install FFmpeg.

   On macOS (Homebrew):

   ```bash
   brew install ffmpeg
   ```

   On Ubuntu or Debian:

   ```bash
   sudo apt update
   sudo apt install ffmpeg
   ```

   On Windows, get FFmpeg from <https://ffmpeg.org/download.html>. Add the `bin` folder to your `PATH`.

4. Make sure that FFmpeg is available.

   ```bash
   ffmpeg -version
   ```

## Configure

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | TCP port for the web server. Default is `3000`. |

The server does not read a `.env` file. Set the variable in your shell.

```bash
PORT=8080 npm start
```

## Use

1. Start the server.

   ```bash
   npm start
   ```

2. Open `http://localhost:3000` in your browser.
3. Click **Browse Files** and select a VOB file. You can also drag the file onto the upload area.
4. Click **Convert to MP4**.
5. Wait until the conversion is complete. A long video can take many minutes.
6. Click **Download MP4**.

For development, use this command. The server starts again when a file changes.

```bash
npm run dev
```

You can also use the API with `curl`:

```bash
curl -F "vobFile=@VTS_01_1.VOB" http://localhost:3000/convert
curl -O http://localhost:3000/download/VTS_01_1.mp4
```

## How it works

1. Multer saves the uploaded file in the `uploads/` folder.
2. The server accepts only files with the `.vob` extension or the `video/dvd` type.
3. The `fluent-ffmpeg` package starts FFmpeg with the `libx264` video codec and the `aac` audio codec.
4. FFmpeg writes the MP4 file to the `output/` folder.
5. The server deletes the VOB file after the conversion.
6. The server deletes the MP4 file approximately 1 second after the download.

### API

| Method and path | Description |
| --- | --- |
| `POST /convert` | Upload a VOB file in the form field `vobFile`. The server replies when the conversion is complete. |
| `GET /download/:filename` | Download a converted MP4 file. |
| `GET /status/:filename` | Show `completed` if the MP4 file exists. Otherwise show `processing`. |

## Files

| File | Description |
| --- | --- |
| `server.js` | Express server, upload handling, and FFmpeg conversion. |
| `public/index.html` | Web page. |
| `public/script.js` | Browser code for upload, conversion, and download. |
| `public/style.css` | Styles for the web page. |
| `package.json` | Package data and dependencies. |
| `uploads/` | Temporary folder for uploaded files. The server makes it at start. |
| `output/` | Folder for converted files. The server makes it at start. |

## Limits

- The maximum file size is 2 GB.
- The server converts each VOB file to a separate MP4 file. It does not join the VOB files of a DVD.
- The `/convert` request stays open until the conversion is complete. A browser or a proxy can stop a very long request.
- The progress bar on the page is an estimate. The server writes the real FFmpeg progress to the console only.
- Two files with the same name write to the same MP4 file.
- **WARNING:** The server has no authentication. Use it only on your own computer. Do not make it available on a public network.
- The `fluent-ffmpeg` package is no longer maintained.

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Error "Cannot find ffmpeg" | Install FFmpeg. Make sure that `ffmpeg -version` works in the same terminal. |
| The conversion fails | Make sure that the VOB file is not damaged. Make sure that you have sufficient disk space. |
| The upload fails | Make sure that the file has the `.vob` extension and is smaller than 2 GB. |

## License

This project uses the MIT license. Refer to the `LICENSE` file.
