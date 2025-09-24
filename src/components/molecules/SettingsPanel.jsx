import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/Card";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Label from "@/components/atoms/Label";

const SettingsPanel = ({ settings, onSettingsChange, isOpen, onToggle }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  };

  const parseFileSize = (value, unit) => {
    const num = parseFloat(value) || 0;
    const multipliers = { "Bytes": 1, "KB": 1024, "MB": 1024 * 1024, "GB": 1024 * 1024 * 1024 };
    return num * (multipliers[unit] || 1);
  };

  const handleMaxFileSizeChange = (value) => {
    const newSize = parseFileSize(value, "MB");
    const updated = { ...localSettings, maxFileSize: newSize };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleConcurrentUploadsChange = (value) => {
    const updated = { ...localSettings, maxConcurrentUploads: parseInt(value) || 1 };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleAutoCompressChange = (checked) => {
    const updated = { ...localSettings, autoCompress: checked };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Settings Toggle Button */}
      <Button
        variant="outline"
        onClick={onToggle}
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <ApperIcon name="Settings" className="w-4 h-4" />
          <span>Upload Settings</span>
        </div>
        <ApperIcon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          className="w-4 h-4" 
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <ApperIcon name="Settings" className="w-5 h-5 text-primary-600" />
                  <span>Upload Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Max File Size */}
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={formatFileSize(localSettings.maxFileSize)}
                      onChange={(e) => handleMaxFileSizeChange(e.target.value)}
                      className="flex-1"
                      min="1"
                      max="100"
                    />
                    <span className="text-sm text-gray-500 px-2">MB</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current limit: {formatFileSize(localSettings.maxFileSize)} MB
                  </p>
                </div>

                {/* Max Concurrent Uploads */}
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Concurrent Uploads</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    value={localSettings.maxConcurrentUploads}
                    onChange={(e) => handleConcurrentUploadsChange(e.target.value)}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500">
                    Number of files to upload simultaneously
                  </p>
                </div>

                {/* Auto Compress */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      id="autoCompress"
                      type="checkbox"
                      checked={localSettings.autoCompress}
                      onChange={(e) => handleAutoCompressChange(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <Label htmlFor="autoCompress">Auto-compress images</Label>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">
                    Automatically compress images to reduce upload time
                  </p>
                </div>

                {/* Supported Formats Info */}
                <div className="space-y-2">
                  <Label>Supported File Types</Label>
                  <div className="text-xs text-gray-600 bg-white p-3 rounded-md border">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <strong>Images:</strong> JPEG, PNG, GIF, WebP
                      </div>
                      <div>
                        <strong>Documents:</strong> PDF, Word, Text
                      </div>
                      <div>
                        <strong>Media:</strong> MP4, MOV, MP3, WAV
                      </div>
                      <div>
                        <strong>Archives:</strong> ZIP, CSV
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPanel;