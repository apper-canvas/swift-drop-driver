import { toast } from "react-toastify";

class UploadService {
  constructor() {
    this.uploads = new Map();
    this.apperClient = null;
    this.currentSettings = null;
    this.initializeClient();
  }

  initializeClient() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async getSettings() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "max_file_size_c"}},
          {"field": {"Name": "allowed_types_c"}},
          {"field": {"Name": "max_concurrent_uploads_c"}},
          {"field": {"Name": "auto_compress_c"}}
        ],
        orderBy: [{"fieldName": "Id", "sorttype": "DESC"}],
        pagingInfo: {"limit": 1, "offset": 0}
      };

      const response = await this.apperClient.fetchRecords("upload_setting_c", params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return this.getDefaultSettings();
      }

      if (!response.data || response.data.length === 0) {
        return this.getDefaultSettings();
      }

      const setting = response.data[0];
      const allowedTypesArray = setting.allowed_types_c ? setting.allowed_types_c.split(',') : [];
      
      const settings = {
        maxFileSize: setting.max_file_size_c || 10485760,
        allowedTypes: allowedTypesArray,
        maxConcurrentUploads: setting.max_concurrent_uploads_c || 3,
        autoCompress: setting.auto_compress_c || false
      };

      this.currentSettings = settings;
      return settings;
    } catch (error) {
      console.error("Error fetching upload settings:", error?.response?.data?.message || error);
      return this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    const defaultSettings = {
      maxFileSize: 10485760,
      allowedTypes: [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain", "text/csv", "application/zip",
        "video/mp4", "video/quicktime", "audio/mp3", "audio/wav"
      ],
      maxConcurrentUploads: 3,
      autoCompress: false
    };
    this.currentSettings = defaultSettings;
    return defaultSettings;
  }

  async updateSettings(newSettings) {
    try {
      const allowedTypesString = newSettings.allowedTypes ? newSettings.allowedTypes.join(',') : '';
      
      const updateData = {
        records: [{
          Name: "Default Upload Settings",
          max_file_size_c: newSettings.maxFileSize,
          allowed_types_c: allowedTypesString,
          max_concurrent_uploads_c: newSettings.maxConcurrentUploads,
          auto_compress_c: newSettings.autoCompress
        }]
      };

      // Try to get existing record first
      const existingResponse = await this.apperClient.fetchRecords("upload_setting_c", {
        fields: [{"field": {"Name": "Id"}}],
        pagingInfo: {"limit": 1, "offset": 0}
      });

      let response;
      if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
        // Update existing record
        updateData.records[0].Id = existingResponse.data[0].Id;
        response = await this.apperClient.updateRecord("upload_setting_c", updateData);
      } else {
        // Create new record
        response = await this.apperClient.createRecord("upload_setting_c", updateData);
      }

      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return this.currentSettings;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update settings: ${JSON.stringify(failed)}`);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }

        if (successful.length > 0) {
          this.currentSettings = { ...newSettings };
          return this.currentSettings;
        }
      }

      return this.currentSettings;
    } catch (error) {
      console.error("Error updating upload settings:", error?.response?.data?.message || error);
      toast.error("Failed to update settings");
      return this.currentSettings;
    }
  }

  validateFile(file) {
    const errors = [];
    const settings = this.currentSettings || this.getDefaultSettings();
    
    if (file.size > settings.maxFileSize) {
      errors.push(`File size exceeds ${this.formatFileSize(settings.maxFileSize)} limit`);
    }
    
    if (!settings.allowedTypes.includes(file.type)) {
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
      
      // Create database record for uploaded file
      await this.createUploadedFileRecord(uploadData);
      
      // Mark as completed
      uploadData.status = "completed";
      uploadData.progress = 100;
      uploadData.url = `https://example.com/files/${fileId}/${encodeURIComponent(file.name)}`;
      
      return { ...uploadData };
    } catch (error) {
      uploadData.status = "error";
      uploadData.error = error.message;
      
      // Create error record in database
      await this.createUploadedFileRecord({ ...uploadData, status: "error", error: error.message });
      
      throw error;
    }
  }

  async createUploadedFileRecord(uploadData) {
    try {
      const fileRecord = {
        records: [{
          Name: uploadData.name,
          name_c: uploadData.name,
          size_c: uploadData.size,
          type_c: uploadData.type,
          status_c: uploadData.status,
          progress_c: uploadData.progress,
          url_c: uploadData.url || "",
          upload_speed_c: uploadData.uploadSpeed || 0,
          time_remaining_c: uploadData.timeRemaining || 0,
          error_c: uploadData.error || "",
          file_id_c: uploadData.id
        }]
      };

      const response = await this.apperClient.createRecord("uploaded_file_c", fileRecord);
      
      if (!response.success) {
        console.error("Failed to save file record:", response.message);
      }
    } catch (error) {
      console.error("Error creating uploaded file record:", error?.response?.data?.message || error);
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
      
      // Update database record
      await this.createUploadedFileRecord(uploadData);
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
      
      // Update database record
      await this.createUploadedFileRecord(uploadData);
      
      uploadData.status = "completed";
      uploadData.progress = 100;
      uploadData.url = `https://example.com/files/${fileId}/${encodeURIComponent(uploadData.name)}`;
      return { ...uploadData };
    } catch (error) {
      uploadData.status = "error";
      uploadData.error = error.message;
      
      // Update error record in database
      await this.createUploadedFileRecord(uploadData);
      
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

export default new UploadService();