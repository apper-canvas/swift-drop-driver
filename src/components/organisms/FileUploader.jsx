import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import DropZone from "@/components/molecules/DropZone";
import FileCard from "@/components/molecules/FileCard";
import SettingsPanel from "@/components/molecules/SettingsPanel";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import uploadService from "@/services/api/uploadService";

const FileUploader = () => {
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [activeUploads, setActiveUploads] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await uploadService.getSettings();
      setSettings(settingsData);
    } catch (err) {
      setError("Failed to load upload settings");
      console.error("Settings loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const processUploadQueue = useCallback(async () => {
    if (!settings || activeUploads >= settings.maxConcurrentUploads) return;

    const availableSlots = settings.maxConcurrentUploads - activeUploads;
    const filesToUpload = uploadQueue.slice(0, availableSlots);
    
    if (filesToUpload.length === 0) return;

    setActiveUploads(prev => prev + filesToUpload.length);
    setUploadQueue(prev => prev.slice(filesToUpload.length));

    filesToUpload.forEach(async (fileData) => {
      try {
        await uploadService.uploadFile(fileData.file, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === progress.id ? { ...f, ...progress } : f
          ));
        });

        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: "completed", progress: 100 }
            : f
        ));

        toast.success(`${fileData.name} uploaded successfully!`);
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: "error", error: err.message }
            : f
        ));
        toast.error(`Failed to upload ${fileData.name}`);
      } finally {
        setActiveUploads(prev => prev - 1);
      }
    });
  }, [uploadQueue, activeUploads, settings]);

  useEffect(() => {
    processUploadQueue();
  }, [processUploadQueue]);

  const handleFilesSelected = (selectedFiles) => {
    if (!settings) return;

    const newFiles = selectedFiles.map(file => ({
      id: uploadService.generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      progress: 0,
      url: null,
      uploadSpeed: 0,
      timeRemaining: 0,
      error: null,
      file: file
    }));

    // Validate files
    const validFiles = newFiles.filter(fileData => {
      const errors = uploadService.validateFile(fileData.file);
      if (errors.length > 0) {
        toast.error(`${fileData.name}: ${errors[0]}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setFiles(prev => [...prev, ...validFiles]);
    setUploadQueue(prev => [...prev, ...validFiles]);

    toast.info(`Added ${validFiles.length} file${validFiles.length > 1 ? "s" : ""} to upload queue`);
  };

  const handleRetry = async (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: "pending", progress: 0, error: null }
        : f
    ));

    setUploadQueue(prev => [...prev, file]);
  };

  const handleCancel = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadQueue(prev => prev.filter(f => f.id !== fileId));
    uploadService.cancelUpload(fileId);
    toast.info("Upload cancelled");
  };

  const handleClearCompleted = () => {
    const completedCount = files.filter(f => f.status === "completed").length;
    setFiles(prev => prev.filter(f => f.status !== "completed"));
    
    if (completedCount > 0) {
      toast.success(`Cleared ${completedCount} completed upload${completedCount > 1 ? "s" : ""}`);
    }
  };

  const handleSettingsChange = async (newSettings) => {
    try {
      const updated = await uploadService.updateSettings(newSettings);
      setSettings(updated);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const getUploadStats = () => {
    const completed = files.filter(f => f.status === "completed").length;
    const uploading = files.filter(f => f.status === "uploading").length;
    const pending = files.filter(f => f.status === "pending").length;
    const errors = files.filter(f => f.status === "error" || f.status === "cancelled").length;

    return { completed, uploading, pending, errors, total: files.length };
  };

  const stats = getUploadStats();

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadSettings} />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <ApperIcon name="Zap" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Swift Drop
            </h1>
            <p className="text-gray-600">Fast, reliable file uploads</p>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {settings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          isOpen={settingsOpen}
          onToggle={() => setSettingsOpen(!settingsOpen)}
        />
      )}

      {/* Upload Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-primary-700">Total Files</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.uploading}</div>
            <div className="text-sm text-blue-700">Uploading</div>
          </div>
          <div className="bg-gradient-to-br from-success-50 to-success-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-success-600">{stats.completed}</div>
            <div className="text-sm text-success-700">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={handleFilesSelected}
        disabled={activeUploads >= settings.maxConcurrentUploads}
        maxFileSize={settings.maxFileSize}
        allowedTypes={settings.allowedTypes}
      />

      {/* File List Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Queue ({files.length})
          </h2>
          <div className="flex items-center space-x-2">
            {stats.completed > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompleted}
                className="inline-flex items-center space-x-1"
              >
                <ApperIcon name="Trash2" className="w-4 h-4" />
                <span>Clear Completed</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      <div className="space-y-3">
        <AnimatePresence>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRetry={handleRetry}
              onCancel={handleCancel}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <Empty onUpload={() => document.querySelector("input[type='file']")?.click()} />
      )}
    </div>
  );
};

export default FileUploader;