/**
 * Knowledge Graph Ingestion Script for Codebases (Node.js)
 *
 * This script traverses a specified directory, parses JavaScript/TypeScript files
 * to identify entities (Files, Classes, Functions) and their relationships (Imports),
 * and loads them into a MongoDB collection using the Model Context Protocol (MCP) schema.
 *
 * This version is optimized for Next.js/React directory and import conventions.
 *
 * NOTE: The user must install the 'mongodb' package (npm install mongodb) and run this
 * script via Node.js (node knowledgeGraphIngest.js).
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// --- UTILITY: ENVIRONMENT FILE LOADING ---

/**
 * Reads and parses a simple .env file (KEY=VALUE format).
 * @param {string} filePath The path to the .env file (e.g., '.env.local').
 * @returns {Object} An object containing the parsed environment variables.
 */
function loadEnvFile(filePath) {
    const env = {};
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        fileContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                // Split only on the first '=' to allow '=' in the value
                const parts = trimmedLine.match(/^([^=]+)=(.*)$/);
                if (parts && parts.length === 3) {
                    const key = parts[1].trim();
                    let value = parts[2].trim();
                    // Remove quotes from value if present (e.g., MONGODB_URI="mongodb://...")
                    value = value.replace(/^['"]|['"]$/g, '');
                    env[key] = value;
                }
            }
        });
    } catch (error) {
        // Silently ignore if file doesn't exist or is unreadable.
    }
    return env;
}

// --- CONFIGURATION ---

const env = loadEnvFile('.env.local');

// IMPORTANT: Prioritize MONGODB_URI from .env.local, then process.env, then the default.
const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI || "mongodb://localhost:27017";

const DB_NAME = "CodeKnowledge";
const COLLECTION_NAME = "code_entities";
// Target directory set to current directory (project root, typical for Next.js)
const TARGET_DIR = path.resolve('.'); 

// --- DATA STRUCTURE DEFINITIONS ---

// Define the structure for a Node/Entity document in MongoDB
const NodeSchema = {
    // Unique identifier for the entity (e.g., file path, class/function name)
    _id: String,
    // The type of entity: 'File', 'Class', 'Function', 'Module'
    type: String,
    // The name of the entity (short name, e.g., 'UserService')
    name: String,
    // Key/value properties (e.g., 'filePath', 'linesOfCode')
    properties: Object,
    // Relationships (Edges) defined as an array of objects
    relationships: [{
        // The type of relationship (e.g., 'IMPORTS', 'CALLS', 'DEFINES')
        type: String,
        // The ID of the target entity (Node)
        targetId: String,
        // Optional properties of the relationship
        properties: Object
    }]
};

// --- CORE PARSING LOGIC (SIMPLIFIED) ---

/**
 * Simulates AST parsing to extract structural entities and dependencies.
 * This is a simplified implementation using regex/string matching.
 *
 * @param {string} codeContent The content of the file.
 * @param {string} filePath The full path of the file.
 * @returns {Array<NodeSchema>} An array of extracted nodes.
 */
