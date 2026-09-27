import { Project } from "../models/project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";

export function buildManifest(files) {
    const manifest = [];
    for (const [path, entry] of Object.entries(files || {})) {
        const content = typeof entry === "string" ? entry : entry?.content || "";
        manifest.push({
            path,
            hash: entry?.hash ?? "",
            size: content.length,
        });
    }
    return manifest;
}

// POST /api/projects/:id/chat
export async function chat(req, res) {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt is required" });
    }
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    let project;
    try {
        project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
    } catch (err) {
        return res.status(400).json({ error: "Invalid project id" });
    }
    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }
    // Guard against concurrent revisions
    if (project.status === "revising") {
        return res.status(409).json({ error: "A revision is already in progress" });
    }

    // Set status to revising and save user prompt
    project.status = "revising";
    project.messages.push({ role: "user", content: prompt, timestamp: new Date() });
    await project.save();

    try {
        const manifest = buildManifest(project.files);
        const relevantFiles = {};
        for (const [path, entry] of Object.entries(project.files || {})) {
            relevantFiles[path] = typeof entry === "string" ? entry : entry?.content || "";
        }

        const recentMessages = project.messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
        }));

        console.log(
            `[AI] Revising project ${project._id}: "${prompt.slice(0, 80)}..." ` +
            `(${manifest.length} files, manifest ~${JSON.stringify(manifest).length} chars)`
        );

        const result = await reviseProject(prompt, manifest, relevantFiles, recentMessages);

        console.log(`[AI] Got ${result.operations.length} operations: ${result.description}`);

        const { files: updatedFiles, applied, errors } = applyOperations(
            project.files,
            result.operations
        );
        if (errors.length > 0) {
            console.warn(`[Diff] Errors applying operations:`, errors);
        }

        project.files = updatedFiles;
        project.markModified("files");
        project.version += 1;
        project.status = "completed";
        project.error = null;
        project.messages.push({
            role: "assistant",
            content:
                result.description +
                (errors.length > 0 ? `\n\nSome operations failed: ${errors.join(", ")}` : ""),
            timestamp: new Date(),
        });
        await project.save();

        const filesObj = {};
        for (const [path, entry] of Object.entries(project.files)) {
            filesObj[path] = entry.content;
        }

        res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            messages: project.messages,
            version: project.version,
            status: project.status,
            filesPlanned: project.filesPlanned,
            filesGenerated: project.filesGenerated,
            currentFile: project.currentFile,
            applied,
            errors,
            aiDescription: result.description,
        });
    } catch (err) {
        console.error(`[AI Revision Error] ${err.message}`);
        project.status = "failed";                   // ✅ was "completed"
        project.error = err.message;
        project.messages.push({
            role: "assistant",
            content: `Revision failed: ${err.message}`,
            timestamp: new Date(),
        });
        await project.save();
        res.status(500).json({ error: err.message || "Failed to process revision request" });
    }
}