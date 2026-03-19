import {
  accessSync,
  constants,
  existsSync,
  promises as fsPromises,
  readdirSync,
} from "node:fs";
import { basename, isAbsolute, resolve } from "node:path";
import type { SkillsConfig } from "../config/types";

/**
 * Skills Directory Configuration Manager
 * Handles skills directory path configuration, resolution, and validation
 */
export class SkillsManager {
  private readonly config: SkillsConfig;
  private readonly defaultDirectory: string = "./skills";

  constructor(config: SkillsConfig) {
    this.config = config;
  }

  /**
   * Get the skills configuration
   */
  getConfig(): SkillsConfig {
    return { ...this.config };
  }

  /**
   * Check if skills are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Get the configured skills directory path
   * Resolves to absolute path with fallbacks
   */
  getDirectory(): string {
    const configPath = this.config.directory || this.defaultDirectory;

    // If path is already absolute, use as-is
    if (isAbsolute(configPath)) {
      return configPath;
    }

    // Resolve relative path from current working directory
    return resolve(process.cwd(), configPath);
  }

  /**
   * Get directory path for a specific environment
   * Supports environment-specific overrides like skills-dev/, skills-prod/
   */
  getDirectoryForEnvironment(environment?: string): string {
    if (!environment) {
      return this.getDirectory();
    }

    const baseDir = this.getDirectory();
    const envSpecificDir = `${baseDir}-${environment}`;

    // Check if environment-specific directory exists, otherwise fallback to base
    if (existsSync(envSpecificDir)) {
      return envSpecificDir;
    }

    return baseDir;
  }

  /**
   * Validate skills directory configuration
   */
  validateConfiguration(): SkillsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const directory = this.getDirectory();

    // Check if directory exists
    if (!existsSync(directory)) {
      errors.push(`Skills directory does not exist: ${directory}`);
    }

    // Check if directory is readable (basic check)
    try {
      accessSync(directory, constants.R_OK);
    } catch {
      errors.push(`Skills directory is not readable: ${directory}`);
    }

    // Validate enabled setting
    if (this.config.enabled === undefined) {
      warnings.push(
        "Skills enabled setting not explicitly configured - defaulting to enabled"
      );
    }

    // Check for common naming patterns
    const directoryName = basename(directory);
    const commonNames = ["skills", "skill", "templates", "workflows"];
    if (
      !commonNames.some((name) => directoryName.toLowerCase().includes(name))
    ) {
      warnings.push(
        `Skills directory name "${directoryName}" may not follow common naming conventions`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      directory,
      enabled: this.isEnabled(),
    };
  }

  /**
   * Create skills directory if it doesn't exist
   */
  async ensureDirectory(): Promise<boolean> {
    const directory = this.getDirectory();

    if (existsSync(directory)) {
      return true;
    }

    try {
      await fsPromises.mkdir(directory, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Failed to create skills directory: ${directory}`, error);
      return false;
    }
  }

  /**
   * Get skills directory statistics
   */
  getStatistics(): SkillsStatistics {
    const directory = this.getDirectory();
    const enabled = this.isEnabled();

    let skillCount = 0;
    let directoryExists = false;
    let isReadable = false;

    if (existsSync(directory)) {
      directoryExists = true;

      try {
        accessSync(directory, constants.R_OK);
        isReadable = true;

        // Count potential skill files (.md, .js, .ts, .json)
        const files = readdirSync(directory);
        skillCount = files.filter(
          (file: string) =>
            file.endsWith(".md") ||
            file.endsWith(".js") ||
            file.endsWith(".ts") ||
            file.endsWith(".json")
        ).length;
      } catch {
        isReadable = false;
      }
    }

    return {
      enabled,
      directory,
      directoryExists,
      isReadable,
      skillCount,
    };
  }
}

/**
 * Skills Validation Result
 */
export interface SkillsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  directory: string;
  enabled: boolean;
}

/**
 * Skills Directory Statistics
 */
export interface SkillsStatistics {
  enabled: boolean;
  directory: string;
  directoryExists: boolean;
  isReadable: boolean;
  skillCount: number;
}

/**
 * Validate skills configuration
 */
export function validateSkillsConfig(
  config: SkillsConfig
): SkillsValidationResult {
  const manager = new SkillsManager(config);
  return manager.validateConfiguration();
}

/**
 * Get skills directory path with validation
 */
export function getSkillsDirectory(config: SkillsConfig): string {
  const manager = new SkillsManager(config);
  return manager.getDirectory();
}

/**
 * Check if skills are enabled in configuration
 */
export function areSkillsEnabled(config: SkillsConfig): boolean {
  const manager = new SkillsManager(config);
  return manager.isEnabled();
}
