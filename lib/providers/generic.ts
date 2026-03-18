import { gateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";
import type { ModelProviderInfo, ProviderFactory } from "../config/providers";
import type { ProviderConfig } from "../config/types";

/**
 * Generic Provider Implementation
 * Supports custom OpenAI-compatible providers
 */
export class GenericProvider implements ProviderFactory {
  readonly providerId: string;
  readonly displayName: string;
  private readonly baseURL?: string;

  constructor(providerId: string, displayName?: string, baseURL?: string) {
    this.providerId = providerId;
    this.displayName = displayName || providerId;
    this.baseURL = baseURL;
  }

  isAvailable(config: ProviderConfig): boolean {
    // Generic providers need either API key or custom configuration
    const apiKey =
      config.options?.apiKey ||
      process.env[`${this.providerId.toUpperCase()}_API_KEY`];
    const hasBaseURL = config.options?.baseURL || this.baseURL;

    return Boolean(apiKey && hasBaseURL);
  }

  createModel(modelId: string, _config: ProviderConfig): LanguageModel {
    // For generic providers, use the full qualified model ID
    const fullModelId = `${this.providerId}/${modelId}`;

    // Use the gateway which handles provider configuration internally
    return gateway.languageModel(fullModelId);
  }

  getAvailableModels(config: ProviderConfig): ModelProviderInfo[] {
    if (!this.isAvailable(config)) {
      return [];
    }

    // For generic providers, we can't know models in advance
    // Return empty array - models need to be specified in configuration
    return [];
  }

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check API key
    const apiKey =
      config.options?.apiKey ||
      process.env[`${this.providerId.toUpperCase()}_API_KEY`];
    if (!apiKey) {
      errors.push(
        `API key is required for ${this.providerId}. Set ${this.providerId.toUpperCase()}_API_KEY environment variable or configure in provider options.`
      );
    } else if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
      errors.push("API key must be a non-empty string");
    }

    // Check base URL (required for generic providers)
    const baseURL = config.options?.baseURL || this.baseURL;
    if (!baseURL) {
      errors.push("Base URL is required for generic providers");
    } else if (typeof baseURL !== "string") {
      errors.push("Base URL must be a string");
    } else {
      try {
        new URL(baseURL);
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
        baseURL: this.baseURL,
        timeout: 300_000, // 5 minutes
        chunkTimeout: 30_000, // 30 seconds
        setCacheKey: false,
      },
      models: {},
    };
  }
}

/**
 * Create Google provider
 */
export function createGoogleProvider(): GenericProvider {
  return new GenericProvider(
    "google",
    "Google AI",
    "https://generativelanguage.googleapis.com"
  );
}

/**
 * Create xAI provider
 */
export function createXAIProvider(): GenericProvider {
  return new GenericProvider("xai", "xAI", "https://api.x.ai");
}

/**
 * Create Groq provider
 */
export function createGroqProvider(): GenericProvider {
  return new GenericProvider("groq", "Groq", "https://api.groq.com");
}

/**
 * Create Together AI provider
 */
export function createTogetherProvider(): GenericProvider {
  return new GenericProvider(
    "together",
    "Together AI",
    "https://api.together.xyz"
  );
}

/**
 * Create Perplexity provider
 */
export function createPerplexityProvider(): GenericProvider {
  return new GenericProvider(
    "perplexity",
    "Perplexity",
    "https://api.perplexity.ai"
  );
}

/**
 * Create custom generic provider
 */
export function createCustomProvider(
  providerId: string,
  displayName?: string,
  baseURL?: string
): GenericProvider {
  return new GenericProvider(providerId, displayName, baseURL);
}

/**
 * Get all common providers
 */
export function getAllCommonProviders(): GenericProvider[] {
  return [
    createGoogleProvider(),
    createXAIProvider(),
    createGroqProvider(),
    createTogetherProvider(),
    createPerplexityProvider(),
  ];
}

/**
 * Model information for common generic provider models
 */
export const GENERIC_MODELS: ModelProviderInfo[] = [
  // Google models
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Ultra fast and affordable",
    contextWindow: 1_000_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsCaching: false,
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
    description: "Most capable Google model",
    contextWindow: 2_000_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsCaching: false,
  },
  // xAI models
  {
    id: "xai/grok-4.1-fast-non-reasoning",
    name: "Grok 4.1 Fast",
    provider: "xai",
    description: "Fast with 30K context",
    contextWindow: 30_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsCaching: false,
  },
  {
    id: "xai/grok-code-fast-1-thinking",
    name: "Grok Code Fast",
    provider: "xai",
    description: "Reasoning optimized for code",
    contextWindow: 30_000,
    supportsStreaming: true,
    supportsTools: true,
    supportsCaching: false,
  },
];
