import { gateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";
import type { ModelProviderInfo, ProviderFactory } from "../config/providers";
import type { ProviderConfig } from "../config/types";

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements ProviderFactory {
  readonly providerId = "openai";
  readonly displayName = "OpenAI";

  /**
   * List of available OpenAI models with metadata
   */
  private static readonly MODELS: ModelProviderInfo[] = [
    {
      id: "openai/gpt-4",
      name: "GPT-4",
      provider: "openai",
      description: "Most capable GPT-4 model",
      contextWindow: 8192,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: false,
    },
    {
      id: "openai/gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      description: "Faster GPT-4 with 128k context",
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: false,
    },
    {
      id: "openai/gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      provider: "openai",
      description: "Fast and cost-effective for simple tasks",
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: false,
    },
    {
      id: "openai/gpt-5-mini",
      name: "GPT-5 Mini",
      provider: "openai",
      description: "Most capable OpenAI model",
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: false,
    },
    {
      id: "openai/gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      description: "Fast and affordable chat model",
      contextWindow: 16_384,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: false,
    },
  ];

  isAvailable(config: ProviderConfig): boolean {
    // Check if API key is provided via environment or config
    const apiKey = config.options?.apiKey || process.env.OPENAI_API_KEY;
    return Boolean(apiKey);
  }

  createModel(modelId: string, _config: ProviderConfig): LanguageModel {
    // The full model ID for OpenAI models (e.g., "openai/gpt-4")
    const fullModelId = `${this.providerId}/${modelId}`;

    // Use the gateway which handles provider configuration internally
    return gateway.languageModel(fullModelId);
  }

  getAvailableModels(config: ProviderConfig): ModelProviderInfo[] {
    if (!this.isAvailable(config)) {
      return [];
    }

    // Return all available models if provider is configured
    return [...OpenAIProvider.MODELS];
  }

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check API key - for Vercel AI Gateway, it can come from environment
    const apiKey = config.options?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      errors.push(
        "OpenAI API key is required. Set OPENAI_API_KEY environment variable or configure in provider options."
      );
    } else if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      errors.push("OpenAI API key must be a non-empty string");
    }

    // Validate base URL if provided
    if (config.options?.baseURL) {
      try {
        new URL(config.options.baseURL);
      } catch {
        errors.push("Base URL must be a valid URL");
      }
    }

    // Validate timeout
    if (
      config.options?.timeout !== undefined &&
      config.options?.timeout !== false &&
      (typeof config.options.timeout !== "number" ||
        config.options.timeout <= 0)
    ) {
      errors.push("Timeout must be a positive number or false");
    }

    // Validate chunk timeout
    if (
      config.options?.chunkTimeout !== undefined &&
      (typeof config.options.chunkTimeout !== "number" ||
        config.options.chunkTimeout <= 0)
    ) {
      errors.push("Chunk timeout must be a positive number");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getDefaultConfig(): ProviderConfig {
    return {
      options: {
        timeout: 300_000, // 5 minutes
        chunkTimeout: 30_000, // 30 seconds
        setCacheKey: false,
      },
      models: {},
    };
  }

  /**
   * Check if a model ID is supported by this provider
   */
  static isOpenAIModel(modelId: string): boolean {
    return OpenAIProvider.MODELS.some((model) => model.id === modelId);
  }

  /**
   * Get model info by ID
   */
  static getModelInfo(modelId: string): ModelProviderInfo | undefined {
    return OpenAIProvider.MODELS.find((model) => model.id === modelId);
  }
}
