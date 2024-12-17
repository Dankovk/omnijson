#!/usr/bin/env bun

import { parseUserInput } from './src/system-wrapper.js';
import { doTransform } from './src/core.js';
import type { Config } from './src/types.js';

const config: Config = parseUserInput();

try {
    await doTransform(config.dirPath, config.jsonPath, config.mode);
    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}