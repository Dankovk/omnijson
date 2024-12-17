# OmniJSON

A high-performance directory-to-JSON and JSON-to-directory transformer built with Bun.

## Features

- 🚀 Fast transformation using multi-threading
- 📁 Bi-directional conversion between directories and JSON
- 🔍 Configurable file/directory filtering
- 💾 Binary file support
- 🛠️ Built with Bun for optimal performance

## Installation

```bash
bun install omnijson
```

## Usage

### Basic Usage

```bash
# Convert directory to JSON
bun omnijson --mode=to_json --dirPath=./your/directory --jsonPath=output.json

# Convert JSON back to directory
bun omnijson --mode=from_json --dirPath=./target/directory --jsonPath=input.json
```

### Configuration Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `mode` | Transformation mode | `to_json` | `--mode=to_json` |
| `dirPath` | Source/target directory path | `.` | `--dirPath=./src` |
| `jsonPath` | JSON file path | `files.json` | `--jsonPath=output.json` |
| `ignoreDirs` | Directories to ignore | `.git,node_modules` | `--ignoreDirs=dist,build` |
| `ignoreFiles` | Files to ignore | `omnijson` | `--ignoreFiles=.env` |
| `ignoreExt` | Extensions to ignore | `[]` | `--ignoreExt=.log,.tmp` |
| `includeBinary` | Include binary files | `false` | `--includeBinary=true` |
| `clearDirAfterTransform` | Remove JSON after transform | `false` | `--clearDirAfterTransform=true` |

### Advanced Example

```bash
bun omnijson \
  --mode=to_json \
  --dirPath=./src \
  --jsonPath=project.json \
  --ignoreDirs=tests,coverage \
  --ignoreFiles=.env \
  --ignoreExt=.log,.tmp \
  --includeBinary=true
```

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/omnijson.git

# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## Requirements

- Bun runtime (version >= 1.0.0)
- Node.js (version >= 16.0.0) for development

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For issues and feature requests, please use the GitHub Issues page.

## Use Cases

### 1. Project Templating
- Save project boilerplates as JSON for easy distribution
- Generate new projects from JSON templates
- Maintain multiple project templates in a versioned format

### 2. Code Analysis & Training Data
- Convert codebases to JSON for ML model training
- Analyze code structure and dependencies
- Create datasets for code generation models

### 3. Project Migration & Backup
- Create portable snapshots of project structures
- Migrate projects between different environments
- Version control project structure separately from code

### 4. Development Workflows
- Share consistent development environments
- Create reproducible project setups
- Manage configuration across multiple projects

### 5. CI/CD Integration
- Generate project structures in CI/CD pipelines
- Create test environments from JSON templates
- Maintain consistent staging environments

### 6. Browser FileSystem Integration
- Create filesystem snapshots for browser-based IDEs
- Export browser filesystem state to real filesystem
- Synchronize between browser and native filesystems
- Bridge web-based development environments with local setup
- Import/Export project structures for web-based editors
- Create portable workspace configurations for browser-based tools

### 7. Micro-Frontend Architecture
- Package entire applications with dependencies as single JSON assets
- Bundle and distribute complete micro-frontend applications
- Enable instant injection of full-featured apps as static assets
- Include all dependencies, styles, and assets in one portable file
- Support runtime injection of complete applications
- Distribute micro-frontends as self-contained JSON bundles
- Version and deploy entire applications as single assets
- Simplify micro-frontend integration through JSON-based bundling
- Enable serverless micro-frontend deployment
- Transform complex applications into injectable resources
