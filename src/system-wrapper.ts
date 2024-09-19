#!/usr/bin/env bun
import { Config } from './types';


const defaultConfig: Config = {
    ignoreDirs: ['.git', 'node_modules', 'dist', 'public', 'build', 'scripts', 'src/assets', 'src/components/ui/icons'],
    ignoreFiles: ['omnijson'],
    ignoreExt: [],
    jsonPath: 'files.json',
    dirPath: '.',
    mode: 'to_json',
    includeBinary: false,
    clearDirAfterTransform: false
};

export function parseUserInput(): Config {
    const userCliArgumentsArr = process.argv.splice(2);
    const userCliArguments = Object.fromEntries(userCliArgumentsArr.map(
        (arg) => arg.replace('--', '').split('=')
    ));

    const userConfig = {} as Partial<Config>;
    for (const [key, value] of Object.entries<any>(userCliArguments)) {
        if (key === 'ignoreDirs' || key === 'ignoreFiles' || key === 'ignoreExt') {
            userConfig[key] = value.split(',');
        } else if (key === 'clearDirAfterTransform' || key === 'includeBinary') {
            userConfig[key] = value === 'true';
        } else {
            // @ts-ignore
            userConfig[key] = value as Config[keyof Config];
        }
    }

    return { ...defaultConfig, ...userConfig };
}