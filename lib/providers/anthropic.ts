import { gateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";
import type { ModelProviderInfo, ProviderFactory } from "../config/providers";
import type { ProviderConfig } from "../config/types";

/**
 * Anthropic Provider Implementation
 */
export class AnthropicProvider implements ProviderFactory {
  readonly providerId = "anthropic";
  readonly displayName = "Anthropic";

  /**
   * List of available Anthropic models with metadata
   */
  private static readonly MODELS: ModelProviderInfo[] = [
    {
      id: "anthropic/claude-3-opus",
      name: "Claude 3 Opus",
      provider: "anthropic",
      description: "Most powerful Claude 3 model for complex tasks",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      description: "Balanced performance and speed",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
    {
      id: "anthropic/claude-3.7-sonnet-thinking",
      name: "Claude 3.7 Sonnet",
      provider: "anthropic",
      description: "Extended thinking for complex problems",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      description: "Fast and affordable Claude 3 model",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
    {
      id: "anthropic/claude-haiku-4.5",
      name: "Claude Haiku 4.5",
      provider: "anthropic",
      description: "Fast and affordable, great for everyday tasks",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
    {
      id: "anthropic/claude-sonnet-4-5",
      name: "Claude Sonnet 4.5",
      provider: "anthropic",
      description: "Advanced reasoning and analysis capabilities",
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsTools: true,
      supportsCaching: true,
    },
  ];

  isAvailable(config: ProviderConfig): boolean {
    // Check if API key is provided via environment or config
    const apiKey = config.options?.apiKey || process.env.ANTHROPIC_API_KEY;
    return Boolean(apiKey);
  }

  createModel(modelId: string, _config: ProviderConfig): LanguageModel {
    // The full model ID for Anthropic models (e.g., "anthropic/claude-3.5-sonnet")
    const fullModelId = `${this.providerId}/${modelId}`;

    // Use the gateway which handles provider configuration internally
    return gateway.languageModel(fullModelId);
  }

  getAvailableModels(config: ProviderConfig): ModelProviderInfo[] {
    if (!this.isAvailable(config)) {
      return [];
    }

    // Return all available models if provider is configured
    return [...AnthropicProvider.MODELS];
  }

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check API key - for Vercel AI Gateway, it can come from environment
    const apiKey = config.options?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      errors.push(
        "Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or configure in provider options."
      );
    } else if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      errors.push("Anthropic API key must be a non-empty string");
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

    // Validate cache key setting
    if (
      config.options?.setCacheKey !== undefined &&
      typeof config.options.setCacheKey !== "boolean"
    ) {
      errors.push("setCacheKey must be a boolean value");
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
        setCacheKey: true, // Anthropic supports caching
      },
      models: {},
    };
  }

  /**
   * Check if a model ID is supported by this provider
   */
  static isAnthropicModel(modelId: string): boolean {
    return AnthropicProvider.MODELS.some((model) => model.id === modelId);
  }

  /**
   * Get model info by ID
   */
  static getModelInfo(modelId: string): ModelProviderInfo | undefined {
    return AnthropicProvider.MODELS.find((model) => model.id === modelId);
  }

  /**
   * Check if model supports reasoning/thinking
   */
  static isReasoningModel(modelId: string): boolean {
    return modelId.includes("thinking") || modelId.includes("reasoning");
  }
}
