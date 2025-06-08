#!/usr/bin/env node
// @ts-ignore
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// @ts-ignore
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Add Node.js process declaration
declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};

const PackageDocSearchArgsSchema = z.object({
  package_name: z.string().describe("Name of the package or service to search documentation for (e.g. 'react', 'aws-s3', 'docker')"),
  query: z.string().optional().describe("Search term to find specific information within the package/service documentation (e.g. 'file upload example', 'authentication methods')"),
});

const PackageSearchArgsSchema = z.object({
  query: z.string().describe("Search query to find relevant packages (e.g. 'web framework', 'authentication', 'database orm')"),
  max_results: z.number().min(1).max(100).default(10).optional().describe("Maximum number of packages to return (1-100, default: 10)"),
});

/**
 * Tool definition for package documentation search
 * This tool allows searching for documentation of packages and services
 */
const packageDocSearchTool: Tool = {
  name: "usekeen_package_doc_search",
  description: "Search documentation of packages and services to find implementation details, examples, and specifications",
  inputSchema: zodToJsonSchema(PackageDocSearchArgsSchema) as any,
};

/**
 * Tool definition for package search
 * This tool allows searching for packages by name or description to discover relevant packages
 */
const packageSearchTool: Tool = {
  name: "usekeen_package_search",
  description: "Search for packages by name or description to discover relevant packages before diving into their documentation",
  inputSchema: zodToJsonSchema(PackageSearchArgsSchema) as any,
};

/**
 * Client for interacting with the UseKeen API
 * Handles authentication and making requests to the API
 */
class UseKeenClient {
  private apiKey: string;
  private baseUrl: string;

  /**
   * Create a new UseKeenClient
   * @param apiKey - The API key for authenticating with the UseKeen API
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://usekeen-api-283956349806.us-central1.run.app";
  }

  /**
   * Search for documentation of a package
   * @param packageName - The name of the package to search for
   * @param query - Optional search term to find specific information
   * @returns The search results from the UseKeen API
   */
  async searchPackageDocumentation(packageName: string, query?: string): Promise<any> {
    try {
      // Create URL with query parameters for the API key
      const url = new URL(`${this.baseUrl}/tools/package_doc_search`);
      url.searchParams.append('api_key', this.apiKey);
      
      // Log the request details for debugging
      console.error(`API Request URL: ${url.toString()}`);
      
      // Create the request body with direct parameters
      const requestBody = {
        package_name: packageName,
        query: query || ""
      };
      
      console.error(`API Request Body: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error calling UseKeen API:", error);
      throw error;
    }
  }

  /**
   * Search for packages by name or description
   * @param query - The search query to find relevant packages
   * @param maxResults - Maximum number of packages to return (1-100, default: 10)
   * @returns The search results from the UseKeen API
   */
  async searchPackages(query: string, maxResults: number = 10): Promise<any> {
    try {
      // Create URL with query parameters
      const url = new URL(`${this.baseUrl}/packages/search`);
      url.searchParams.append('api_key', this.apiKey);
      url.searchParams.append('q', query);
      url.searchParams.append('max_results', maxResults.toString());
      
      // Log the request details for debugging
      console.error(`Package Search API Request URL: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Package search API request failed: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error calling UseKeen Package Search API:", error);
      throw error;
    }
  }
}

/**
 * Main function to start the MCP server
 * Sets up the server, registers request handlers, and connects to the transport
 */
async function main(): Promise<void> {
  const apiKey = process.env.USEKEEN_API_KEY;

  if (!apiKey) {
    console.error("Please set USEKEEN_API_KEY environment variable");
    process.exit(1);
  }

  console.error("Starting UseKeen Documentation MCP Server...");
  console.error(`Using API Key: ${apiKey}`);
  
  const server = new Server(
    {
      name: "UseKeen Documentation MCP Server",
      version: "1.2.3",
    },
    {
      capabilities: {
        tools: {
          usekeen_package_doc_search: packageDocSearchTool,
          usekeen_package_search: packageSearchTool,
        },
      },
    }
  );

  const useKeenClient = new UseKeenClient(apiKey);

  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", JSON.stringify(request, null, 2));
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        if (request.params.name === "usekeen_package_doc_search") {
          const args = PackageDocSearchArgsSchema.parse(request.params.arguments);
          const response = await useKeenClient.searchPackageDocumentation(
            args.package_name,
            args.query
          );
          
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        } else if (request.params.name === "usekeen_package_search") {
          const args = PackageSearchArgsSchema.parse(request.params.arguments);
          const response = await useKeenClient.searchPackages(
            args.query,
            args.max_results
          );
          
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        } else {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("UseKeen Documentation MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
