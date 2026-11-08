const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/dvd' || path.extname(file.originalname).toLowerCase() === '.vob') {
      cb(null, true);
    } else {
      cb(new Error('Only VOB files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload and convert endpoint
app.post('/convert', upload.single('vobFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputFileName = path.basename(req.file.originalname, '.vob') + '.mp4';
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`Converting ${inputPath} to ${outputPath}`);

    // Convert VOB to MP4 using FFmpeg
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4')
      .on('start', (commandLine) => {
        console.log('FFmpeg process started:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('end', () => {
        console.log('Conversion completed');
        res.json({ 
          success: true, 
          message: 'Conversion completed successfully',
          downloadUrl: `/download/${outputFileName}`,
          fileName: outputFileName
        });
        
        // Clean up input file
        fs.remove(inputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Conversion failed: ' + err.message });
        
        // Clean up input file
        fs.remove(inputPath);
      })
      .run();

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // block path traversal (../)
  const filePath = path.join(outputDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      } else {
        // Clean up file after download
        setTimeout(() => {
          fs.remove(filePath);
        }, 1000);
      }
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Get conversion status (for progress tracking)
app.get('/status/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // block path traversal (../)
  const filePath = path.join(outputDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.json({ status: 'completed', file: filename });
  } else {
    res.json({ status: 'processing' });
  }
});

app.listen(PORT, () => {
  console.log(`VOB to MP4 Converter running on http://localhost:${PORT}`);
  console.log('Make sure FFmpeg is installed on your system');
});

