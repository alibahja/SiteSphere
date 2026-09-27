//Zod is a schema-validation library for JavaScript. You describe a shape, and Zod:
//Generates JSON Schema — which is what the AI SDK uses to constrain the LLM

import { z } from "zod";  // z is Zod namespace. Every schema starts with z.object({...}), z.string(), z.array(...)

//it describes this shape:
//  {
//      files: { "/App.js": "code...", "/styles.css": "css..." },
//      description: "Generated project"
//  }
export const GenerationResultSchema = z.object({
    files: z.record(z.string(),  z.string()), //plain object where every key is string and every value is a string
    //Equivalent to Record<string, string> in TypeScript. So files is a flat map of path → code.

    description: z.string().default('Generated project') // string but if AI omits, Zod uses 'Generated project' as the default.
})

// describes file operation: the essential unit for revision
//{
//  op: "create",          // or "update" or "delete"
//  path: "/components/Hero.js",
//  content: "import React...",    // only used for "create"
//  search: "...",                 // only used for "update"
//  replace: "..."                 // only used for "update"
//}
export const FileOpSchema = z.object({
    op: z.enum(["create", "update", "delete"]), //restricts the value to one of these three strings
    path: z.string(), //file path
    content: z.string().nullable().optional(), //new content file: must be a string can also be null and can also be missing entirely
    search: z.string().nullable().optional(), //update ops require search and replace, delete ops require neither
    replace: z.string().nullable().optional(),
})

//it describes this shape: 
//{
//  operations: [
//    { op: "update", path: "/App.js", search: "...", replace: "..." },
//    { op: "create", path: "/components/New.js", content: "..." }
//  ],
//  description: "Added a new component and updated the main file"
//}
export const RevisionResultSchema = z.object({
    operations: z.array(FileOpSchema), // an array of file ops. The AI returns the list of operations it wants to apply
    description: z.string().default('Applied revisions') // a human readable summary shown to user in the chat.
})

// describes this shape:
//{
//  files: [
//    { path: "/App.js", description: "Main entry", exports: "default App", imports: ["./styles.css"] },
//    { path: "/components/Hero.js", description: "Landing hero", exports: "Hero", imports: ["react"] },
//    ...
//  ],
//  projectName: "Portfolio Website",
//  projectDescription: "A modern portfolio with hero, about, projects, and contact sections"
//}
export const FilePlanSchema = z.object({
    files: z.array(
        z.object({
            path: z.string(), // where is the AI lives
            description: z.string(), // the AI's breif on what to write
            exports: z.string().optional().default(""), //optional, defaults to ""
            imports: z.array(z.string()).optional().default([]), //optinal, defaults to []
        })
    ),
    projectName: z.string().default('Generated Project'),
    projectDescription: z.string().default('A React project')
})

// most used, it returns the return type for each file
// it describes this shape:
//{
//  code: "import React from 'react';\n\nexport default function App() {...}"
//}
export const FileCodeSchema = z.object({
    code: z.string(),
})


// User submits prompt
//         ↓
// generateProject runs
//         ↓
// PHASE 1: Plan the structure
//     generateObject({
//         schema: FilePlanSchema,       ← list of files with descriptions
//         prompt: "Plan a React website for: ..."
//     })
//         ↓
//     Result: { files: [...], projectName, projectDescription }
//         ↓
// PHASE 2: Generate each file
//     For each file in plan.files:
//         generateObject({
//             schema: FileCodeSchema,   ← just the code for ONE file
//             prompt: "Write the code for: /App.js"
//         })
//         ↓
//     Result per file: { code: "..." }
//         ↓
//     Combined: { "/App.js": "code", "/styles.css": "css", ... }
//         ↓
// User sends a revision
//         ↓
// reviseProject runs
//         ↓
//     generateObject({
//         schema: RevisionResultSchema,  ← array of file operations
//         prompt: "Add dark mode"
//     })
//         ↓
//     Result: { operations: [...], description: "..." }
//         ↓
// applyOperations(currentFiles, operations)
//         ↓
// New files map → DB