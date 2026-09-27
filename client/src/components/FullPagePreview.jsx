import React, { useMemo, useState } from 'react'
import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react'
import { detectDependencies } from '../utils/sandpackUtils' 
import SandPackErrorMonitor from './SandPackErrorMonitor'

const FullPagePreview = ({ files }) => {
  const [showErrorOverlay, setShowErrorOverlay] = useState(true)

  const sandpackFiles = useMemo(() => {
    const spFiles = {};
    if (!files) return {};
    for (const [path, content] of Object.entries(files)) {
      const code = typeof content === "string" ? content : content?.content || "";
      spFiles[path] = { code };
    }
    return spFiles;
  }, [files])

  const dependencies = useMemo(() => {
    if (!files) return {};
    return detectDependencies(files)
  }, [files])

  return (
    <div className='w-full h-full'>
      <SandpackProvider
        template='react'
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          ],
          logLevel: 0,
        }}
        className='w-full h-full'
      >
        <SandPackErrorMonitor onErrorChange={setShowErrorOverlay} />
        <SandpackLayout className='!h-full !border-0 !rounded-none'>
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
            showSandpackErrorOverlay={showErrorOverlay}
            className='!h-full'
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}

export default FullPagePreview