import React from "react";
import ApperIcon from "@/components/ApperIcon";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 opacity-75 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        <ApperIcon 
          name="Upload" 
          className="absolute inset-0 w-8 h-8 text-white m-auto" 
        />
      </div>
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
        <p className="text-sm text-gray-600">Preparing your upload interface</p>
      </div>
    </div>
  );
};

export default Loading;