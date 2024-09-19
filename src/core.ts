#!/usr/bin/env bun

import { promises as fs } from 'fs';
import path from 'path';
import * as swc from '@swc/core';
import { file as BunFile, write as BunWrite } from 'bun';
import { parseUserInput } from './system-wrapper';
import { Config } from './types';

const config: Config = parseUserInput();

const {
    ignoreDirs, ignoreFiles, ignoreExt, jsonPath, dirPath, mode, clearDirAfterTransform, includeBinary
} = config;

async function isBinaryFile(filePath: string): Promise<boolean> {
    const readLength = 512;
    let content: Uint8Array;
    try {
        content = await BunFile(filePath).arrayBuffer();
    } catch (error) {
        console.error(`Error reading file ${ filePath }:`, error);
        return false;
    }

    const length = Math.min(content.byteLength, readLength);
    for (let i = 0; i < length; i++) {
        if (new Uint8Array(content)[ i ] === 0) {
            return true;
        }
    }

    return false;
}

function extractEssentials(source: string): string {
    const ast = swc.parseSync(source, {
        syntax:        'typescript',
        tsx:           true,
        dynamicImport: true
    });

    swc.visit(ast, {
        visitImportDeclaration(path) {
            const importSource = path.node.source.value;
            // Keep only essential imports (like React)
            if (!importSource.includes('react') && !importSource.includes('core-library')) {
                path.remove();
            } else {
                path.visitChildren();
            }
        },
        visitVariableDeclaration(path) {
            // Remove style imports and variables
            if (path.node.declarations.some((decl) => decl.init && decl.init.type === 'CallExpression' && decl.init.callee.type === 'Identifier' && (decl.init.callee.value === 'require' || decl.init.callee.value === 'import'))) {
                path.remove();
            } else {
                path.visitChildren();
            }
        },
        visitExportNamedDeclaration(path) {
            path.visitChildren();
        },
        visitExportDefaultDeclaration(path) {
            path.visitChildren();
        },
        visitFunctionDeclaration(path) {
            path.visitChildren();
        },
        visitClassDeclaration(path) {
            path.visitChildren();
        },
        visitJSXElement(path) {
            if (path.node.opening.name.type === 'Identifier' && path.node.opening.name.value === 'svg') {
                path.remove();
            } else {
                path.visitChildren();
            }
        },
        visitJSXFragment(path) {
            path.visitChildren();
        },
        visitJSXOpeningElement(path) {
            path.visitChildren();
        },
        visitJSXClosingElement(path) {
            path.visitChildren();
        },
        visitClassProperty(path) {
            path.visitChildren();
        },
        visitClassMethod(path) {
            path.visitChildren();
        }
    });

    const { code } = swc.printSync(ast, { minify: true });
    return code;
}

async function walkDir(dirPath: string, json: any, parentPath = ''): Promise<void> {
    if (ignoreDirs.includes(dirPath) || ignoreDirs.includes(parentPath) || ignoreDirs.includes(path.basename(dirPath)) || ignoreDirs.includes(path.basename(parentPath))) {
        return;
    }

    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });
    const promises = dirEntries.map(async (dirent) => {
        if (dirent.isDirectory() && !dirent.name.startsWith('.') && !ignoreDirs.includes(dirent.name) && !ignoreDirs.includes(path.basename(dirPath))) {
            const newDirPath = path.join(dirPath, dirent.name);
            const newParentPath = path.join(parentPath, dirent.name);
            await walkDir(newDirPath, json, newParentPath);
        } else if (dirent.isFile() && !dirent.name.startsWith('.') && dirent.name !== jsonPath && !ignoreFiles.includes(dirent.name) && !ignoreExt.includes(path.extname(dirent.name))) {
            const filePath = path.join(dirPath, dirent.name);
            const fileFullPath = path.join(parentPath, dirent.name);
            let content: string;

            if (await isBinaryFile(filePath)) {
                if (includeBinary) {
                    const buffer = await BunFile(filePath).arrayBuffer();
                    content = Buffer.from(buffer).toString('base64');
                } else {
                    content = '';
                }
            } else {
                content = await BunFile(filePath).text();
                // if (config.mode === 'for_chatgpt') {
                //     content = extractEssentials(content);
                // }
            }

            const stats = await fs.stat(filePath);
            json[ fileFullPath ] = { code: content, isBinary: await isBinaryFile(filePath), size: stats.size, modified: stats.mtime };
        }
    });

    await Promise.all(promises);
}

async function doTransform(dirPath: string, jsonPath: string, operation: string): Promise<void> {
    const _operation = mode || operation;
    if (_operation === 'to_json') {
        const json = {};
        await walkDir(dirPath, json);
        const parentDirName = process.cwd().replace(/^\//, '');
        console.log(parentDirName);
        const escapedDirName = parentDirName.replace(
            // all / replaced with |in|
            /[/]/g,
            '->'
        );
        console.log(escapedDirName);
        const fileName = `${ escapedDirName }->${ jsonPath }`;

        await BunWrite(fileName, JSON.stringify({ files: json }, null, 2));
        console.log('Converted directory to JSON.');
    } else if (_operation === 'from_json') {
        const json = JSON.parse(await BunFile(jsonPath).text()).files;

        async function walkJson(json: any, dirPath: string): Promise<void> {
            const promises = Object.keys(json).map(async (fileFullPath) => {
                const { code, isBinary } = json[ fileFullPath ];
                const filePath = path.join(dirPath, fileFullPath);
                const dirName = path.dirname(filePath);

                if (!await BunFile(dirName).exists()) {
                    await fs.mkdir(dirName, { recursive: true });
                }

                if (isBinary) {
                    const buffer = Buffer.from(code, 'base64');
                    await BunWrite(filePath, buffer);
                } else {
                    await BunWrite(filePath, code);
                }
            });

            await Promise.all(promises);
        }

        await walkJson(json, dirPath);
        if (clearDirAfterTransform) {
            await BunFile(jsonPath).remove();
        }
        console.log('Converted JSON to directory.');
    } else {
        console.log("Invalid argument. Please use 'to_json' or 'from_json'.");
    }
}

export { doTransform };


doTransform(config.dirPath, config.jsonPath, config.mode);


