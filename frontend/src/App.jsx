import React from 'react';
import Upload from './components/Upload';
import Chat from './components/Chat';
import { Sparkles } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-900/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Nexus<span className="text-primary-500 font-medium">Research</span>
            </h1>
          </div>
          <div className="text-sm text-gray-400 hidden sm:block">
            Powered by LangChain & Pinecone
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-8">
          
          {/* Left Column - Upload */}
          <div className="lg:col-span-4 h-full">
            <Upload />
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-8 h-[60vh] lg:h-full">
            <Chat />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
