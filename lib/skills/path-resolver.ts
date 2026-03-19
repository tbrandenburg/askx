import {
  accessSync,
  constants,
  existsSync,
  promises as fsPromises,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { SkillsManager } from "../config/skills";
import type { SkillsConfig } from "../config/types";

/**
 * Skills Path Resolver
 * Resolves skills directory paths with fallback strategies
 */
export class SkillsPathResolver {
  private readonly manager: SkillsManager;
  private readonly fallbackPaths: string[];

  constructor(config: SkillsConfig) {
    this.manager = new SkillsManager(config);
    this.fallbackPaths = this.generateFallbackPaths();
  }

  /**
   * Generate fallback paths in priority order
   */
  private generateFallbackPaths(): string[] {
    const paths: string[] = [];

    // 1. Configured directory (highest priority)
    const configuredPath = this.manager.getDirectory();
    paths.push(configuredPath);

    // 2. Environment-specific variants
    const environment = process.env.NODE_ENV || process.env.ENVIRONMENT;
    if (environment) {
      paths.push(`${configuredPath}-${environment}`);
      paths.push(join(configuredPath, environment));
    }

    // 3. Current working directory variants
    const cwd = process.cwd();
    paths.push(join(cwd, "skills"));
    paths.push(join(cwd, "skill"));
    paths.push(join(cwd, ".skills"));

    // 4. User home directory variants
    const home = homedir();
    paths.push(join(home, ".opencode", "skills"));
    paths.push(join(home, ".skills"));

    // 5. System-wide locations (Unix-like systems)
    if (process.platform !== "win32") {
      paths.push("/usr/local/share/opencode/skills");
      paths.push("/opt/opencode/skills");
    }

    // 6. Default relative path
    paths.push("./skills");

    // Remove duplicates while preserving order
    return Array.from(new Set(paths));
  }

  /**
   * Resolve the best available skills directory
   * Returns the first path that exists and is accessible
   */
  resolve(): SkillsPathResolution {
    const errors: string[] = [];

    for (const path of this.fallbackPaths) {
      try {
        const resolution = this.validatePath(path);
        if (resolution.valid) {
          return {
            ...resolution,
            resolvedPath: path,
            fallbacksChecked: this.fallbackPaths.indexOf(path) + 1,
          };
        }
        errors.push(...resolution.errors);
      } catch (error) {
        errors.push(
          `Failed to check path "${path}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // No valid path found, return the configured path with errors
    return {
      resolvedPath: this.manager.getDirectory(),
      valid: false,
      errors,
      warnings: ["No valid skills directory found, using configured path"],
      isDirectory: false,
      isReadable: false,
      fallbacksChecked: this.fallbackPaths.length,
    };
  }

  /**
   * Resolve with environment-specific override
   */
  resolveForEnvironment(environment: string): SkillsPathResolution {
    const envPath = this.manager.getDirectoryForEnvironment(environment);
    const resolution = this.validatePath(envPath);

    if (resolution.valid) {
      return {
        ...resolution,
        resolvedPath: envPath,
        fallbacksChecked: 1,
      };
    }

    // Fall back to regular resolution if environment-specific path fails
    return this.resolve();
  }

  /**
   * Validate a specific path
   */
  private validatePath(path: string): SkillsPathValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    let resolvedPath = path;

    // Resolve relative paths
    if (!isAbsolute(path)) {
      resolvedPath = resolve(process.cwd(), path);
    }

    // Check if path exists
    if (!existsSync(resolvedPath)) {
      errors.push(`Path does not exist: ${resolvedPath}`);
      return {
        valid: false,
        errors,
        warnings,
        isDirectory: false,
        isReadable: false,
      };
    }

    // Check if it's a directory
    let isDirectory = false;
    try {
      const stats = statSync(resolvedPath);
      isDirectory = stats.isDirectory();

      if (!isDirectory) {
        errors.push(`Path is not a directory: ${resolvedPath}`);
      }
    } catch (error) {
      errors.push(
        `Cannot stat path "${resolvedPath}": ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Check if readable
    let isReadable = false;
    try {
      // Try to read directory contents
      accessSync(resolvedPath, constants.R_OK);
      isReadable = true;
    } catch {
      errors.push(`Directory is not readable: ${resolvedPath}`);
    }

    // Add warnings for unusual locations
    if (resolvedPath.includes("node_modules")) {
      warnings.push(
        "Skills directory is inside node_modules - may be affected by dependency updates"
      );
    }

    if (resolvedPath.startsWith("/tmp") || resolvedPath.includes("temp")) {
      warnings.push(
        "Skills directory is in temporary location - may be cleared on system restart"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      isDirectory,
      isReadable,
    };
  }

  /**
   * Get all available fallback paths (for debugging)
   */
  getFallbackPaths(): string[] {
    return [...this.fallbackPaths];
  }

  /**
   * Get resolution details for all fallback paths
   */
  analyzeAllPaths(): SkillsPathAnalysis[] {
    return this.fallbackPaths.map((path) => {
      const validation = this.validatePath(path);
      return {
        path,
        ...validation,
      };
    });
  }

  /**
   * Create skills directory if it doesn't exist
   */
  async createDirectory(path?: string): Promise<boolean> {
    const targetPath = path || this.manager.getDirectory();

    try {
      await fsPromises.mkdir(targetPath, { recursive: true });

      // Verify creation was successful
      const validation = this.validatePath(targetPath);
      return validation.valid;
    } catch (error) {
      console.error(`Failed to create skills directory: ${targetPath}`, error);
      return false;
    }
  }
}

/**
 * Skills Path Resolution Result
 */
export interface SkillsPathResolution {
  resolvedPath: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  isDirectory: boolean;
  isReadable: boolean;
  fallbacksChecked: number;
}

/**
 * Skills Path Validation Result
 */
export interface SkillsPathValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isDirectory: boolean;
  isReadable: boolean;
}

/**
 * Skills Path Analysis Result
 */
export interface SkillsPathAnalysis extends SkillsPathValidation {
  path: string;
}

/**
 * Resolve skills directory from configuration
 */
export function resolveSkillsPath(config: SkillsConfig): SkillsPathResolution {
  const resolver = new SkillsPathResolver(config);
  return resolver.resolve();
}

/**
 * Resolve skills directory for specific environment
 */
export function resolveSkillsPathForEnvironment(
  config: SkillsConfig,
  environment: string
): SkillsPathResolution {
  const resolver = new SkillsPathResolver(config);
  return resolver.resolveForEnvironment(environment);
}

/**
 * Get all available fallback paths
 */
export function getSkillsFallbackPaths(config: SkillsConfig): string[] {
  const resolver = new SkillsPathResolver(config);
  return resolver.getFallbackPaths();
}
