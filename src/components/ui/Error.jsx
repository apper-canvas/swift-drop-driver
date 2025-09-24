import React from "react";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const Error = ({ message = "Something went wrong", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6">
        <ApperIcon name="AlertTriangle" className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Error</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="inline-flex items-center space-x-2">
            <ApperIcon name="RefreshCw" className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Error;