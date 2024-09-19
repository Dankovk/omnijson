#!/usr/bin/env bun

import { doTransform } from "./convert";

interface CliArgs {
  dirPath: string;
  jsonPath: string;
  operation: string;
}

function parseArgs(args: string[]): CliArgs {
  const parsedArgs: Partial<CliArgs> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    parsedArgs[key as keyof CliArgs] = value;
  }

  if (!parsedArgs.dirPath || !parsedArgs.jsonPath || !parsedArgs.operation) {
    
    const message = 'Missing required arguments. Usage: un_jsonify-fs --dirPath <path> --jsonPath <path> --operation <to_json|from_json>';
    console.warn(message);
  }

  let dirPath = parsedArgs.dirPath ?? process.cwd();
  let jsonPath = parsedArgs.jsonPath ?? process.cwd();
  let operation = parsedArgs.operation ?? "to_json";



  return parsedArgs as CliArgs;
}

async function cli() {
  try {
    const args = process.argv.slice(2);
    const config = parseArgs(args);
    await doTransform(config.dirPath, config.jsonPath, config.operation);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

cli();
