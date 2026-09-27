// purpose:
// Sets up the OpenRouter client (one-time on module load)
// generateProject — creates a brand-new project (Phase 1: plan → Phase 2: write files in parallel with retries)
// reviseProject — modifies an existing project using search/replace operations

//Key architecture decision: this file never touches the database. It only:
// Calls the LLM
// Runs the returned code through normalizeContent and validateAndFixCode
// Returns data to the caller

import { createOpenAI } from '@ai-sdk/openai'  //builds openAI compatible client. Points it at OpenRouter
import { generateObject } from 'ai';   //The AI SDK function that calls an LLM and forces a JSON response matching a Zod schema.
import pMap from "p-map"; //"Promise map" — like map() but with a concurrency limit. Runs 6 tasks at once instead of all 11.
import { FileCodeSchema, FilePlanSchema, RevisionResultSchema } from './aiSchemas.js'; //The Zod shapes
import { buildFileCodeSystem, FILE_PLAN_SYSTEM, REVISE_SYSTEM } from './prompts.js'; //gets system prompts
import { normalizeContent } from './contentNormalizer.js';   // fixes double escaped strings
import { validateAndFixCode, validateRevisionContent } from './codeValidator.js';  //post generation fixes

// --- Fail fast if env is misconfigured ---
if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY must be set in environment variables");
}

// --- OpenRouter Model Client Setup ---
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const MAX_CONCURRENCY = parseInt(process.env.AI_MAX_CONCURRENCY || "6", 10); //how many files to genrate at once. Default is 6

const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

const model = openrouter(MODEL); // the configured instance passed through every generateObject call.

// Generate a single file's code. This is called by generateProject in Phase 2 once per file
//file — the plan entry: { path, description, exports, imports }
//alreadyGeneratedFiles — { path: code, ... } of files already written. Lets the AI match style/names.
async function generateSingleFile(file, allFiles, prompt, alreadyGeneratedFiles) {
    const system = buildFileCodeSystem(allFiles, alreadyGeneratedFiles);

    // Structure: 
    // Project: [user's original prompt]
    // Write the complete code for: /components/Hero.js
    // Purpose: Landing hero with headline and CTA
    const userMsg = `Project: ${prompt}\n\nWrite the complete code for: ${file.path}\nPurpose: ${file.description}`;

    console.log(`[AI] Creating file: ${file.path}...`);
    const { object } = await generateObject({
        model,
        schema: FileCodeSchema, //SDK converts Zod schema to JSON schema and passes it as response.format
        system,
        prompt: userMsg,
        maxRetries: 2, // if the api failes (invalid JSON, rate limit) retry up to two times
    });

    let code = normalizeContent(object.code);

    if (code.trim().length === 0) {
        throw new Error("Generated code is empty after normalization");
    }

    // Apply post-generation validation and auto-fixing
    const validation = validateAndFixCode(code, file.path, { allPlannedFiles: allFiles });

    code = validation.code;

    if (validation.warnings.length > 0) {
        console.log(`[Validator] Code adjustments for ${file.path}:\n  - ${validation.warnings.join("\n  - ")}`);
    }

    console.log(`[AI] Created file: ${file.path} (${code.length} chars)`);
    return { path: file.path, code };  // returns the path and code. Any warnings are logged out but not returned
} 

