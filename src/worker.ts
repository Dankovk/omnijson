import { parentPort } from 'worker_threads';
import { file as BunFile } from 'bun';
import * as swc from '@swc/core';
import path from 'path';
import { isBinaryFileSync } from 'isbinaryfile';

const BINARY_CHECK_LENGTH = 512;
const CHUNK_SIZE = 1024 * 1024; // 1MB

async function* readFileChunks(filePath: string): AsyncGenerator<Uint8Array> {
    const file = BunFile(filePath);
    const fileSize = file.size;
    let offset = 0;

    while (offset < fileSize) {
        const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
        yield new Uint8Array(chunk);
        offset += chunk.byteLength;
    }
}

async function isBinaryFile(filePath: string): Promise<boolean> {
        const chunks = readFileChunks(filePath);
        for await (const chunk of chunks) {
            if (isBinaryFileSync(Buffer.from(chunk))) {
                return true;
            }
        }
        return false;
    }



function createASTVisitor(): swc.Visitor {
    return {
        visitImportDeclaration(path) {
            const importSource = path.node.source.value;
            if (!importSource.includes('react') && !importSource.includes('core-library')) {
                path.remove();
            }
            return path.visitChildren();
        },
        visitVariableDeclaration(path) {
            if (path.node.declarations.some((decl) => 
                decl.init?.type === 'CallExpression' && 
                decl.init.callee.type === 'Identifier' && 
                ['require', 'import'].includes(decl.init.callee.value)
            )) {
                path.remove();
            }
            return path.visitChildren();
        },
        visitJSXElement(path) {
            if (path.node.opening.name.type === 'Identifier' && path.node.opening.name.value === 'svg') {
                path.remove();
            }
            return path.visitChildren();
        },
    };
}

function extractEssentials(source: string): string {
    const ast = swc.parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        dynamicImport: true
    });

    swc.visit(ast, createASTVisitor());

    return swc.printSync(ast, { minify: true }).code;
}

async function processFile(filePath: string, parentPath: string, mode: string, includeBinary: boolean) {
    
    const fileFullPath = parentPath ? path.join(parentPath, path.basename(filePath)) : path.basename(filePath);
    const isBinary = await isBinaryFile(filePath);
    const fileContent = await Bun.file(filePath).text();
    

    let content = '';
    if (isBinary) {
        if (includeBinary) {
            content = Buffer.from(fileContent, 'utf-8').toString('base64');
        } else {
            return null;
        }
    } else {
        
        if (mode === 'for_chatgpt') {
            content = extractEssentials(content);
        } else {
            content = fileContent;
        }
         
    }
    
    return { fileFullPath,  fileData: { code: fileContent, isBinary } };
}

parentPort?.on('message', async (message: { filePath: string; parentPath: string; mode: string; includeBinary: boolean; fileContent: string }) => {
    const { filePath, parentPath, mode, includeBinary, fileContent } = message;
    const result = await processFile(filePath, parentPath, mode, includeBinary, fileContent);
    parentPort?.postMessage(result);
});