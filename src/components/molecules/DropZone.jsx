import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const DropZone = ({ onFilesSelected, disabled = false, maxFileSize, allowedTypes }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getAcceptedFormats = () => {
    const formats = allowedTypes || [];
    const commonFormats = formats.map(type => {
      if (type.startsWith("image/")) return "Images";
      if (type === "application/pdf") return "PDF";
      if (type.includes("word")) return "Word";
      if (type === "text/plain") return "Text";
      return type.split("/")[1]?.toUpperCase();
    }).filter((value, index, self) => self.indexOf(value) === index);
    
    return commonFormats.slice(0, 3).join(", ");
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = ""; // Reset input
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragOver
            ? "border-primary-500 bg-primary-50 scale-[1.02]"
            : disabled
            ? "border-gray-200 bg-gray-50"
            : "border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-25"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes?.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Icon */}
        <div className="mb-6">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            isDragOver 
              ? "bg-gradient-to-br from-primary-500 to-primary-600" 
              : "bg-gradient-to-br from-primary-100 to-primary-200"
          }`}>
            <ApperIcon 
              name={isDragOver ? "Download" : "Upload"} 
              className={`w-8 h-8 ${
                isDragOver ? "text-white" : "text-primary-600"
              }`} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {isDragOver ? "Drop your files here" : "Upload your files"}
            </h3>
            <p className="text-gray-600">
              {isDragOver 
                ? "Release to start uploading" 
                : "Drag and drop files here, or click to browse"
              }
            </p>
          </div>

          {/* Action Button */}
          <div>
            <Button 
              onClick={openFileDialog} 
              disabled={disabled}
              size="lg"
              className="inline-flex items-center space-x-2"
            >
              <ApperIcon name="FolderOpen" className="w-5 h-5" />
              <span>Choose Files</span>
            </Button>
          </div>

          {/* Upload Limits */}
          <div className="text-xs text-gray-500 space-y-1">
            {maxFileSize && (
              <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
            )}
            {allowedTypes && allowedTypes.length > 0 && (
              <p>Supported formats: {getAcceptedFormats()}</p>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary-500 bg-opacity-10 rounded-xl flex items-center justify-center"
          >
            <div className="text-primary-600 font-semibold">Drop files to upload</div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default DropZone;