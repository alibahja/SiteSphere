import { CheckCircle2Icon, CircleIcon, Loader2Icon } from "lucide-react";

export default function AgentProgressDashboard({ project }) {
  const planned = project.filesPlanned || [];
  const completed = project.filesGenerated || [];
  const current = project.currentFile;
  const isFailed = project.status === "failed";

  const percent = planned.length
    ? Math.round((completed.length / planned.length) * 100)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 overflow-y-auto bg-zinc-50 md:p-12">
      <div className="relative w-full max-w-xl p-6 overflow-hidden bg-white border shadow-sm md:p-8 border-zinc-200 rounded-2xl">
        {/* Status Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-medium text-zinc-800">
              {isFailed
                ? "Generation failed"
                : project.status === "pending"
                  ? "Planning architecture…"
                  : "AI agent is building…"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {isFailed
                ? "An error occurred during build"
                : "Writing production-ready React codebase"}
            </p>
          </div>
        </div>

        {isFailed && project.error && (
          <div className="p-4 mb-6 text-sm font-medium border rounded-lg bg-red-50 border-red-100 text-red-700">
            <span className="font-semibold">Error: </span>
            {project.error}
          </div>
        )}

        {/* Progress bar */}
        {planned.length > 0 && !isFailed && (
          <div className="mb-6">
            <div className="flex justify-between mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-400">
              <span>Progress</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full transition-all duration-500 ease-out bg-zinc-800"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Files checklist */}
        {planned.length > 0 ? (
          <div>
            <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Planned files ({completed.length}/{planned.length})
            </span>
            <div className="pr-1 space-y-2.5 max-h-75 overflow-y-auto">
              {planned.map((file) => {
                const isCompleted = completed.includes(file.path);
                const isGenerating = current === file.path;

                return (
                  <div
                    key={file.path}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      isGenerating
                        ? "bg-zinc-50 border-zinc-300"
                        : isCompleted
                          ? "bg-white border-zinc-200"
                          : "bg-white border-zinc-100 opacity-60"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2Icon size={16} className="shrink-0 text-emerald-500" />
                    ) : isGenerating ? (
                      <Loader2Icon size={16} className="shrink-0 animate-spin text-zinc-900" />
                    ) : (
                      <CircleIcon size={16} className="shrink-0 text-zinc-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          isGenerating ? "text-zinc-900" : "text-zinc-700"
                        }`}
                      >
                        {file.path}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {file.description}
                      </p>
                    </div>
                    {isGenerating && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !isFailed && (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
              <Loader2Icon size={24} className="mb-2 animate-spin" />
              <p className="text-xs">
                Analyzing requirements and designing project structure…
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}