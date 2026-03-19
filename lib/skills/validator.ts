import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { SkillsManager } from "../config/skills";
import type { SkillsConfig } from "../config/types";
import { type SkillsPathResolution, SkillsPathResolver } from "./path-resolver";

/**
 * Skills Directory Validator
 * Comprehensive validation of skills directory and its contents
 */
export class SkillsValidator {
  private readonly manager: SkillsManager;
  private readonly pathResolver: SkillsPathResolver;

  constructor(config: SkillsConfig) {
    this.manager = new SkillsManager(config);
    this.pathResolver = new SkillsPathResolver(config);
  }

  /**
   * Perform comprehensive validation of skills configuration and directory
   */
  async validateComplete(): Promise<CompleteSkillsValidationResult> {
    const errors: SkillsValidationError[] = [];
    const warnings: SkillsValidationWarning[] = [];

    // 1. Basic configuration validation
    const configValidation = this.manager.validateConfiguration();

    // Convert basic validation results
    for (const error of configValidation.errors) {
      errors.push({
        type: "configuration",
        severity: "error",
        message: error,
        file: null,
        suggestion: null,
      });
    }

    for (const warning of configValidation.warnings) {
      warnings.push({
        type: "configuration",
        severity: "warning",
        message: warning,
        file: null,
        suggestion: null,
      });
    }

    // 2. Path resolution validation
    const pathResolution = this.pathResolver.resolve();

    if (!pathResolution.valid) {
      for (const error of pathResolution.errors) {
        errors.push({
          type: "path",
          severity: "error",
          message: error,
          file: null,
          suggestion: "Check that the skills directory exists and is readable",
        });
      }
    }

    for (const warning of pathResolution.warnings) {
      warnings.push({
        type: "path",
        severity: "warning",
        message: warning,
        file: null,
        suggestion: null,
      });
    }

    // 3. Directory contents validation (only if path is valid)
    let skillFiles: SkillFileInfo[] = [];
    let skillsCount = 0;

    if (pathResolution.valid && pathResolution.isDirectory) {
      try {
        const contentValidation = await this.validateDirectoryContents(
          pathResolution.resolvedPath
        );

        errors.push(...contentValidation.errors);
        warnings.push(...contentValidation.warnings);
        skillFiles = contentValidation.skillFiles;
        skillsCount = contentValidation.validSkillsCount;
      } catch (error) {
        errors.push({
          type: "content",
          severity: "error",
          message: `Failed to validate directory contents: ${error instanceof Error ? error.message : String(error)}`,
          file: null,
          suggestion: "Check directory permissions and content accessibility",
        });
      }
    }

    // 4. Overall health assessment
    const healthWarnings = this.assessOverallHealth(pathResolution, skillFiles);
    warnings.push(...healthWarnings);

    return {
      valid: errors.length === 0,
      enabled: this.manager.isEnabled(),
      resolvedPath: pathResolution.resolvedPath,
      pathResolution,
      errors,
      warnings,
      skillFiles,
      statistics: {
        totalFiles: skillFiles.length,
        validSkills: skillsCount,
        errors: errors.length,
        warnings: warnings.length,
      },
    };
  }

