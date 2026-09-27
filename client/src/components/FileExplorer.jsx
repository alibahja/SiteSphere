import { FileCodeIcon, FileTextIcon, FolderIcon } from 'lucide-react';
import React, { useMemo } from 'react'

function buildTree(paths) {
  const root = [];
  for (const filePath of [...paths].sort()) {
    const parts = filePath.split("/").filter(Boolean)
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = "/" + parts.slice(0, i + 1).join("/");
      let existing = current.find((n) => n.name === name)

      if (!existing) {
        existing = {
          name,
          path: fullPath,
          isDir: !isLast,
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }
  return root;
}

function getFileIcon(name) {
  if (name.endsWith(".jsx") || name.endsWith(".js")) return <FileCodeIcon size={13} />
  return <FileTextIcon size={13} />
}

function TreeItem({ node, activeFile, onFileSelect, depth = 0 }) {
  const isActive = node.path === activeFile;
  const indent = { paddingLeft: `${depth * 12 + 8}px` };

  if (node.isDir) {
    return (
      <div>
        <div
          className='flex items-center gap-2 py-1 text-xs font-medium select-none text-zinc-500'
          style={indent}
        >
          <FolderIcon size={13} />
          <span className='truncate'>{node.name}</span>
        </div>
        {node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            depth={depth + 1}
          />
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      style={indent}
      className={`flex items-center gap-2 w-full py-1 pr-2 text-xs rounded-md transition text-left ${
        isActive
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {getFileIcon(node.name)}
      <span className='truncate'>{node.name}</span>
    </button>
  )
}

const FileExplorer = ({ files, activeFile, onFileSelect }) => {
  const tree = useMemo(() => buildTree(Object.keys(files)), [files])

  return (
    <div className='flex flex-col h-full'>
      <div className='px-3 py-2 border-b border-zinc-200'>
        <p className='text-[10px] font-semibold tracking-widest uppercase text-zinc-400'>
          Files
        </p>
      </div>
      <div className='flex-1 p-2 overflow-y-auto'>
        {tree.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default FileExplorer