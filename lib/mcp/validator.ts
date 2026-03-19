import type { MCPServersConfig } from "../config/types";
import { MCPServerManager, validateMCPServersConfig } from "./config-loader";

/**
 * MCP Configuration Validator
 * Comprehensive validation for MCP server configurations
 */

export interface MCPValidationResult {
  valid: boolean;
  errors: MCPValidationError[];
  warnings: MCPValidationWarning[];
  serverCount: number;
  enabledCount: number;
}

export interface MCPValidationError {
  server: string;
  type: "configuration" | "connection" | "security" | "compatibility";
  message: string;
  severity: "error" | "warning";
}

export interface MCPValidationWarning extends MCPValidationError {
  severity: "warning";
  suggestion?: string;
}

/**
 * Comprehensive MCP Configuration Validator
 */
export class MCPValidator {
  private readonly manager: MCPServerManager;

  constructor(config: MCPServersConfig) {
    this.manager = new MCPServerManager(config || {});
  }

  /**
   * Perform comprehensive validation of MCP configuration
   */
  async validateConfiguration(): Promise<MCPValidationResult> {
    const errors: MCPValidationError[] = [];
    const warnings: MCPValidationWarning[] = [];

    // Basic configuration validation
    const basicValidation = validateMCPServersConfig(this.manager.getConfig());

    // Convert basic errors to our format
    for (const error of basicValidation.errors) {
      errors.push({
        server: error.server,
        type: "configuration",
        message: error.errors.join(", "),
        severity: "error",
      });
    }

    // Additional validations
    const servers = this.manager.getAllServers();

    for (const server of servers) {
      // Connection validation
      await this.validateServerConnection(server.name, errors, warnings);

      // Security validation
      this.validateServerSecurity(server.name, server.config, errors, warnings);

      // Performance validation
      this.validateServerPerformance(server.name, server.config, warnings);
    }

    // Overall configuration validation
    this.validateOverallConfiguration(servers, warnings);

    const stats = this.manager.getStatistics();

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      serverCount: stats.total,
      enabledCount: stats.enabled,
    };
  }

  /**
   * Validate server connection
   */
  private async validateServerConnection(
    serverName: string,
    errors: MCPValidationError[],
    _warnings: MCPValidationWarning[]
  ): Promise<void> {
    const server = this.manager.getServer(serverName);
    if (!server || server.config.enabled === false) {
      return;
    }

    try {
      const connected = await this.manager.testConnection(serverName);

      if (!connected) {
        const connectionInfo = this.manager.getConnectionInfo(serverName);
        errors.push({
          server: serverName,
          type: "connection",
          message: connectionInfo?.lastError || "Failed to connect to server",
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        server: serverName,
        type: "connection",
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
    }
  }

  /**
   * Validate server security configuration
   */
  private validateServerSecurity(
    serverName: string,
    config: any,
    _errors: MCPValidationError[],
    warnings: MCPValidationWarning[]
  ): void {
    if (config.type === "remote") {
      // Check for HTTPS
      if (config.url && !config.url.startsWith("https://")) {
        warnings.push({
          server: serverName,
          type: "security",
          message: "Remote server is not using HTTPS",
          severity: "warning",
          suggestion: "Use HTTPS URLs for secure communication",
        });
      }

      // Check for OAuth configuration
      if (!config.oauth && !config.headers?.Authorization) {
        warnings.push({
          server: serverName,
          type: "security",
          message: "No authentication configured for remote server",
          severity: "warning",
          suggestion: "Configure OAuth or API key authentication",
        });
      }

      // Check for hardcoded credentials
      if (
        config.headers?.Authorization &&
        !config.headers.Authorization.includes("{env:")
      ) {
        warnings.push({
          server: serverName,
          type: "security",
          message: "Hardcoded credentials detected in headers",
          severity: "warning",
          suggestion: "Use environment variables for sensitive data",
        });
      }
    }

    if (config.type === "local") {
      // Check for suspicious commands
      const suspiciousCommands = ["curl", "wget", "rm", "sudo"];
      const commandString = config.command?.join(" ") || "";

      for (const suspicious of suspiciousCommands) {
        if (commandString.includes(suspicious)) {
          warnings.push({
            server: serverName,
            type: "security",
            message: `Potentially dangerous command detected: ${suspicious}`,
            severity: "warning",
            suggestion: "Review command for security implications",
          });
        }
      }
    }
  }

  /**
   * Validate server performance configuration
   */
  private validateServerPerformance(
    serverName: string,
    config: any,
    warnings: MCPValidationWarning[]
  ): void {
    // Check timeout configuration
    if (!config.timeout || config.timeout > 60_000) {
      warnings.push({
        server: serverName,
        type: "configuration",
        message: "Server timeout is very high or not configured",
        severity: "warning",
        suggestion:
          "Consider setting a timeout between 5000-30000ms for better performance",
      });
    }

    if (config.timeout && config.timeout < 1000) {
      warnings.push({
        server: serverName,
        type: "configuration",
        message: "Server timeout is very low",
        severity: "warning",
        suggestion: "Timeout below 1000ms may cause connection issues",
      });
    }
  }

  /**
   * Validate overall configuration
   */
  private validateOverallConfiguration(
    servers: any[],
    warnings: MCPValidationWarning[]
  ): void {
    const enabledServers = servers.filter((s) => s.config.enabled !== false);

    // Warn if too many servers are enabled
    if (enabledServers.length > 10) {
      warnings.push({
        server: "global",
        type: "compatibility",
        message: `Large number of enabled MCP servers (${enabledServers.length})`,
        severity: "warning",
        suggestion: "Consider disabling unused servers to improve performance",
      });
    }

    // Warn if no servers are enabled
    if (enabledServers.length === 0 && servers.length > 0) {
      warnings.push({
        server: "global",
        type: "configuration",
        message: "No MCP servers are enabled",
        severity: "warning",
        suggestion: "Enable at least one server or remove MCP configuration",
      });
    }

    // Check for duplicate server names or URLs
    const names = new Set();
    const urls = new Set();

    for (const server of servers) {
      if (names.has(server.name)) {
        warnings.push({
          server: server.name,
          type: "configuration",
          message: "Duplicate server name detected",
          severity: "warning",
          suggestion: "Use unique names for all MCP servers",
        });
      }
      names.add(server.name);

      if (server.config.type === "remote" && server.config.url) {
        if (urls.has(server.config.url)) {
          warnings.push({
            server: server.name,
            type: "configuration",
            message: "Duplicate server URL detected",
            severity: "warning",
            suggestion:
              "Multiple servers pointing to the same URL may cause conflicts",
          });
        }
        urls.add(server.config.url);
      }
    }
  }

  /**
   * Get quick validation status
   */
  getQuickStatus(): {
    valid: boolean;
    errorCount: number;
    warningCount: number;
  } {
    const basicValidation = validateMCPServersConfig(this.manager.getConfig());
    const stats = this.manager.getStatistics();

    return {
      valid: basicValidation.valid && stats.errors === 0,
      errorCount: basicValidation.errors.length + stats.errors,
      warningCount: 0, // Quick status doesn't include warnings
    };
  }

  /**
   * Generate validation report
   */
  generateReport(result: MCPValidationResult): string {
    let report = "=== MCP Configuration Validation Report ===\n\n";

    // Summary
    report += `Status: ${result.valid ? "✅ VALID" : "❌ INVALID"}\n`;
    report += `Servers: ${result.serverCount} total, ${result.enabledCount} enabled\n`;
    report += `Issues: ${result.errors.length} errors, ${result.warnings.length} warnings\n\n`;

    // Errors
    if (result.errors.length > 0) {
      report += "🚨 ERRORS:\n";
      for (const error of result.errors) {
        report += `  • [${error.server}] ${error.message}\n`;
      }
      report += "\n";
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += "⚠️  WARNINGS:\n";
      for (const warning of result.warnings) {
        report += `  • [${warning.server}] ${warning.message}\n`;
        if (warning.suggestion) {
          report += `    💡 ${warning.suggestion}\n`;
        }
      }
      report += "\n";
    }

    // Recommendations
    if (result.valid && result.warnings.length === 0) {
      report += "✨ Configuration looks great! No issues found.\n";
    } else if (result.valid && result.warnings.length > 0) {
      report += "✅ Configuration is valid but could be improved.\n";
    } else {
      report += "❌ Configuration has errors that must be fixed.\n";
    }

    return report;
  }
}

/**
 * Quick validation function for MCP configuration
 */
export function validateMCPConfiguration(
  config: MCPServersConfig
): Promise<MCPValidationResult> {
  const validator = new MCPValidator(config);
  return validator.validateConfiguration();
}

/**
 * Quick status check for MCP configuration
 */
export function getMCPConfigurationStatus(config: MCPServersConfig) {
  const validator = new MCPValidator(config);
  return validator.getQuickStatus();
}
