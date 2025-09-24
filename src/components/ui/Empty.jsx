import React from "react";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const Empty = ({ onUpload }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-8">
        <ApperIcon name="Upload" className="w-12 h-12 text-primary-600" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Upload</h3>
        <p className="text-gray-600 mb-6">
          Drag and drop your files here, or click the button below to select files from your device.
        </p>
        {onUpload && (
          <Button onClick={onUpload} size="lg" className="inline-flex items-center space-x-2">
            <ApperIcon name="FolderOpen" className="w-5 h-5" />
            <span>Choose Files</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Empty;