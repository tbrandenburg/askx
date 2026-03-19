import type { NextRequest } from "next/server";
import {
  getConfigurationHealth,
  reloadConfiguration,
} from "@/lib/config/middleware";

/**
 * Configuration Health Check Endpoint
 *
 * GET /api/config/health - Get configuration health status
 * POST /api/config/health - Reload configuration (development only)
 */

export async function GET() {
  const health = getConfigurationHealth();

  return Response.json(
    {
      healthy: health.healthy,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: health.error,
      validation: health.validation,
      // Don't expose sensitive config data in production
      config:
        process.env.NODE_ENV === "development" ? health.config : undefined,
    },
    {
      status: health.healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // Only allow reloading in development
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      {
        error: "Configuration reload is only available in development mode",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    reloadConfiguration();
    const health = getConfigurationHealth();

    return Response.json(
      {
        message: "Configuration reloaded successfully",
        healthy: health.healthy,
        timestamp: new Date().toISOString(),
        error: health.error,
        validation: health.validation,
        config: health.config,
      },
      {
        status: health.healthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: "Failed to reload configuration",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
