import { Project } from "../models/project.js";
import crypto from "crypto";
import { generateProject } from "../services/ai.js";

function hashContent(content) {  //creates a short fingerprint of a file's content
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
  // Md5 algorithm (fast,fine for changed detection), produces a 32-char hex string then truncates to 12 chars.
}

// POST /api/projects
export async function createProject(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
   // inserts a project document into MongoDB with placeholder data. The AI hasn't run yet. Status = "pending".
    const project = await Project.create({
      name: "Planning project...",
      files: {},
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "Planning project structure..." },
      ],
      version: 0,
      owner: req.user.userId,
      status: "pending",
      filesPlanned: [],
      filesGenerated: [],
      currentFile: null,
      error: null,
    });
    
    //No await since ai may take time, we attach a catch handler so unhandled rejections don't crash the server
    //project._id.toString() — converts the ObjectId to a string, because findByIdAndUpdate accepts both, 
    // but strings are safer to pass around
    runBackgroundGeneration(project._id.toString(), prompt).catch((err) => {
      console.error(`[Background AI] Fatal generation error for project ${project._id}:`, err);
    });
    
    // respond immedialtly, the files are still empty and the state is still pending
    res.status(201).json({
      _id: project._id,
      name: project.name,
      description: project.description,
      files: {},
      messages: project.messages,
      version: project.version,
      status: project.status,
      filesPlanned: project.filesPlanned,
      filesGenerated: project.filesGenerated,
      currentFile: project.currentFile,
      createdAt: project.createdAt,
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

//It orchestrates the entire AI generation flow and updates the DB in real-time.
async function runBackgroundGeneration(projectId, prompt) {
  try {
    console.log(`[Background AI] Starting generation for project ${projectId}`);
    const result = await generateProject(prompt, {
      onPlan: async (plan) => {
        console.log(`[Background AI] Plan created for project ${projectId}. Planned ${plan.files.length} files.`);
        const fileList = plan.files
          .map((file) => `- \`${file.path}\`: ${file.description}`)   //builds a formatted markdown list of planned files
          .join("\n");

        await Project.findByIdAndUpdate(projectId, {
          name: plan.projectName || "Generated Project",
          status: "generating",
          filesPlanned: plan.files,
          $push: {
            messages: {
              role: "assistant",
              content: `Planned website structure:\n${fileList}`,
              timestamp: new Date(),                                  //  lowercase
            },
          },
        });
      },
      onFileStart: async (path) => {
        console.log(`[Background AI] Starting file ${path} for project ${projectId}`);
        await Project.findByIdAndUpdate(projectId, { currentFile: path }); // the currentfile is for the frontend which uses it to show 
        // the active file being generated
      },
      onFileComplete: async (path, code) => {                     //  add code param
        console.log(`[Background AI] Finished file ${path} for project ${projectId}`);
        const project = await Project.findById(projectId);
        if (project) {
          project.files = project.files || {};
          project.files[path] = { content: code, hash: hashContent(code) };  //adds the generated file to the map 
          project.filesGenerated = [...(project.filesGenerated || []), path]; //appends path to the completed list
          project.messages.push({
            role: "assistant",
            content: `Created file "${path}"`,
            timestamp: new Date(),
          });
          project.currentFile = null;  //clears the active file indicator
          project.markModified("files"); // files is a Mixed type so mongoose doesn't automatically detect changes inside it.
          // without markModified, .save() would think nothing changed and skip the DB write. Files would never be saved
          await project.save();  //writed to db
        }
      },
    });

    console.log(`[Background AI] Successfully generated project ${projectId}`);
    const project = await Project.findById(projectId);
    if (project) {
      project.status = "completed";
      project.version = 1; //first real version
      if (result.description) project.name = result.description;  //update name from AI's plan to description
      project.messages.push({
        role: "assistant",
        content: "Website generation complete! You can view and edit the files.",
        timestamp: new Date(),
      });
      await project.save();
    }
  } catch (err) {
    console.error(`[Background AI] Fatal generation error for project ${projectId}`, err);
    await Project.findByIdAndUpdate(projectId, {
      status: "failed",
      error: err.message,
      $push: {
        messages: {
          role: "assistant",
          content: `Generation failed: ${err.message}`,
          timestamp: new Date(),
        },
      },
    });
  }
}

// GET /api/projects
export async function listProjects(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const projects = await Project.find(
      { owner: req.user.userId },
      { name: 1, description: 1, version: 1, createdAt: 1, updatedAt: 1 } //returns only these files cause files,messages can be huge
    ).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("List projects error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/projects/:id
export async function getProject(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    //the DB stores files as { [path]: { content, hash } }, but the frontend expects just { [path]: content }. 
    // This loop strips the hash and flattens the shape.
    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
      filesObj[path] = entry.content;
    }

    res.json({                                                     //  res
      _id: project._id,
      name: project.name,
      description: project.description,
      files: filesObj,                                             //  no nesting
      messages: project.messages,
      version: project.version,
      status: project.status,
      filesPlanned: project.filesPlanned,
      filesGenerated: project.filesGenerated,
      currentFile: project.currentFile,
      error: project.error,                                        //  include error
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE /api/projects/:id
export async function deleteProject(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const result = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!result) return res.status(404).json({ error: "Project not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// PUT /api/projects/:id/files
export async function updateProjectFiles(req, res) {
  try {
    const { files } = req.body;
    if (!files || typeof files !== "object") {
      return res.status(400).json({ error: "files object is required" });
    }
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    //Iterates every file in the request body
    //Skips anything that isn't a string (defensive) and Rebuilds the map in DB shape: { content, hash }
    const newFiles = {};
    for (const [path, content] of Object.entries(files)) {
      if (typeof content === "string") {
        newFiles[path] = { content, hash: hashContent(content) };
      }
    }
    project.files = newFiles;  //means mongoos does detect the change. No markModified needed here.
    await project.save();

    const filesObj = {};                                          //  was missing
    for (const [path, entry] of Object.entries(project.files)) {
      filesObj[path] = entry.content;
    }

    res.json({
      _id: project._id,
      name: project.name,
      description: project.description,
      files: filesObj,                                            //  no nesting
      messages: project.messages,
      version: project.version,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    console.error("Update files error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST /api/projects/:id/publish
export async function publishProject(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { published: true, publishedAt: new Date() },
      { returnDocument: "after" }  // returns the updated document (no the one before)
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ success: true, published: project.published });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/projects/public/:id
export async function getPublicProject(req, res) {
  try {
    //  only return published projects
    const project = await Project.findOne({
      _id: req.params.id,
      published: true,
    });
    if (!project) return res.status(404).json({ error: "Project not found or not published" });

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
      filesObj[path] = entry.content;
    }

    res.json({
      _id: project._id,
      name: project.name,
      description: project.description,
      files: filesObj,
      version: project.version,
    });
  } catch (err) {
    console.error("Get public project error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}



//User submits prompt
//       ↓
//POST /api/projects → createProject
//    - Create doc { status: "pending" }
//    - Fire runBackgroundGeneration (no await)
//    - Return 201 with _id
//        ↓
//Frontend navigates to /builder/:id
//        ↓
//BuilderPage polls every 2s → GET /api/projects/:id → getProject
//       ↓
//Meanwhile, in the background:
//    generateProject runs
//        ↓
//    onPlan → DB update { status: "generating", filesPlanned }
//        ↓
//    onFileStart → DB update { currentFile }
//        ↓
//    onFileComplete → DB update { files, filesGenerated }  (x11 times)
//        ↓
//    Post-completion → DB update { status: "completed", version: 1 }
//        ↓
//Frontend's next poll sees status: "completed" → shows PreviewPanel
//        ↓
//User edits files in Sandpack → debounced PUT /api/projects/:id/files → updateProjectFiles
//        ↓
//User clicks Publish → POST /api/projects/:id/publish → publishProject
//        ↓
//Visitor opens /publish/:id → GET /api/projects/public/:id → getPublicProject