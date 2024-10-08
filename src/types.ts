export interface Config {
    ignoreDirs: string[];
    ignoreFiles: string[];
    ignoreExt: string[];
    jsonPath: string;
    dirPath: string;
    mode: string;
    clearDirAfterTransform: boolean;
    includeBinary: boolean;
}

export interface FileData {
    code: string;
    isBinary: boolean;
}