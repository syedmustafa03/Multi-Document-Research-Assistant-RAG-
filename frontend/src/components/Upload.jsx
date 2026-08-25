import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const Upload = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setUploadStatus(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadStatus('success');
      setFiles([]);
      if (onUploadSuccess) onUploadSuccess(response.data.message);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Failed to upload documents. Check API keys.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-md mx-auto flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UploadCloud className="text-primary-400" /> 
        Upload Knowledge
      </h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex-grow flex flex-col justify-center items-center ${
          isDragActive ? 'border-primary-500 bg-primary-900/20' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-primary-400 font-medium">Drop the PDFs here ...</p>
        ) : (
          <p className="text-gray-300">Drag & drop some PDFs here, or click to select</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-6 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Selected Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, idx) => (
              <li key={idx} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <File className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span className="truncate text-gray-300">{file.name}</span>
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-800 rounded-lg flex items-start gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Documents successfully indexed!</p>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        className={`mt-6 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          files.length === 0 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/50'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Upload & Index'
        )}
      </button>
    </div>
  );
};

export default Upload;