// Generate project files: plan first, then build files in order with fallback retries
// full generation pipeline. Returns { files, description }.
// callbacks is { onPlan, onFileStart, onFileComplete } — passed in 
// from projectController.runBackgroundGeneration so the controller can update the DB as things progress.
// Why two phases?
// Risk reduction — planning is one small call. If it fails, retry once, not 11 times.
// Deterministic structure — you get a fixed list of files to build.
// Better AI output — the LLM focuses on one job at a time: decide WHAT, then decide HOW.
// UI progress — you can show the user a plan instantly.
export async function generateProject(prompt, callbacks) {
    // Phase 1: Plan
    console.log(`[AI] Phase 1: Planning file structure for: "${prompt.slice(0, 80)}..."`);
    const { object: plan } = await generateObject({
        model,
        schema: FilePlanSchema,
        system: FILE_PLAN_SYSTEM,
        prompt: `Plan a React website for: ${prompt}`,
        maxRetries: 2,
    });

    // Guard: ensure plan.files is an array before mutating
    // if the AI returns garbage for files the next lines would throw. Gaurd replaces it with an empty string
    if (!Array.isArray(plan.files)) {
        plan.files = [];
    }

    // the app assumes /App.js exists (that's the Sandpack entry point). If the AI forgot it, generation fails
    // unshift puts /App.js first
    if (!plan.files.find((f) => f.path === "/App.js")) {
        plan.files.unshift({
            path: "/App.js",
            description: "Main application entry point",
            exports: "default App",
            imports: ["./styles.css"],
        });
    }
    // push puts /style.css last
    if (!plan.files.find((f) => f.path === "/styles.css")) {
        plan.files.push({
            path: "/styles.css",
            description: "Global CSS: Google Font import, keyframe animations, utility classes",
            exports: "none",
            imports: [],
        });
    }

    //What the callback does (in projectController).
    //Updates DB: { status: "generating", filesPlanned: plan.files, name: plan.projectName }
    // Appends a chat message with the file list
    if (callbacks?.onPlan) {
        await callbacks.onPlan(plan);
    }

    console.log(`[AI] Phase 2: Generating ${plan.files.length} files in parallel (concurrency=${MAX_CONCURRENCY}): ${plan.files.map((f) => f.path).join(", ")}`);

    const files = {};
    let pendingFiles = plan.files.map((f) => ({ ...f }));  // let cause pendingFiles get reassignend in the loop below
    
    // runs 3 rounds total:
    // Round 0: all files
    // Round 1: whatever failed in round 0
    // Round 2: whatever failed in round 1
    const maxRetryRounds = 2;

    for (let round = 0; round <= maxRetryRounds; round++) {
        if (pendingFiles.length === 0) break;

        if (round > 0) {
            console.log(
                `[AI] Retry round ${round}/${maxRetryRounds} for ${pendingFiles.length} failed files: ${pendingFiles.map((f) => f.path).join(", ")}`,
            );
        }
        // How pMap works: like Array.map, but processes up to N items at a time. Here N = 6.
        const results = await pMap(
            pendingFiles,
            async (file) => {
                try {
                    if (callbacks?.onFileStart) {
                        await callbacks.onFileStart(file.path); // DB update: { currentFile: path }
                    }

                    const singleResult = await generateSingleFile(file, plan.files, prompt, files); // the AI call

                    if (callbacks?.onFileComplete) {
                        await callbacks.onFileComplete(file.path, singleResult.code); //DB update: saves the file, adds to filesGenerated
                    }
                    return { success: true, file, result: singleResult };
                } catch (err) {
                    return { success: false, file, error: err };
                }
            },
            { concurrency: MAX_CONCURRENCY },
        );

        const failedFiles = [];
        for (const entry of results) {
            if (entry.success) {
                const { path, code } = entry.result;
                files[path.startsWith("/") ? path : "/" + path] = code;
            } else {
                console.warn(`[AI] File ${entry.file.path} failed in round ${round}: ${entry.error?.message || entry.error}`);
                failedFiles.push(entry.file);
            }
        }
        pendingFiles = failedFiles;
    }
   //After all retries: if any file still failed, write a placeholder so the project doesn't break.
    if (pendingFiles.length > 0) {
        const failedPaths = pendingFiles.map((f) => f.path).join(", ");
        console.error(`[AI] Failed to generate ${pendingFiles.length} files after all retry rounds: ${failedPaths}`);

        //  Loop over EVERY failed file and write a placeholder for each
        for (const f of pendingFiles) {
            const ext = f.path.split(".").pop()?.toLowerCase();

            if (ext === "css") {
                files[f.path] = `/* ${f.description} — Generation failed, please retry */\n`;
            } else {
                files[f.path] =
                    "import React from 'react';\n\n" +
                    `// ⚠️ This file could not be generated. Please retry.\n` +
                    `// Purpose: ${f.description}\n\n` +
                    "export default function Placeholder() {\n" +
                    "  return (\n" +
                    "    <div className='p-8 text-center text-zinc-400'>\n" +
                    "      <p>⚠️ Component failed to generate. Please try again.</p>\n" +
                    "    </div>\n" +
                    "  );\n" +
                    "}\n";
            }
        }
    }

    if (!files["/App.js"]) {
        throw new Error("AI did not generate /App.js entry point");
    }

    return { files, description: plan.projectDescription };
}

