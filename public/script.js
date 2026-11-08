class VOBConverter {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.currentFiles = null;
        this.conversionResults = null;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.convertBtn = document.getElementById('convertBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultSection = document.getElementById('resultSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newConversionBtn = document.getElementById('newConversionBtn');
        this.errorSection = document.getElementById('errorSection');
        this.errorText = document.getElementById('errorText');
        this.retryBtn = document.getElementById('retryBtn');
        
        console.log('Elements initialized:', {
            fileInfo: this.fileInfo,
            fileName: this.fileName,
            fileSize: this.fileSize,
            convertBtn: this.convertBtn
        });
    }

    setupEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Convert button
        this.convertBtn.addEventListener('click', () => this.convertFile());

        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadFile());

        // New conversion button
        this.newConversionBtn.addEventListener('click', () => this.resetConverter());

        // Retry button
        this.retryBtn.addEventListener('click', () => this.resetConverter());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        console.log('File select triggered', e.target.files);
        const files = e.target.files;
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        console.log('Processing files:', files);
        // Filter only VOB files
        const vobFiles = Array.from(files).filter(file => 
            file.name.toLowerCase().endsWith('.vob')
        );

        console.log('VOB files found:', vobFiles);

        if (vobFiles.length === 0) {
            this.showError('Please select at least one VOB file.');
            return;
        }

        // Check file sizes
        const oversizedFiles = vobFiles.filter(file => 
            file.size > 2 * 1024 * 1024 * 1024
        );

        if (oversizedFiles.length > 0) {
            this.showError(`File size must be less than 2GB. Found ${oversizedFiles.length} oversized file(s).`);
            return;
        }

        this.currentFiles = vobFiles;
        console.log('Setting currentFiles:', this.currentFiles);
        this.showFileInfo();
    }

    processFile(file) {
        // Legacy method for single file processing
        this.processFiles([file]);
    }

    showFileInfo() {
        console.log('showFileInfo called, currentFiles:', this.currentFiles);
        if (this.currentFiles && this.currentFiles.length > 0) {
            if (this.currentFiles.length === 1) {
                this.fileName.textContent = this.currentFiles[0].name;
                this.fileSize.textContent = this.formatFileSize(this.currentFiles[0].size);
            } else {
                const totalSize = this.currentFiles.reduce((sum, file) => sum + file.size, 0);
                this.fileName.textContent = `${this.currentFiles.length} VOB files selected`;
                this.fileSize.textContent = `Total size: ${this.formatFileSize(totalSize)}`;
            }
            this.fileInfo.style.display = 'flex';
            // Hide other sections but keep fileInfo visible
            this.progressSection.style.display = 'none';
            this.resultSection.style.display = 'none';
            this.errorSection.style.display = 'none';
            console.log('File info should be visible now');
        } else {
            console.log('No files to show');
        }
    }

    async convertFile() {
        if (!this.currentFiles || this.currentFiles.length === 0) return;

        this.showProgress();
        this.convertBtn.disabled = true;

        try {
            // Convert files one by one
            const results = [];
            for (let i = 0; i < this.currentFiles.length; i++) {
                const file = this.currentFiles[i];
                this.progressText.textContent = `Converting file ${i + 1} of ${this.currentFiles.length}: ${file.name}`;
                
                const formData = new FormData();
                formData.append('vobFile', file);

                const response = await fetch('/convert', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                results.push(result);

                if (!result.success) {
                    this.showError(result.error || `Conversion failed for ${file.name}`);
                    return;
                }
            }

            // All conversions successful
            this.conversionResults = results;
            this.showResult();
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.convertBtn.disabled = false;
        }
    }

    showProgress() {
        this.hideAllSections();
        this.progressSection.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Converting...';

        // Simulate progress (since we can't get real-time progress from FFmpeg easily)
        this.simulateProgress();
    }

    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `Converting... ${Math.round(progress)}%`;

            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 500);
    }

    showResult() {
        this.hideAllSections();
        this.resultSection.style.display = 'block';
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Conversion Complete!';
        
        // Update success message for multiple files
        if (this.conversionResults && this.conversionResults.length > 1) {
            const successMessage = document.querySelector('.success-message p');
            successMessage.textContent = `All ${this.conversionResults.length} VOB files have been successfully converted to MP4`;
        }
    }

    showError(message) {
        this.hideAllSections();
        this.errorText.textContent = message;
        this.errorSection.style.display = 'block';
    }

    hideAllSections() {
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        // Don't hide fileInfo here - it should be shown when files are selected
    }

    downloadFile() {
        if (this.conversionResults && this.conversionResults.length > 0) {
            // Download all converted files
            this.conversionResults.forEach((result, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = result.downloadUrl;
                    link.download = result.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 500); // Stagger downloads by 500ms
            });
        }
    }

    resetConverter() {
        this.currentFiles = null;
        this.conversionResults = null;
        this.fileInput.value = '';
        this.hideAllSections();
        this.uploadArea.classList.remove('dragover');
        
        // Reset success message
        const successMessage = document.querySelector('.success-message p');
        successMessage.textContent = 'Your VOB file has been successfully converted to MP4';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VOBConverter();
});
