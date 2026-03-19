import type {
  MCPServerConfig,
  MCPServerLocalConfig,
  MCPServerRemoteConfig,
  MCPServersConfig,
} from "../config/types";

/**
 * MCP Server Manager
 * Manages MCP server configurations, connections, and lifecycle
 */
export class MCPServerManager {
  private readonly config: MCPServersConfig;
  private readonly servers: Map<string, MCPServerInstance> = new Map();
  private statistics: MCPStatistics = {
    total: 0,
    enabled: 0,
    disabled: 0,
    local: 0,
    remote: 0,
    errors: 0,
  };

  constructor(config: MCPServersConfig) {
    this.config = config;
    this.initializeServers();
    this.updateStatistics();
  }

  /**
   * Get the current configuration
   */
  getConfig(): MCPServersConfig {
    return this.config;
  }

  /**
   * Initialize server instances from configuration
   */
  private initializeServers(): void {
    this.servers.clear();

    for (const [name, serverConfig] of Object.entries(this.config)) {
      try {
        const instance = new MCPServerInstance(name, serverConfig);
        this.servers.set(name, instance);
      } catch (error) {
        console.error(`Failed to initialize MCP server "${name}":`, error);
        this.statistics.errors++;
      }
    }
  }

  /**
   * Update internal statistics
   */
  private updateStatistics(): void {
    this.statistics = {
      total: this.servers.size,
      enabled: 0,
      disabled: 0,
      local: 0,
      remote: 0,
      errors: this.statistics.errors, // Keep existing error count
    };

    const instances = Array.from(this.servers.values());
    for (const instance of instances) {
      if (instance.config.enabled !== false) {
        this.statistics.enabled++;
      } else {
        this.statistics.disabled++;
      }

      if (instance.config.type === "local") {
        this.statistics.local++;
      } else {
        this.statistics.remote++;
      }
    }
  }

