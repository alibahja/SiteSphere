import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  SandpackCodeEditor, SandpackLayout, SandpackPreview,
  SandpackProvider, useSandpack
} from '@codesandbox/sandpack-react'
import { detectDependencies } from '../utils/sandpackUtils'
import { useAppContext } from '../context/AppContext';
import SandPackErrorMonitor from './SandPackErrorMonitor';

// Watches for file edits inside Sandpack editor and saves changes to DB & live state
function SandpackFileWatcher({ onLiveFilesChange }) {
  const { sandpack } = useSandpack();
  const { files } = sandpack;
  const { activeProject, updateProjectFiles } = useAppContext();

  const activeProjectRef = useRef(activeProject)
  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject])

  useEffect(() => {
    const project = activeProjectRef.current;
    if (!project) return;
    const updatedFiles = {};
    let hasChanges = false;

    for (const [path, fileObj] of Object.entries(files)) {
      const fileCode = fileObj.code;
      updatedFiles[path] = fileCode;
      const originalContent = typeof project.files[path] === "string"
        ? project.files[path]
        : project.files[path]?.content;
      if (originalContent !== undefined && originalContent !== fileCode) {
        hasChanges = true;
      }
    }
    onLiveFilesChange(updatedFiles)
    if (hasChanges) {
      updateProjectFiles(updatedFiles)
    }
  }, [files])

  return null;
}

const PreviewPanel = ({ project, activeFile, showCode }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true)
  const [liveFiles, setLiveFiles] = useState(project.files)
  const [prevProjectKey, setPrevProjectKey] = useState(
    `${project._id}-${project.version}`
  )
  const currentKey = `${project._id}-${project.version}`;

  if (prevProjectKey !== currentKey) {
    setPrevProjectKey(currentKey);
    setLiveFiles(project.files);
  }

  const handleLiveFilesChange = (newFiles) => {
    setLiveFiles((prev) => {
      let changed = false;
      for (const [p, code] of Object.entries(newFiles)) {
        if (prev[p] !== code) { changed = true; break; }
      }
      return changed ? newFiles : prev;
    })
  }

  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    for (const [path, content] of Object.entries(liveFiles)) {
      const fileCode = typeof content === "string" ? content : content?.content || "";
      spFiles[path] = { code: fileCode, active: path === activeFile };
    }
    return spFiles;
  }, [liveFiles, activeFile])

  const dependencies = useMemo(() => detectDependencies(liveFiles), [liveFiles])

  return (
    <div className='w-full h-full bg-white'>
      <SandpackProvider
        key={project._id}
        template='react'
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          ],
          classes: {
            "sp-wrapper": "sp-wrapper",
            "sp-layout": "sp-layout",
            "sp-preview": "sp-preview",
          },
          logLevel: 0,
        }}
        theme={{
          colors: {},
          font: {}
        }}
      >
        <SandpackFileWatcher onLiveFilesChange={handleLiveFilesChange} />
        <SandPackErrorMonitor onErrorChange={setShowErrorOverlay} />
        <SandpackLayout>
          {showCode && (
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
            />
          )}
          <SandpackPreview
            showNavigator={false}
            showRefreshButton
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}

export default PreviewPanel