// Purpose: modify an existing project based on a follow-up prompt. 
// Returns an array of file operations (create/update/delete) that the caller applies.
// manifest — list of current files [{ path, hash, size }, ...] — a summary without code
// relevantFiles — { path: code, ... } — full code of files the AI might need
// recentMessages — last few chat messages for context
export async function reviseProject(prompt, manifest = [], relevantFiles = {}, recentMessages = []) {
    const contextParts = [];

    contextParts.push("## Current Project Files (manifest)");
    contextParts.push("```");
    for (const f of manifest) {
        contextParts.push(`${f.path} (${f.hash}, ${f.size ?? 0}B)`);
    }
    contextParts.push("```");

    if (Object.keys(relevantFiles).length > 0) {
        contextParts.push("\n## File Contents (for reference)");
        for (const [path, content] of Object.entries(relevantFiles)) {
            contextParts.push(`\n### ${path}\n\`\`\`\n${content}\n\`\`\``);
        }
    }

    if (recentMessages.length > 0) {
        contextParts.push("\n## Recent Conversation");
        for (const msg of recentMessages.slice(-3)) {
            contextParts.push(`${msg.role}: ${msg.content}`);
        }
    }

    contextParts.push(`\n## Revision Request\n${prompt}`);

    console.log("[AI] Revising project...");

    const { object: rawParsed } = await generateObject({
        model,
        schema: RevisionResultSchema,
        system: REVISE_SYSTEM,
        prompt: contextParts.join("\n"),
        maxRetries: 2,
    });

    if (rawParsed && Array.isArray(rawParsed.operations)) {
        rawParsed.operations = rawParsed.operations.map((op) => {
            if (!op || typeof op !== "object") return op;

            const opStr = String(op.op || "").trim().toLowerCase();

            if (["create", "add", "new"].includes(opStr)) op.op = "create";
            else if (["update", "edit", "modify", "patch"].includes(opStr)) op.op = "update";
            else if (["delete", "remove", "del", "rm"].includes(opStr)) op.op = "delete";

            if (op.path && typeof op.path === "string" && !op.path.startsWith("/")) {
                op.path = "/" + op.path;
            }

            if (op.content) op.content = normalizeContent(op.content);
            if (op.search) op.search = normalizeContent(op.search);
            if (op.replace) op.replace = normalizeContent(op.replace);

            if (op.op === "create" && op.content) {
                const validation = validateRevisionContent(op.content, op.path, "create");
                op.content = validation.content;
                if (validation.warnings.length > 0) {
                    console.log(`[Validator] Revision Create adjustments for ${op.path}:\n  - ${validation.warnings.join("\n  - ")}`);
                }
            } else if (op.op === "update" && op.replace) {
                const validation = validateRevisionContent(op.replace, op.path, "update");
                op.replace = validation.content;
                if (validation.warnings.length > 0) {
                    console.log(`[Validator] Revision Update adjustments for ${op.path}:\n  - ${validation.warnings.join("\n  - ")}`);
                }
            }
            return op;
        });
    }
    return rawParsed;
}