  /**
   * Validate directory contents
   */
  private async validateDirectoryContents(
    directoryPath: string
  ): Promise<DirectoryContentValidationResult> {
    const errors: SkillsValidationError[] = [];
    const warnings: SkillsValidationWarning[] = [];
    const skillFiles: SkillFileInfo[] = [];
    let validSkillsCount = 0;

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });

      // Filter for potential skill files
      const files = entries.filter(
        (entry) => entry.isFile() && this.isSkillFile(entry.name)
      );

      // Validate each skill file
      for (const file of files) {
        const filePath = join(directoryPath, file.name);
        const fileValidation = await this.validateSkillFile(filePath);

        skillFiles.push(fileValidation);

        if (fileValidation.isValid) {
          validSkillsCount++;
        } else {
          errors.push(...fileValidation.errors);
        }

        warnings.push(...fileValidation.warnings);
      }

      // Check for common issues
      if (skillFiles.length === 0) {
        warnings.push({
          type: "content",
          severity: "warning",
          message: "No skill files found in directory",
          file: null,
          suggestion:
            "Add .md, .js, .ts, or .json skill files to the directory",
        });
      }

      // Check for configuration files
      const configFiles = entries.filter(
        (entry) =>
          entry.isFile() &&
          (entry.name === "skills.json" ||
            entry.name === "config.json" ||
            entry.name.endsWith(".config.js"))
      );

      if (configFiles.length === 0) {
        warnings.push({
          type: "content",
          severity: "warning",
          message: "No skills configuration file found",
          file: null,
          suggestion:
            "Consider adding a skills.json or config.json file for skill metadata",
        });
      }
    } catch (error) {
      errors.push({
        type: "content",
        severity: "error",
        message: `Cannot read directory contents: ${error instanceof Error ? error.message : String(error)}`,
        file: null,
        suggestion: "Check directory permissions",
      });
    }

    return {
      errors,
      warnings,
      skillFiles,
      validSkillsCount,
    };
  }

  /**
   * Validate individual skill file
   */
  private async validateSkillFile(filePath: string): Promise<SkillFileInfo> {
    const errors: SkillsValidationError[] = [];
    const warnings: SkillsValidationWarning[] = [];
    const fileName = basename(filePath);
    const extension = extname(filePath);

    let size = 0;
    let isReadable = false;
    let hasValidContent = false;
    const contentType: SkillFileType = this.getFileType(extension);

    try {
      // Get file stats
      const stats = await stat(filePath);
      size = stats.size;

      // Check if file is readable
      const content = await readFile(filePath, "utf8");
      isReadable = true;

      // Basic content validation
      if (content.trim().length === 0) {
        errors.push({
          type: "content",
          severity: "error",
          message: "File is empty",
          file: fileName,
          suggestion: "Add content to the skill file",
        });
      } else {
        hasValidContent = true;

        // Type-specific validation
        this.validateFileContent(
          content,
          contentType,
          fileName,
          errors,
          warnings
        );
      }

      // Size warnings
      if (size > 1024 * 1024) {
        // > 1MB
        warnings.push({
          type: "content",
          severity: "warning",
          message: "File is very large (>1MB)",
          file: fileName,
          suggestion: "Consider breaking large skills into smaller files",
        });
      }
    } catch (error) {
      errors.push({
        type: "content",
        severity: "error",
        message: `Cannot read file: ${error instanceof Error ? error.message : String(error)}`,
        file: fileName,
        suggestion: "Check file permissions and encoding",
      });
    }

    return {
      fileName,
      filePath,
      extension,
      contentType,
      size,
      isReadable,
      hasValidContent,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate file content based on type
   */
  private validateFileContent(
    content: string,
    type: SkillFileType,
    fileName: string,
    errors: SkillsValidationError[],
    warnings: SkillsValidationWarning[]
  ): void {
    switch (type) {
      case "markdown":
        this.validateMarkdownContent(content, fileName, errors, warnings);
        break;
      case "javascript":
      case "typescript":
        this.validateScriptContent(content, fileName, errors, warnings);
        break;
      case "json":
        this.validateJsonContent(content, fileName, errors, warnings);
        break;
      default:
        warnings.push({
          type: "content",
          severity: "warning",
          message: "Unknown file type",
          file: fileName,
          suggestion:
            "Ensure file has a recognized extension (.md, .js, .ts, .json)",
        });
    }
  }

  /**
   * Validate markdown content
   */
  private validateMarkdownContent(
    content: string,
    fileName: string,
    _errors: SkillsValidationError[],
    warnings: SkillsValidationWarning[]
  ): void {
    // Check for common markdown skill patterns
    if (!content.includes("#")) {
      warnings.push({
        type: "content",
        severity: "warning",
        message: "No headers found in markdown",
        file: fileName,
        suggestion: "Add headers to structure the skill documentation",
      });
    }

    // Look for common skill metadata patterns
    const hasMetadata =
      content.includes("---") ||
      content.includes("<!--") ||
      content.includes("@");
    if (!hasMetadata) {
      warnings.push({
        type: "content",
        severity: "warning",
        message: "No metadata detected",
        file: fileName,
        suggestion: "Consider adding frontmatter or metadata comments",
      });
    }
  }

  /**
   * Validate script content
   */
  private validateScriptContent(
    content: string,
    fileName: string,
    _errors: SkillsValidationError[],
    warnings: SkillsValidationWarning[]
  ): void {
    // Basic syntax checks (simplified)
    const hasExport =
      content.includes("export") || content.includes("module.exports");
    if (!hasExport) {
      warnings.push({
        type: "content",
        severity: "warning",
        message: "No exports detected",
        file: fileName,
        suggestion: "Export functions or objects for the skill to be usable",
      });
    }

    // Check for common issues
    if (content.includes("console.log") && !content.includes("// debug")) {
      warnings.push({
        type: "content",
        severity: "warning",
        message: "Debug console.log statements detected",
        file: fileName,
        suggestion: "Remove or comment debug statements for production",
      });
    }
  }

  /**
   * Validate JSON content
   */
  private validateJsonContent(
    content: string,
    fileName: string,
    errors: SkillsValidationError[],
    warnings: SkillsValidationWarning[]
  ): void {
    try {
      const parsed = JSON.parse(content);

      // Check for common skill metadata fields
      const expectedFields = ["name", "description", "version"];
      const missingFields = expectedFields.filter(
        (field) => !(field in parsed)
      );

      if (missingFields.length > 0) {
        warnings.push({
          type: "content",
          severity: "warning",
          message: `Missing recommended fields: ${missingFields.join(", ")}`,
          file: fileName,
          suggestion:
            "Add name, description, and version fields for better skill management",
        });
      }
    } catch {
      errors.push({
        type: "content",
        severity: "error",
        message: "Invalid JSON syntax",
        file: fileName,
        suggestion: "Fix JSON syntax errors",
      });
    }
  }

  /**
   * Assess overall health of skills directory
   */
  private assessOverallHealth(
    pathResolution: SkillsPathResolution,
    skillFiles: SkillFileInfo[]
  ): SkillsValidationWarning[] {
    const warnings: SkillsValidationWarning[] = [];

    const validSkills = skillFiles.filter((f) => f.isValid).length;
    const totalFiles = skillFiles.length;

    if (totalFiles > 0 && validSkills / totalFiles < 0.5) {
      warnings.push({
        type: "health",
        severity: "warning",
        message: `Low skill quality ratio: ${validSkills}/${totalFiles} files are valid`,
        file: null,
        suggestion: "Review and fix invalid skill files",
      });
    }

    if (pathResolution.fallbacksChecked > 1) {
      warnings.push({
        type: "health",
        severity: "warning",
        message: `Skills directory resolved after ${pathResolution.fallbacksChecked} fallback attempts`,
        file: null,
        suggestion:
          "Consider updating configuration to use the resolved path directly",
      });
    }

    return warnings;
  }

  /**
   * Check if file is a potential skill file
   */
  private isSkillFile(fileName: string): boolean {
    const skillExtensions = [".md", ".js", ".ts", ".json"];
    const extension = extname(fileName).toLowerCase();
    return skillExtensions.includes(extension);
  }

  /**
   * Get file type from extension
   */
  private getFileType(extension: string): SkillFileType {
    switch (extension.toLowerCase()) {
      case ".md":
        return "markdown";
      case ".js":
        return "javascript";
      case ".ts":
        return "typescript";
      case ".json":
        return "json";
      default:
        return "unknown";
    }
  }

  /**
   * Quick validation for fast checks
   */
  quickValidate(): QuickSkillsValidationResult {
    const configValid = this.manager.validateConfiguration();
    const pathResolution = this.pathResolver.resolve();

    return {
      valid: configValid.valid && pathResolution.valid,
      enabled: this.manager.isEnabled(),
      path: pathResolution.resolvedPath,
      pathExists: pathResolution.isDirectory,
      errorCount: configValid.errors.length + pathResolution.errors.length,
      warningCount:
        configValid.warnings.length + pathResolution.warnings.length,
    };
  }
}

// Type definitions

export type SkillFileType =
  | "markdown"
  | "javascript"
  | "typescript"
  | "json"
  | "unknown";

export interface SkillsValidationError {
  type: "configuration" | "path" | "content" | "health";
  severity: "error";
  message: string;
  file: string | null;
  suggestion: string | null;
}

export interface SkillsValidationWarning {
  type: "configuration" | "path" | "content" | "health";
  severity: "warning";
  message: string;
  file: string | null;
  suggestion: string | null;
}

export interface SkillFileInfo {
  fileName: string;
  filePath: string;
  extension: string;
  contentType: SkillFileType;
  size: number;
  isReadable: boolean;
  hasValidContent: boolean;
  isValid: boolean;
  errors: SkillsValidationError[];
  warnings: SkillsValidationWarning[];
}

export interface CompleteSkillsValidationResult {
  valid: boolean;
  enabled: boolean;
  resolvedPath: string;
  pathResolution: SkillsPathResolution;
  errors: SkillsValidationError[];
  warnings: SkillsValidationWarning[];
  skillFiles: SkillFileInfo[];
  statistics: {
    totalFiles: number;
    validSkills: number;
    errors: number;
    warnings: number;
  };
}

export interface DirectoryContentValidationResult {
  errors: SkillsValidationError[];
  warnings: SkillsValidationWarning[];
  skillFiles: SkillFileInfo[];
  validSkillsCount: number;
}

export interface QuickSkillsValidationResult {
  valid: boolean;
  enabled: boolean;
  path: string;
  pathExists: boolean;
  errorCount: number;
  warningCount: number;
}

// Export utility functions

/**
 * Comprehensive skills validation
 */
export async function validateSkills(
  config: SkillsConfig
): Promise<CompleteSkillsValidationResult> {
  const validator = new SkillsValidator(config);
  return await validator.validateComplete();
}

/**
 * Quick skills validation
 */
export function quickValidateSkills(
  config: SkillsConfig
): QuickSkillsValidationResult {
  const validator = new SkillsValidator(config);
  return validator.quickValidate();
}