function parseCodeForEntitiesAndRelationships(codeContent, filePath) {
    const nodes = [];
    const lines = codeContent.split('\n');

    const fileNodeId = path.relative(TARGET_DIR, filePath);
    const fileName = path.basename(filePath);

    // 1. Create the primary File Node
    const fileNode = {
        _id: fileNodeId,
        type: 'File',
        name: fileName,
        properties: {
            filePath: filePath,
            linesOfCode: lines.length,
            language: fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? 'TypeScript' : 'JavaScript'
        },
        relationships: []
    };
    nodes.push(fileNode);

    // Regex patterns for simplified extraction
    const CLASS_REGEX = /^(?:export\s+)?class\s+([A-Za-z0-9_]+)/;
    const FUNCTION_REGEX = /^(?:export\s+)?(?:const|function|async\s+function)\s+([A-Za-z0-9_]+)\s*=?\s*\([^)]*\)\s*=>?\s*{?/;
    // Updated regex to capture both relative imports (./ or ../) and common absolute path aliases (@/ or ~/)
    const IMPORT_REGEX = /import\s+.*from\s+['"](?:\.\/|\.\.\/|@\/|~)([^'"]+)['"]/; 

    lines.forEach((line, index) => {
        // A. Extract Classes
        let match = line.match(CLASS_REGEX);
        if (match) {
            const className = match[1];
            const classNodeId = `${fileNodeId}::Class:${className}`;
            nodes.push({
                _id: classNodeId,
                type: 'Class',
                name: className,
                properties: { definitionLine: index + 1, file: fileNodeId },
                relationships: []
            });
            // Relationship: File DEFINES Class
            fileNode.relationships.push({
                type: 'DEFINES_CLASS',
                targetId: classNodeId,
                properties: { visibility: 'exported' }
            });
        }

        // B. Extract Functions
        match = line.match(FUNCTION_REGEX);
        if (match) {
            const functionName = match[1];
            const functionNodeId = `${fileNodeId}::Function:${functionName}`;
            nodes.push({
                _id: functionNodeId,
                type: 'Function',
                name: functionName,
                properties: { definitionLine: index + 1, file: fileNodeId },
                relationships: []
            });
            // Relationship: File CONTAINS Function
            fileNode.relationships.push({
                type: 'CONTAINS_FUNCTION',
                targetId: functionNodeId,
                properties: {}
            });
        }

        // C. Extract Imports (Dependencies)
        match = line.match(IMPORT_REGEX);
        if (match) {
            let importedModulePath = match[1];
            let absoluteImportPath;

            // Check if the import starts with a common alias root marker (e.g., @/ or ~/)
            if (line.includes('@/') || line.includes('~/')) {
                // Alias path: resolve from the project root (TARGET_DIR)
                absoluteImportPath = path.resolve(TARGET_DIR, importedModulePath);
            } else {
                // Relative path: resolve from the current file's directory
                absoluteImportPath = path.resolve(path.dirname(filePath), importedModulePath);
            }
            
            let targetNodeId = path.relative(TARGET_DIR, absoluteImportPath);

            // Crude extension resolution logic (Next.js components use .jsx/.tsx)
            const possibleExtensions = ['', '.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];
            
            // Check if the targetNodeId already has a known extension
            if (!path.extname(targetNodeId)) {
                let resolved = false;
                for (const ext of possibleExtensions) {
                    const checkPath = targetNodeId + ext;
                    if (fs.existsSync(path.resolve(TARGET_DIR, checkPath))) {
                        targetNodeId = checkPath;
                        resolved = true;
                        break;
                    }
                }
                // Fallback: If no file is found, assume the alias path is correct as-is for the target Node ID
                if (!resolved) {
                     // For unresolved imports (e.g., external packages), we still store the importedModulePath
                     targetNodeId = importedModulePath;
                }
            }


            // Relationship: File IMPORTS Module/File
            fileNode.relationships.push({
                type: 'IMPORTS',
                targetId: targetNodeId,
                properties: { importLine: index + 1 }
            });
        }
    });

    return nodes;
}

// --- FILE TRAVERSAL ---

/**
 * Recursively traverses a directory to find target files.
 * Updated to ignore common Next.js/web development directories.
 * @param {string} currentDir The directory to start traversal from.
 * @param {string[]} fileList Accumulated list of file paths.
 */
function traverseDirectory(currentDir, fileList = []) {
    const files = fs.readdirSync(currentDir);
    const ignoredDirs = ['node_modules', '.git', '.next', 'public', 'styles', 'dist', 'out'];

    files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        const fileName = path.basename(filePath);

        // Skip ignored directories and hidden files/folders
        if (ignoredDirs.includes(fileName) || fileName.startsWith('.')) {
            return; 
        }

        if (stat.isDirectory()) {
            traverseDirectory(filePath, fileList);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
            // Include common React/Next.js extensions
            fileList.push(filePath);
        }
    });

    return fileList;
}

// --- MONGODB INGESTION ---

async function main() {
    // Check if the URI is set (a basic check, MongoClient will throw if format is invalid)
    if (!MONGODB_URI || MONGODB_URI === "mongodb://localhost:27017") {
        console.error("FATAL: MONGODB_URI is not configured.");
        console.error("Please ensure MONGODB_URI is set in your .env.local file or as an environment variable.");
        return;
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        console.log(`[1/4] Connecting to MongoDB at ${MONGODB_URI}...`);
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Clear existing data for a fresh run
        await collection.deleteMany({});
        console.log(`[2/4] Cleared existing data in collection '${COLLECTION_NAME}'.`);

        // 1. Traverse the codebase
        const targetFiles = traverseDirectory(TARGET_DIR);
        if (targetFiles.length === 0) {
            console.log(`[ERROR] No .js, .ts, .jsx, or .tsx files found in ${TARGET_DIR}. Check your path and structure.`);
            return;
        }
        console.log(`[3/4] Found ${targetFiles.length} files. Starting parsing and ingestion...`);

        const bulkOperations = [];

        // 2. Parse all files and collect nodes
        for (const filePath of targetFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const nodes = parseCodeForEntitiesAndRelationships(content, filePath);

                nodes.forEach(node => {
                    // Use upsert to handle potential conflicts and update relationships
                    bulkOperations.push({
                        updateOne: {
                            filter: { _id: node._id },
                            update: { $set: node },
                            upsert: true
                        }
                    });
                });

            } catch (err) {
                console.error(`[WARN] Could not process file ${filePath}:`, err.message);
            }
        }

        // 3. Perform bulk insertion/update
        if (bulkOperations.length > 0) {
            const result = await collection.bulkWrite(bulkOperations);
            console.log(`[4/4] Ingestion complete. Upserted ${result.upsertedCount + result.modifiedCount} entities into '${COLLECTION_NAME}'.`);
        } else {
            console.log("[4/4] No entities were generated. Ingestion skipped.");
        }

        console.log("\nKnowledge Graph ready for MongoDB MCP Server access.");
        console.log("Next steps: Run the MongoDB MCP Server and configure your Cursor IDE.");


    } catch (err) {
        console.error("[FATAL] An error occurred during database operation:", err);
    } finally {
        await client.close();
    }
}

main();