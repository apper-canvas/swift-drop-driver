import uploadSettingsData from "@/services/mockData/uploadSettings.json";

class UploadService {
  constructor() {
    this.uploads = new Map();
    this.settings = { ...uploadSettingsData };
  }

  async getSettings() {
    await this.delay(100);
    return { ...this.settings };
  }

  async updateSettings(newSettings) {
    await this.delay(200);
    this.settings = { ...this.settings, ...newSettings };
    return { ...this.settings };
  }

  validateFile(file) {
    const errors = [];
    
    if (file.size > this.settings.maxFileSize) {
      errors.push(`File size exceeds ${this.formatFileSize(this.settings.maxFileSize)} limit`);
    }
    
    if (!this.settings.allowedTypes.includes(file.type)) {
      errors.push("File type not allowed");
    }
    
    return errors;
  }

  async uploadFile(file, onProgress) {
    const fileId = this.generateId();
    const validationErrors = this.validateFile(file);
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    const uploadData = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
      url: null,
      uploadSpeed: 0,
      timeRemaining: 0,
      error: null,
      file: file
    };

    this.uploads.set(fileId, uploadData);

    try {
      await this.simulateUpload(fileId, onProgress);
      
      // Mark as completed
      uploadData.status = "completed";
      uploadData.progress = 100;
      uploadData.url = `https://example.com/files/${fileId}/${encodeURIComponent(file.name)}`;
      
      return { ...uploadData };
    } catch (error) {
      uploadData.status = "error";
      uploadData.error = error.message;
      throw error;
    }
  }

  async simulateUpload(fileId, onProgress) {
    const uploadData = this.uploads.get(fileId);
    const totalSize = uploadData.size;
    const chunkSize = Math.max(totalSize / 50, 8192); // At least 8KB chunks
    let uploaded = 0;
    const startTime = Date.now();

    while (uploaded < totalSize) {
      await this.delay(50 + Math.random() * 100); // Simulate network latency
      
      const chunkUploaded = Math.min(chunkSize, totalSize - uploaded);
      uploaded += chunkUploaded;
      
      const progress = Math.min((uploaded / totalSize) * 100, 100);
      const elapsedTime = (Date.now() - startTime) / 1000;
      const uploadSpeed = uploaded / elapsedTime; // bytes per second
      const timeRemaining = elapsedTime > 0 ? (totalSize - uploaded) / uploadSpeed : 0;
      
      uploadData.progress = Math.round(progress);
      uploadData.uploadSpeed = uploadSpeed;
      uploadData.timeRemaining = timeRemaining;
      
      if (onProgress) {
        onProgress({
          ...uploadData,
          progress: uploadData.progress,
          uploadSpeed: uploadSpeed,
          timeRemaining: timeRemaining
        });
      }

      // Simulate occasional upload failures
      if (Math.random() < 0.01) { // 1% chance of failure
        throw new Error("Upload failed due to network error");
      }
    }
  }

  async cancelUpload(fileId) {
    await this.delay(100);
    const uploadData = this.uploads.get(fileId);
    if (uploadData) {
      uploadData.status = "cancelled";
      uploadData.error = "Upload cancelled by user";
    }
    return uploadData;
  }

  async retryUpload(fileId, onProgress) {
    const uploadData = this.uploads.get(fileId);
    if (!uploadData) {
      throw new Error("Upload not found");
    }

    uploadData.status = "uploading";
    uploadData.progress = 0;
    uploadData.error = null;
    
    try {
      await this.simulateUpload(fileId, onProgress);
      uploadData.status = "completed";
      uploadData.progress = 100;
      uploadData.url = `https://example.com/files/${fileId}/${encodeURIComponent(uploadData.name)}`;
      return { ...uploadData };
    } catch (error) {
      uploadData.status = "error";
      uploadData.error = error.message;
      throw error;
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getFileIcon(fileType) {
    if (fileType.startsWith("image/")) return "Image";
    if (fileType.startsWith("video/")) return "Video";
    if (fileType.startsWith("audio/")) return "Music";
    if (fileType === "application/pdf") return "FileText";
    if (fileType.includes("word") || fileType.includes("document")) return "FileText";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "FileSpreadsheet";
    if (fileType.includes("zip") || fileType.includes("archive")) return "Archive";
    return "File";
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new UploadService();