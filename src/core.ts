#!/usr/bin/env bun

import { promises as fs } from 'fs';
import path from 'path';
import { file as BunFile, write as BunWrite } from 'bun';
import { parseUserInput } from './system-wrapper';
import { Config, FileData } from './types';
import { Worker } from 'worker_threads';
import os from 'os';
import { isBinarySync } from 'isbinaryfile';

const config: Config = parseUserInput();

const {
    ignoreDirs, ignoreFiles, ignoreExt, jsonPath, dirPath, mode, clearDirAfterTransform, includeBinary
} = config;

function determineOptimalWorkerCount(): number {
    
    const systemThreads = os.availableParallelism();

    
    const workerCount = systemThreads;

    console.log(`System has ${workerCount} CPU cores. Using ${workerCount} workers.`);
    return workerCount;
}
const MAX_WORKERS = determineOptimalWorkerCount();

function createWorker(): Worker {
    return new Worker(path.join(__dirname, 'worker.ts'));
}

async function processFileWithWorker(filePath: string, parentPath: string): Promise<[string, FileData] | null> {
    return new Promise((resolve, reject) => {
        const worker = createWorker();
        worker.on('message', (result) => {
            worker.terminate();
            if (result) {
                const relativePath = path.relative(dirPath, result.fileFullPath);
                const fullPath = path.join(parentPath, relativePath);
                resolve([fullPath, result.fileData]);
            } else {
                resolve(null);
            }
        });
        worker.on('error', (error) => {
            worker.terminate();
            reject(error);
        });
        worker.postMessage({ filePath, parentPath, mode, includeBinary });
    });
}

async function walkDir(dirPath: string, json: Record<string, FileData>, parentPath = ''): Promise<void> {
    if (ignoreDirs.some(dir => [dirPath, parentPath, path.basename(dirPath), path.basename(parentPath)].includes(dir))) {
        return;
    }

    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
    const filesToProcess: string[] = [];

    for (const dirent of dirEntries) {
        if (dirent.isDirectory() && !dirent.name.startsWith('.') && !ignoreDirs.includes(dirent.name) && !ignoreDirs.includes(path.basename(dirPath))) {
            const newDirPath = path.join(dirPath, dirent.name);
            const newParentPath = path.join(parentPath, dirent.name);
            await walkDir(newDirPath, json, newParentPath);
        } else if (dirent.isFile() && !dirent.name.startsWith('.') && dirent.name !== jsonPath && !ignoreFiles.includes(dirent.name) && !ignoreExt.includes(path.extname(dirent.name))) {
            filesToProcess.push(path.join(dirPath, dirent.name));
        }
    }

    const workerPool = new Array(MAX_WORKERS).fill(null).map(() => createWorker());
    const chunkSize = Math.ceil(filesToProcess.length / MAX_WORKERS);
    const fileChunks = Array.from({ length: MAX_WORKERS }, (_, i) =>
        filesToProcess.slice(i * chunkSize, (i + 1) * chunkSize)
    );

    const results = await Promise.allSettled(
        fileChunks.map(async (chunk, workerIndex) => {
            const worker = workerPool[workerIndex];
            try {
                const chunkResults = await Promise.all(
                    chunk.map(filePath => processFileWithWorker(filePath, parentPath))
                );
                return chunkResults;
            } finally {
                worker.terminate();
            }
        })
    );

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            result.value.forEach(item => {
                if (item) {
                    const [key, value] = item;
                    json[key] = value;
                }
            });
        } else {
            console.error('Error processing chunk:', result.reason);
        }
    });
}

async function toJson(dirPath: string, jsonPath: string): Promise<void> {
    const json: Record<string, FileData> = {};
    await walkDir(dirPath, json);
    const parentDirName = process.cwd().replace(/^\//, '');
    const escapedDirName = parentDirName.replace(/[/]/g, '->');
    const fileName = `${escapedDirName}->${jsonPath}`;

    await BunWrite(fileName, JSON.stringify({ files: json }, null, 2));
    console.log('Converted directory to JSON.');
}

async function fromJson(dirPath: string, jsonPath: string): Promise<void> {
    const json = JSON.parse(await BunFile(jsonPath).text()).files as Record<string, FileData>;

    const writePromises = Object.entries(json).map(async ([fileFullPath, fileData]) => {
        const { code, isBinary } = fileData;
        const filePath = path.join(dirPath, fileFullPath);
        const dirName = path.dirname(filePath);

        await fs.mkdir(dirName, { recursive: true });

        if (isBinary) {
            const buffer = Buffer.from(code, 'base64');
            await BunWrite(filePath, buffer);
        } else {
            await BunWrite(filePath, code);
        }
    });

    await Promise.all(writePromises);

    if (clearDirAfterTransform) {
        await BunFile(jsonPath).remove();
    }
    console.log('Converted JSON to directory.');
}

async function doTransform(dirPath: string, jsonPath: string, operation: string): Promise<void> {
    const _operation = mode || operation;
    switch (_operation) {
        case 'to_json':
            await toJson(dirPath, jsonPath);
            break;
        case 'from_json':
            await fromJson(dirPath, jsonPath);
            break;
        default:
            throw new Error("Invalid argument. Please use 'to_json' or 'from_json'.");
    }
}


try {
    await doTransform(config.dirPath, config.jsonPath, config.mode);

    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}




