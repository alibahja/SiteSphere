import crypto from "crypto";

const FORBIDDEN_PATHS = ["__proto__", "constructor", "prototype"];

export function hashContent(content) {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
}

export function applyOperations(currentFiles, operations) {
    const files = { ...(currentFiles || {}) };
    const applied = [];
    const errors = [];

    for (const op of operations || []) {
        //  Validate op shape
        if (!op || typeof op !== "object") {
            errors.push(`invalid operation: ${JSON.stringify(op)}`);
            continue;
        }
        if (typeof op.path !== "string" || !op.path) {
            errors.push(`operation missing path: ${JSON.stringify(op)}`);
            continue;
        }

        //  Normalize path
        const path = op.path.startsWith("/") ? op.path : "/" + op.path;

        //  Block prototype pollution
        if (FORBIDDEN_PATHS.includes(path.replace(/^\//, ""))) {
            errors.push(`forbidden path: ${path}`);
            continue;
        }

        try {
            switch (op.op) {
                case "create": {
                    if (!op.content) {
                        errors.push(`create ${path}: missing content`);
                        break;
                    }
                    files[path] = {
                        content: op.content,
                        hash: hashContent(op.content),
                    };
                    applied.push(`created ${path}`);
                    break;
                }

                case "update": {
                    const existing = files[path];
                    if (!existing) {
                        errors.push(`update ${path}: file not found`);
                        break;
                    }
                    if (!op.search || op.replace == null) {
                        errors.push(`update ${path}: missing search/replace`);
                        break;
                    }

                    const newContent = searchReplace(existing.content, op.search, op.replace);

                    if (newContent === null) {
                        errors.push(`update ${path}: search string not found`);
                        break;
                    }

                    files[path] = {
                        content: newContent,
                        hash: hashContent(newContent),
                    };
                    applied.push(`updated ${path}`);
                    break;
                }

                case "delete": {
                    if (files[path]) {
                        delete files[path];
                        applied.push(`deleted ${path}`);
                    } else {
                        errors.push(`delete ${path}: file not found`);
                    }
                    break;
                }

                default:
                    errors.push(`unknown op: ${op.op}`);
            }
        } catch (err) {
            errors.push(`${op.op} ${path}: ${err.message}`);
        }
    }

    return { files, applied, errors };
}

// Search and replace code with fallback whitespace normalization matching
function searchReplace(content, search, replacement) {
    // 1. Try exact match
    if (content.includes(search)) {
        return content.replace(search, () => replacement);
    }

    // 2. Normalized fallback
    const normalizeWs = (s) =>
        s
            .split("\n")
            .map((line) => line.replace(/\s+/g, " ").trim())
            .join("\n")
            .trim();

    const normalizedContent = normalizeWs(content);
    const normalizedSearch = normalizeWs(search);

    if (normalizedContent.includes(normalizedSearch)) {
        const searchLines = normalizedSearch.split("\n");
        const contentLines = content.split("\n");

        for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
            let match = true;
            for (let j = 0; j < searchLines.length; j++) {
                if (normalizeWs(contentLines[i + j]) !== searchLines[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                const before = contentLines.slice(0, i);
                const after = contentLines.slice(i + searchLines.length);
                return [...before, replacement, ...after].join("\n");
            }
        }
    }

    return null;
}