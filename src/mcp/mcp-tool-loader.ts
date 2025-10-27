import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface ServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPServersConfig {
  servers: Record<string, ServerConfig>;
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

const mcpJson: MCPServersConfig = {
  servers: {
    'Salesforce DX': {
      command: 'npx',
      args: [
        '-y',
        '@salesforce/mcp',
        '--orgs',
        'DEFAULT_TARGET_ORG',
        '--toolsets',
        'mobile',
        '--tools',
        'run_apex_test',
        '--allow-non-ga-tools',
      ],
    },
  },
};

/**
 * Load MCP tools from a configured MCP server
 * @param serverName - Name of the server to connect to (optional, uses first server if not specified)
 * @returns Promise<MCPTool[]> - List of available tools from the server
 */
export async function getMCPTools(serverName?: string): Promise<MCPTool[]> {
  // Get the server name - use provided one or first available
  const targetServerName = serverName || Object.keys(mcpJson.servers)[0];

  if (!targetServerName) {
    throw new Error('No server specified and no servers available in config');
  }

  const serverConfig = mcpJson.servers[targetServerName];

  if (!serverConfig) {
    throw new Error(`Server "${targetServerName}" not found in configuration`);
  }

  // Create a client instance
  const client = new Client(
    {
      name: 'mcp-tool-loader',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create transport for stdio communication
  // Filter out undefined values from process.env
  const processEnv = Object.fromEntries(
    Object.entries(process.env).filter(([_, v]) => v !== undefined)
  ) as Record<string, string>;

  const transport = new StdioClientTransport({
    command: serverConfig.command,
    args: serverConfig.args || [],
    env: {
      ...processEnv,
      ...serverConfig.env,
    },
    stderr: 'pipe', // Capture stderr to see server errors
  });

  // Listen for stderr output from the server
  if (transport.stderr) {
    transport.stderr.on('data', (data: Buffer) => {
      console.error(`[Server stderr]: ${data.toString()}`);
    });
  }

  try {
    // Connect to the server
    await client.connect(transport);
    console.log(`Connected to MCP server: ${targetServerName}`);

    // List available tools
    const response = await client.listTools();

    console.log(`Found ${response.tools.length} tools from server "${targetServerName}"`);

    // Map the tools to a simpler format
    const tools: MCPTool[] = response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    // Clean up
    await client.close();

    return tools;
  } catch (error) {
    // Ensure client is closed even on error
    try {
      await client.close();
    } catch (closeError) {
      // Ignore close errors
    }

    throw error;
  }
}
