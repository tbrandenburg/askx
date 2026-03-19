import { validateMCPServersConfig } from "../mcp/config-loader";
import { ProviderManager } from "./providers";
import { validateSkillsConfig } from "./skills";
import type {
  MCPServersConfig,
  OpenCodeConfig,
  ProvidersConfig,
  SkillsConfig,
} from "./types";

/**
 * Comprehensive Configuration Validation Pipeline
 * Validates OpenCode configuration against schema and business rules
 */
export class ConfigurationValidator {
  private readonly config: OpenCodeConfig;

  constructor(config: OpenCodeConfig) {
    this.config = config;
  }

  /**
   * Perform comprehensive validation of the configuration
   */
  validate(): ConfigurationValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ConfigurationValidationWarning[] = [];

    // 1. Schema validation
    this.validateSchema(errors, warnings);

    // 2. Provider validation
    if (this.config.provider) {
      this.validateProviders(this.config.provider, errors, warnings);
    }

    // 3. MCP servers validation
    if (this.config.mcp) {
      this.validateMCPServers(this.config.mcp, errors, warnings);
    }

    // 4. Skills validation
    if (this.config.skills) {
      this.validateSkills(this.config.skills, errors, warnings);
    }

    // 5. Cross-system validation
    this.validateCrossSystem(errors, warnings);

    // 6. Security validation
    this.validateSecurity(errors, warnings);

