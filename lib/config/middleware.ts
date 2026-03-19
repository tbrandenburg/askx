import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loadEnvironmentConfig } from "./environment";
import type { OpenCodeConfig } from "./types";
import { validateConfiguration } from "./validator";

/**
 * Global configuration state for middleware
 */
let globalConfig: OpenCodeConfig | null = null;
let configError: Error | null = null;
let isConfigInitialized = false;

/**
 * Initialize configuration on application startup
 * This should be called once during app initialization
 */
export function initializeConfiguration(): void {
  if (isConfigInitialized) {
    return;
  }

  try {
    console.log("[Config Middleware] Initializing OpenCode configuration...");

    // Load configuration
    globalConfig = loadEnvironmentConfig();

    // Validate configuration
    const validation = validateConfiguration(globalConfig);

    if (!validation.valid) {
      const errors = validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join(", ");
      throw new Error(`Configuration validation failed: ${errors}`);
    }

    // Log warnings but continue
    if (validation.warnings.length > 0) {
      console.warn(
        "[Config Middleware] Configuration warnings:",
        validation.warnings.map((w) => `${w.field}: ${w.message}`)
      );
    }

    console.log(
      `[Config Middleware] Configuration loaded successfully. Health: ${validation.summary.configurationHealth}/100`
    );

    isConfigInitialized = true;
    configError = null;
  } catch (error) {
    configError = error instanceof Error ? error : new Error(String(error));
    console.error(
      "[Config Middleware] Failed to initialize configuration:",
      configError
    );

    // In production, we want to fail fast
    if (process.env.NODE_ENV === "production") {
      throw configError;
    }

    isConfigInitialized = true; // Mark as initialized to prevent retry loops
  }
}

/**
 * Get the current global configuration
 */
export function getGlobalConfiguration(): OpenCodeConfig {
  if (!isConfigInitialized) {
    initializeConfiguration();
  }

  if (configError) {
    throw configError;
  }

  return globalConfig || {};
}

/**
 * Check if configuration is healthy
 */
export function isConfigurationHealthy(): boolean {
  try {
    if (!isConfigInitialized) {
      initializeConfiguration();
    }
    return configError === null;
  } catch {
    return false;
  }
}

/**
 * Get configuration health status
 */
export function getConfigurationHealth(): {
  healthy: boolean;
  error?: string;
  config?: OpenCodeConfig;
  validation?: any;
} {
  try {
    if (!isConfigInitialized) {
      initializeConfiguration();
    }

    if (configError) {
      return {
        healthy: false,
        error: configError.message,
      };
    }

    const config = globalConfig || {};
    const validation = validateConfiguration(config);

    return {
      healthy: validation.valid,
      config,
      validation: validation.summary,
      error: validation.valid
        ? undefined
        : validation.errors.map((e) => `${e.field}: ${e.message}`).join(", "),
    };
  } catch (error) {
    return {
      healthy: false,
      error:
        error instanceof Error ? error.message : "Unknown configuration error",
    };
  }
}

/**
 * Reload configuration (for development)
 */
export function reloadConfiguration(): void {
  console.log("[Config Middleware] Reloading configuration...");
  isConfigInitialized = false;
  globalConfig = null;
  configError = null;
  initializeConfiguration();
}

/**
 * Configuration validation middleware for Next.js API routes
 * Ensures configuration is loaded and valid before processing requests
 */
export function withConfigValidation<T extends NextRequest>(
  handler: (req: T) => Promise<NextResponse> | NextResponse
) {
  return async (req: T): Promise<NextResponse> => {
    try {
      // Ensure configuration is initialized and valid
      if (!isConfigurationHealthy()) {
        return new NextResponse(
          JSON.stringify({
            error: "Configuration Error",
            message: configError?.message || "Configuration is not healthy",
            timestamp: new Date().toISOString(),
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return await handler(req);
    } catch (error) {
      console.error(
        "[Config Middleware] Configuration error in request:",
        error
      );

      return new NextResponse(
        JSON.stringify({
          error: "Configuration Error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  };
}

/**
 * Initialize configuration on module load in server environment
 * This ensures configuration is ready when the application starts
 */
if (typeof window === "undefined") {
  // Server-side initialization
  try {
    initializeConfiguration();
  } catch (error) {
    // Don't throw here to prevent import failures
    console.error(
      "[Config Middleware] Failed to initialize on module load:",
      error
    );
  }
}
