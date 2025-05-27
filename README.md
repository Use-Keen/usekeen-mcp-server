# UseKeen Documentation MCP Server

MCP Server for the UseKeen Package Documentation Search API, enabling Claude and other AI assistants to search for documentation of packages and services.

## Tools

1. `usekeen_package_doc_search`
   - Search documentation of packages and services to find implementation details, examples, and specifications
   - Required inputs:
     - `package_name` (string): Name of the package or service to search documentation for (e.g. 'react', 'aws-s3', 'docker')
   - Optional inputs:
     - `query` (string): Search term to find specific information within the package/service documentation (e.g. 'file upload example', 'authentication methods')
   - Returns: Documentation search results with relevant matches, URLs, and snippets

## Setup

1. Get a UseKeen API key from the UseKeen service
2. Set up the environment with your API key as shown below

## Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

#### NPX

```json
{
  "mcpServers": {
    "usekeen": {
      "command": "npx",
      "args": [
        "-y",
        "usekeen-mcp"
      ],
      "env": {
        "USEKEEN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Docker

```json
{
  "mcpServers": {
    "usekeen": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "USEKEEN_API_KEY",
        "usekeen-mcp"
      ],
      "env": {
        "USEKEEN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Usage with VS Code

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

#### NPX

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "usekeen_api_key",
        "description": "UseKeen API Key",
        "password": true
      }
    ],
    "servers": {
      "usekeen": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-usekeen"],
        "env": {
          "USEKEEN_API_KEY": "${input:usekeen_api_key}"
        }
      }
    }
  }
}
```

#### Docker

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "usekeen_api_key",
        "description": "UseKeen API Key",
        "password": true
      }
    ],
    "servers": {
      "usekeen": {
        "command": "docker",
        "args": ["run", "-i", "--rm", "mcp/usekeen"],
        "env": {
          "USEKEEN_API_KEY": "${input:usekeen_api_key}"
        }
      }
    }
  }
}
```

### Manual Setup

#### Using the Helper Scripts

We provide two helper scripts to make it easier to run the server:

1. **Local Execution**:
   ```bash
   # Make the script executable (first time only)
   chmod +x run-local.sh
   
   # Run the server locally
   ./run-local.sh
   ```

2. **Docker Execution**:
   ```bash
   # Make the script executable (first time only)
   chmod +x run-docker.sh
   
   # Run the server in Docker
   ./run-docker.sh
   ```

Both scripts will check for a `.env` file containing your `USEKEEN_API_KEY`. You can create this file based on the provided `.env.example`.

#### Running with npm

Set the `USEKEEN_API_KEY` environment variable and run the server:

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Run the server
USEKEEN_API_KEY=your_api_key npm start
```

#### Running with Docker

Build and run the Docker container with the API key:

```bash
# Build the Docker image
docker build -t mcp/usekeen .

# Run the container
docker run -e USEKEEN_API_KEY=your_api_key mcp/usekeen
```

### Environment Variables

- `USEKEEN_API_KEY`: Required. Your UseKeen API key for authentication.

### Troubleshooting

If you encounter errors, verify that:
1. Your UseKeen API key is valid and correctly set in your configuration
2. You have an active internet connection to reach the UseKeen API
3. The UseKeen service is currently available

## Build

Docker build:

```bash
docker build -t mcp/usekeen .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License.