    return {
      valid: errors.length === 0,
      config: this.config,
      errors,
      warnings,
      summary: this.generateValidationSummary(errors, warnings),
    };
  }

  /**
   * Quick validation for basic schema compliance
   */
  quickValidate(): QuickConfigurationValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ConfigurationValidationWarning[] = [];

    this.validateSchema(errors, warnings);

    return {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      hasRequiredFields: this.hasRequiredFields(),
      schemaVersion: this.config.$schema,
    };
  }

  /**
   * Validate basic schema compliance
   */
  private validateSchema(
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): void {
    // Check schema version
    if (!this.config.$schema) {
      warnings.push({
        type: "schema",
        field: "$schema",
        message: "No schema version specified",
        severity: "warning",
        suggestion: "Add $schema field to specify configuration version",
      });
    } else if (!this.config.$schema.includes("opencode.ai")) {
      warnings.push({
        type: "schema",
        field: "$schema",
        message: "Unknown schema URL",
        severity: "warning",
        suggestion: "Use official OpenCode schema URL",
      });
    }

    // Check for unknown top-level fields
    const knownFields = [
      "$schema",
      "model",
      "small_model",
      "provider",
      "agent",
      "default_agent",
      "mcp",
      "skills",
      "tools",
      "command",
      "server",
      "compaction",
      "watcher",
      "permission",
      "formatter",
      "share",
      "plugin",
      "experimental",
    ];

    for (const key of Object.keys(this.config)) {
      if (!knownFields.includes(key)) {
        warnings.push({
          type: "schema",
          field: key,
          message: `Unknown configuration field: ${key}`,
          severity: "warning",
          suggestion: "Remove unknown field or check spelling",
        });
      }
    }

    // Validate required field types
    if (this.config.model && typeof this.config.model !== "string") {
      errors.push({
        type: "schema",
        field: "model",
        message: "Model must be a string",
        severity: "error",
        suggestion: "Provide model name as string",
      });
    }

    if (
      this.config.small_model &&
      typeof this.config.small_model !== "string"
    ) {
      errors.push({
        type: "schema",
        field: "small_model",
        message: "Small model must be a string",
        severity: "error",
        suggestion: "Provide small model name as string",
      });
    }
  }

  /**
   * Validate provider configuration
   */
  private validateProviders(
    providers: ProvidersConfig,
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): void {
    if (!providers || typeof providers !== "object") {
      errors.push({
        type: "provider",
        field: "provider",
        message: "Provider configuration must be an object",
        severity: "error",
        suggestion: "Provide provider configuration as key-value pairs",
      });
      return;
    }

    for (const [providerName, config] of Object.entries(providers)) {
      try {
        // Validate individual provider using ProviderManager
        const manager = new ProviderManager({ [providerName]: config });
        const provider = manager.getProvider(providerName);

        if (!provider) {
          errors.push({
            type: "provider",
            field: `provider.${providerName}`,
            message: `Failed to initialize provider: ${providerName}`,
            severity: "error",
            suggestion: "Check provider configuration and credentials",
          });
          continue;
        }

        // Validate API key presence
        if (config.options?.apiKey) {
          if (typeof config.options.apiKey === "string") {
            // Check for placeholder patterns
            if (config.options.apiKey.includes("{env:")) {
              const envVar =
                config.options.apiKey.match(/\{env:([^}]+)\}/)?.[1];
              if (envVar && !process.env[envVar]) {
                errors.push({
                  type: "provider",
                  field: `provider.${providerName}.options.apiKey`,
                  message: `Environment variable ${envVar} not found`,
                  severity: "error",
                  suggestion: `Set environment variable ${envVar}`,
                });
              }
            } else if (
              !config.options.apiKey.startsWith("sk-") &&
              !config.options.apiKey.startsWith("anthropic") &&
              config.options.apiKey.length < 10
            ) {
              warnings.push({
                type: "provider",
                field: `provider.${providerName}.options.apiKey`,
                message: "API key appears invalid or too short",
                severity: "warning",
                suggestion: "Verify API key format",
              });
            }
          }
        } else if (providerName === "openai" || providerName === "anthropic") {
          warnings.push({
            type: "provider",
            field: `provider.${providerName}.options.apiKey`,
            message: `No API key configured for ${providerName}`,
            severity: "warning",
            suggestion: "Add API key for provider to function",
          });
        }

        // Validate models configuration
        if (config.models && typeof config.models === "object") {
          for (const [modelName, modelConfig] of Object.entries(
            config.models
          )) {
            if (!modelName || typeof modelName !== "string") {
              errors.push({
                type: "provider",
                field: `provider.${providerName}.models`,
                message: "Model names must be non-empty strings",
                severity: "error",
                suggestion: "Provide valid model names",
              });
            }

            // Validate model-specific configuration
            if (modelConfig && typeof modelConfig === "object") {
              const maxTokens = (modelConfig as any).maxTokens;
              if (
                maxTokens &&
                (typeof maxTokens !== "number" || maxTokens <= 0)
              ) {
                errors.push({
                  type: "provider",
                  field: `provider.${providerName}.models.${modelName}.maxTokens`,
                  message: "maxTokens must be a positive number",
                  severity: "error",
                  suggestion: "Set maxTokens to a positive integer",
                });
              }
            }
          }
        }
      } catch (error) {
        errors.push({
          type: "provider",
          field: `provider.${providerName}`,
          message: `Provider validation failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          suggestion: "Check provider configuration syntax",
        });
      }
    }
  }

  /**
   * Validate MCP servers configuration
   */
  private validateMCPServers(
    mcpServers: MCPServersConfig,
    errors: ConfigurationValidationError[],
    _warnings: ConfigurationValidationWarning[]
  ): void {
    try {
      const validation = validateMCPServersConfig(mcpServers);

      // Convert MCP validation results
      for (const error of validation.errors) {
        for (const errorMsg of error.errors) {
          errors.push({
            type: "mcp",
            field: `mcp.${error.server}`,
            message: errorMsg,
            severity: "error",
            suggestion: "Fix MCP server configuration",
          });
        }
      }
    } catch (error) {
      errors.push({
        type: "mcp",
        field: "mcp",
        message: `MCP validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
        suggestion: "Check MCP server configuration syntax",
      });
    }
  }

  /**
   * Validate skills configuration
   */
  private validateSkills(
    skills: SkillsConfig,
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): void {
    try {
      const validation = validateSkillsConfig(skills);

      // Convert skills validation results
      for (const error of validation.errors) {
        errors.push({
          type: "skills",
          field: "skills",
          message: error,
          severity: "error",
          suggestion: "Fix skills configuration",
        });
      }

      for (const warning of validation.warnings) {
        warnings.push({
          type: "skills",
          field: "skills",
          message: warning,
          severity: "warning",
          suggestion: null,
        });
      }
    } catch (error) {
      errors.push({
        type: "skills",
        field: "skills",
        message: `Skills validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
        suggestion: "Check skills configuration syntax",
      });
    }
  }

  /**
   * Validate cross-system compatibility and references
   */
  private validateCrossSystem(
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): void {
    // Validate model references
    if (this.config.model && !this.isModelAvailable(this.config.model)) {
      errors.push({
        type: "reference",
        field: "model",
        message: `Model "${this.config.model}" not found in provider configuration`,
        severity: "error",
        suggestion:
          "Add model to provider configuration or change model reference",
      });
    }

    if (
      this.config.small_model &&
      !this.isModelAvailable(this.config.small_model)
    ) {
      errors.push({
        type: "reference",
        field: "small_model",
        message: `Small model "${this.config.small_model}" not found in provider configuration`,
        severity: "error",
        suggestion:
          "Add small model to provider configuration or change reference",
      });
    }

    // Validate agent references
    if (
      this.config.default_agent &&
      this.config.agent &&
      !(this.config.default_agent in this.config.agent)
    ) {
      errors.push({
        type: "reference",
        field: "default_agent",
        message: `Default agent "${this.config.default_agent}" not found in agent configuration`,
        severity: "error",
        suggestion: "Add agent definition or change default_agent reference",
      });
    }

    // Check for common configuration issues
    if (!this.config.provider && !this.config.model) {
      warnings.push({
        type: "configuration",
        field: "provider",
        message: "No providers or models configured",
        severity: "warning",
        suggestion: "Add at least one provider configuration",
      });
    }
  }

  /**
   * Validate security aspects of configuration
   */
  private validateSecurity(
    _errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): void {
    // Check for hardcoded secrets
    const configString = JSON.stringify(this.config);

    // Look for potential hardcoded API keys
    const hardcodedPatterns = [
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
      /anthropic[a-zA-Z0-9-_]{32,}/, // Anthropic API key pattern
      /[a-zA-Z0-9-_]{32,}/, // Generic long token pattern
    ];

    for (const pattern of hardcodedPatterns) {
      if (pattern.test(configString)) {
        warnings.push({
          type: "security",
          field: "provider",
          message: "Potential hardcoded API key detected",
          severity: "warning",
          suggestion: "Use environment variables for sensitive credentials",
        });
        break; // Only warn once
      }
    }

    // Check MCP server security
    if (this.config.mcp) {
      for (const [serverName, serverConfig] of Object.entries(
        this.config.mcp
      )) {
        if (
          serverConfig.type === "remote" &&
          serverConfig.url &&
          !serverConfig.url.startsWith("https://")
        ) {
          warnings.push({
            type: "security",
            field: `mcp.${serverName}.url`,
            message: "Remote MCP server not using HTTPS",
            severity: "warning",
            suggestion: "Use HTTPS URLs for secure communication",
          });
        }
      }
    }
  }

  /**
   * Check if model is available in provider configuration
   */
  private isModelAvailable(modelName: string): boolean {
    if (!this.config.provider) {
      return false;
    }

    for (const provider of Object.values(this.config.provider)) {
      if (provider.models && modelName in provider.models) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if configuration has required fields
   */
  private hasRequiredFields(): boolean {
    // At minimum, we need either a model reference or provider configuration
    return !!(this.config.model || this.config.provider);
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): ConfigurationValidationSummary {
    const errorsByType = this.groupErrorsByType(errors);
    const warningsByType = this.groupErrorsByType(warnings);

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      errorsByType,
      warningsByType,
      criticalIssues: errors.filter(
        (e) => e.type === "security" || e.type === "reference"
      ).length,
      configurationHealth: this.calculateConfigurationHealth(errors, warnings),
    };
  }

  /**
   * Group errors/warnings by type
   */
  private groupErrorsByType(
    issues: (ConfigurationValidationError | ConfigurationValidationWarning)[]
  ): Record<string, number> {
    return issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Calculate overall configuration health score (0-100)
   */
  private calculateConfigurationHealth(
    errors: ConfigurationValidationError[],
    warnings: ConfigurationValidationWarning[]
  ): number {
    const maxScore = 100;
    const errorPenalty = 15; // Each error reduces score by 15 points
    const warningPenalty = 5; // Each warning reduces score by 5 points

    const penalty =
      errors.length * errorPenalty + warnings.length * warningPenalty;
    return Math.max(0, maxScore - penalty);
  }
}

// Type definitions

export interface ConfigurationValidationError {
  type:
    | "schema"
    | "provider"
    | "mcp"
    | "skills"
    | "reference"
    | "security"
    | "configuration";
  field: string;
  message: string;
  severity: "error";
  suggestion: string | null;
}

export interface ConfigurationValidationWarning {
  type:
    | "schema"
    | "provider"
    | "mcp"
    | "skills"
    | "reference"
    | "security"
    | "configuration";
  field: string;
  message: string;
  severity: "warning";
  suggestion: string | null;
}

export interface ConfigurationValidationResult {
  valid: boolean;
  config: OpenCodeConfig;
  errors: ConfigurationValidationError[];
  warnings: ConfigurationValidationWarning[];
  summary: ConfigurationValidationSummary;
}

export interface QuickConfigurationValidationResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  hasRequiredFields: boolean;
  schemaVersion?: string;
}

export interface ConfigurationValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  errorsByType: Record<string, number>;
  warningsByType: Record<string, number>;
  criticalIssues: number;
  configurationHealth: number; // 0-100 score
}

// Export utility functions

/**
 * Validate OpenCode configuration
 */
export function validateConfiguration(
  config: OpenCodeConfig
): ConfigurationValidationResult {
  const validator = new ConfigurationValidator(config);
  return validator.validate();
}

/**
 * Quick configuration validation
 */
export function quickValidateConfiguration(
  config: OpenCodeConfig
): QuickConfigurationValidationResult {
  const validator = new ConfigurationValidator(config);
  return validator.quickValidate();
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  result: ConfigurationValidationResult
): string {
  let report = "=== OpenCode Configuration Validation Report ===\n\n";

  // Summary
  report += `Status: ${result.valid ? "✅ VALID" : "❌ INVALID"}\n`;
  report += `Health Score: ${result.summary.configurationHealth}/100\n`;
  report += `Issues: ${result.errors.length} errors, ${result.warnings.length} warnings\n\n`;

  // Errors
  if (result.errors.length > 0) {
    report += "🚨 ERRORS:\n";
    for (const error of result.errors) {
      report += `  • [${error.field}] ${error.message}\n`;
      if (error.suggestion) {
        report += `    💡 ${error.suggestion}\n`;
      }
    }
    report += "\n";
  }

  // Warnings
  if (result.warnings.length > 0) {
    report += "⚠️  WARNINGS:\n";
    for (const warning of result.warnings) {
      report += `  • [${warning.field}] ${warning.message}\n`;
      if (warning.suggestion) {
        report += `    💡 ${warning.suggestion}\n`;
      }
    }
    report += "\n";
  }

  // Summary by type
  if (result.errors.length > 0 || result.warnings.length > 0) {
    report += "📊 ISSUES BY TYPE:\n";
    const allTypes = Array.from(
      new Set([
        ...Object.keys(result.summary.errorsByType),
        ...Object.keys(result.summary.warningsByType),
      ])
    );

    for (const type of allTypes) {
      const errors = result.summary.errorsByType[type] || 0;
      const warnings = result.summary.warningsByType[type] || 0;
      report += `  • ${type}: ${errors} errors, ${warnings} warnings\n`;
    }
    report += "\n";
  }

  // Recommendations
  if (result.valid && result.warnings.length === 0) {
    report += "✨ Configuration is perfect! No issues found.\n";
  } else if (result.valid) {
    report += "✅ Configuration is valid but has some warnings to address.\n";
  } else if (result.summary.criticalIssues > 0) {
    report +=
      "🔥 Configuration has critical issues that must be fixed immediately.\n";
  } else {
    report += "❌ Configuration has errors that must be fixed before use.\n";
  }

  return report;
}
