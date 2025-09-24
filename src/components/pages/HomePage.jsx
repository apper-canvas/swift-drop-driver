import React from "react";
import FileUploader from "@/components/organisms/FileUploader";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto py-8">
        <FileUploader />
      </div>
    </div>
  );
};

export default HomePage;