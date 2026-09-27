import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import BuilderHeader from '../components/BuilderHeader';
import { FolderTreeIcon, MessageSquareIcon } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';
import FileExplorer from '../components/FileExplorer';
import PreviewPanel from '../components/PreviewPanel';
import AgentProgressDashboard from '../components/AgentProgressDashboard';
import PublishModel from '../components/PublishModel';
import api from '../api/api';
import toast from 'react-hot-toast';
import { exportProjectZip } from '../utils/exportProject';

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leftTab, setLeftTab] = useState("chat");
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);

  const {
    activeProject, loadingActiveProject, activeFile, showCode,
    setActiveFile, setShowCode, loadProject, logout, chatLoading, handleChat
  } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id)  
  }, [id])

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank")
  }

  const handlePublish = async () => {
    if (!id) return
    setPublishing(true)
    try {
      await api.post(`/api/projects/${id}/publish`);
      const url = `${window.location.origin}/publish/${id}`;
      setPublishUrl(url);
      toast.success("Website published successfully!")
    } catch (err) {
      console.error("Publish failed: ", err);
      toast.error(err?.response?.data?.error || "Publish failed");
    } finally {
      setPublishing(false)
    }
  }

  const handleDownload = () => {
    if (!activeProject) return;
    exportProjectZip(activeProject)
  }

  if (loadingActiveProject || !activeProject) {
    return <Loading />
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-zinc-50'>
      {/* Top Bar Header */}
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        showCode={showCode}
        publishing={publishing}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDownload={handleDownload}
        onBack={() => navigate("/")}
        onLogout={logout}
      />

      {/* Main Layout */}
      <div className='flex flex-1 min-h-0'>
        {/* Left Sidebar */}
        <div className='flex flex-col w-full border-r md:w-80 lg:w-96 shrink-0 border-zinc-200 bg-white'>
          {/* Sidebar Tabs */}
          <div className='flex items-center p-2 gap-1 border-b border-zinc-200 bg-zinc-50/60'>
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                leftTab === "chat"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"
              }`}
            >
              <MessageSquareIcon size={14} /> Chat
            </button>
            <button
              onClick={() => setLeftTab("files")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                leftTab === "files"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"
              }`}
            >
              <FolderTreeIcon size={14} /> Files
            </button>
          </div>

          {/* Sidebar Content */}
          <div className='flex-1 min-h-0 overflow-hidden'>
            {leftTab === "chat" ? (
              <ChatPanel
                messages={activeProject.messages}
                onSend={handleChat}
                loading={chatLoading}
              />
            ) : (
              <FileExplorer
                files={activeProject.files}
                activeFile={activeFile}
                onFileSelect={(path) => {
                  setActiveFile(path)
                  setShowCode(true)
                }}
              />
            )}
          </div>
        </div>

        {/* Preview / Code Area */}
        <div className='flex-1 min-w-0 overflow-hidden'>
          {activeProject.status === "generating" ||
          activeProject.status === "pending" ||
          activeProject.status === "failed" ? (
            <AgentProgressDashboard project={activeProject} />
          ) : (
            <PreviewPanel
              project={activeProject}
              activeFile={activeFile}
              showCode={showCode}
            />
          )}
        </div>
      </div>

      {publishUrl && (
        <PublishModel
          publishUrl={publishUrl}
          onClose={() => setPublishUrl(null)}
        />
      )}
    </div>
  )
}

export default BuilderPage