import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Progress from "@/components/atoms/Progress";
import ApperIcon from "@/components/ApperIcon";
import uploadService from "@/services/api/uploadService";

const FileCard = ({ file, onRetry, onCancel }) => {
  const formatFileSize = (bytes) => uploadService.formatFileSize(bytes);
  
  const formatSpeed = (bytesPerSecond) => {
    if (bytesPerSecond === 0) return "0 B/s";
    return `${formatFileSize(bytesPerSecond)}/s`;
  };
  
  const formatTime = (seconds) => {
    if (seconds === 0 || !isFinite(seconds)) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    switch (file.status) {
      case "completed":
        return "text-success-600";
      case "error":
      case "cancelled":
        return "text-red-600";
      case "uploading":
        return "text-primary-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case "completed":
        return "CheckCircle";
      case "error":
        return "XCircle";
      case "cancelled":
        return "StopCircle";
      case "uploading":
        return "Upload";
      default:
        return "Clock";
    }
  };

  const iconName = uploadService.getFileIcon(file.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-medium transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* File Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <ApperIcon name={iconName} className="w-5 h-5 text-primary-600" />
              </div>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 truncate">{file.name}</h4>
                <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
                  <ApperIcon name={getStatusIcon()} className="w-4 h-4" />
                  <span className="text-xs font-medium capitalize">{file.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  {file.status === "uploading" && (
                    <span>{file.progress}%</span>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1.5" />
                )}

                {/* Upload Stats */}
                {file.status === "uploading" && file.uploadSpeed > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatSpeed(file.uploadSpeed)}</span>
                    <span>{formatTime(file.timeRemaining)} remaining</span>
                  </div>
                )}

                {/* Error Message */}
                {file.status === "error" && file.error && (
                  <p className="text-xs text-red-600 mt-2">{file.error}</p>
                )}

                {/* Success URL */}
                {file.status === "completed" && file.url && (
                  <div className="text-xs text-success-600">
                    Upload completed successfully
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(file.status === "error" || file.status === "cancelled") && (
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(file.id)}
                    className="text-xs"
                  >
                    <ApperIcon name="RefreshCw" className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(file.id)}
                    className="text-xs text-gray-500"
                  >
                    Remove
                  </Button>
                </div>
              )}

              {file.status === "uploading" && (
                <div className="flex items-center mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(file.id)}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FileCard;