  /**
   * Get all server instances
   */
  getAllServers(): MCPServerInstance[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get a specific server instance
   */
  getServer(name: string): MCPServerInstance | undefined {
    return this.servers.get(name);
  }

  /**
   * Get server statistics
   */
  getStatistics(): MCPStatistics {
    return { ...this.statistics };
  }

  /**
   * Test connection to a server
   */
  async testConnection(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      return false;
    }

    try {
      return await server.testConnection();
    } catch (error) {
      server.setLastError(
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Get connection information for a server
   */
  getConnectionInfo(name: string): MCPConnectionInfo | undefined {
    const server = this.servers.get(name);
    if (!server) {
      return undefined;
    }

    return server.getConnectionInfo();
  }

  /**
   * Start a server
   */
  async startServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      return false;
    }

    try {
      return await server.start();
    } catch (error) {
      server.setLastError(
        error instanceof Error ? error.message : String(error)
      );
      this.statistics.errors++;
      return false;
    }
  }

  /**
   * Stop a server
   */
  stopServer(name: string): boolean {
    const server = this.servers.get(name);
    if (!server) {
      return false;
    }

    try {
      return server.stop();
    } catch (error) {
      server.setLastError(
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Stop all servers
   */
  stopAllServers(): void {
    const servers = Array.from(this.servers.values());
    for (const server of servers) {
      server.stop();
    }
  }
}

/**
 * Individual MCP Server Instance
 */
export class MCPServerInstance {
  readonly name: string;
  readonly config: MCPServerConfig;
  private readonly connectionInfo: MCPConnectionInfo;
  private isRunning = false;

  constructor(name: string, config: MCPServerConfig) {
    this.name = name;
    this.config = config;
    this.connectionInfo = {
      connected: false,
      lastAttempt: null,
      lastError: null,
    };
  }

  /**
   * Test connection to this server
   */
  async testConnection(): Promise<boolean> {
    this.connectionInfo.lastAttempt = new Date();

    try {
      if (this.config.type === "local") {
        return this.testLocalConnection();
      }
      return await this.testRemoteConnection();
    } catch (error) {
      this.connectionInfo.lastError =
        error instanceof Error ? error.message : String(error);
      this.connectionInfo.connected = false;
      return false;
    }
  }

  /**
   * Test local server connection
   */
  private testLocalConnection(): boolean {
    const config = this.config as MCPServerLocalConfig;

    // Basic validation - check if command exists and is executable
    if (!config.command || config.command.length === 0) {
      throw new Error("Command not specified");
    }

    // For now, just validate the configuration
    // In a full implementation, this would actually test the STDIO connection
    this.connectionInfo.connected = true;
    return true;
  }

  /**
   * Test remote server connection
   */
  private async testRemoteConnection(): Promise<boolean> {
    const config = this.config as MCPServerRemoteConfig;

    if (!config.url) {
      throw new Error("URL not specified for remote server");
    }

    try {
      // Test HTTP/HTTPS connection
      const controller = new AbortController();
      const timeout = config.timeout || 10_000;

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(config.url, {
        method: "HEAD",
        headers: config.headers || {},
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      this.connectionInfo.connected = response.ok;
      return response.ok;
    } catch (error) {
      this.connectionInfo.connected = false;
      throw error;
    }
  }

  /**
   * Start this server
   */
  async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    if (this.config.enabled === false) {
      return false;
    }

    try {
      // In a full implementation, this would actually start the server process
      // For now, we'll just mark it as running if connection test passes
      const connected = await this.testConnection();
      this.isRunning = connected;
      return connected;
    } catch (error) {
      this.setLastError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Stop this server
   */
  stop(): boolean {
    if (!this.isRunning) {
      return true;
    }

    try {
      // In a full implementation, this would actually stop the server process
      this.isRunning = false;
      this.connectionInfo.connected = false;
      return true;
    } catch (error) {
      this.setLastError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Get connection information
   */
  getConnectionInfo(): MCPConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * Set last error
   */
  setLastError(error: string): void {
    this.connectionInfo.lastError = error;
  }

  /**
   * Check if server is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * MCP Configuration Validation
 */
export interface MCPValidationError {
  server: string;
  errors: string[];
}

export interface MCPValidationResult {
  valid: boolean;
  errors: MCPValidationError[];
}

/**
 * Validate MCP servers configuration
 */
export function validateMCPServersConfig(
  config: MCPServersConfig
): MCPValidationResult {
  const errors: MCPValidationError[] = [];

  for (const [serverName, serverConfig] of Object.entries(config)) {
    const serverErrors: string[] = [];

    // Basic validation
    if (!serverConfig.type) {
      serverErrors.push("Server type is required");
    } else if (serverConfig.type === "local") {
      const localConfig = serverConfig as MCPServerLocalConfig;
      if (!localConfig.command || localConfig.command.length === 0) {
        serverErrors.push("Command is required for local servers");
      }
    } else if (serverConfig.type === "remote") {
      const remoteConfig = serverConfig as MCPServerRemoteConfig;
      if (remoteConfig.url) {
        try {
          new URL(remoteConfig.url);
        } catch {
          serverErrors.push("Invalid URL format");
        }
      } else {
        serverErrors.push("URL is required for remote servers");
      }
    } else {
      serverErrors.push(`Invalid server type: ${(serverConfig as any).type}`);
    }

    // Timeout validation
    if (
      serverConfig.timeout !== undefined &&
      (typeof serverConfig.timeout !== "number" || serverConfig.timeout <= 0)
    ) {
      serverErrors.push("Timeout must be a positive number");
    }

    if (serverErrors.length > 0) {
      errors.push({ server: serverName, errors: serverErrors });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Supporting types and interfaces

export interface MCPStatistics {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
  errors: number;
}

export interface MCPConnectionInfo {
  connected: boolean;
  lastAttempt: Date | null;
  lastError: string | null;
}
