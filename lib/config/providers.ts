import type { LanguageModel } from "ai";
import type { OpenCodeConfig, ProviderConfig } from "./types";

/**
 * Provider Configuration Interface
 * Abstracts different AI provider implementations
 */

export interface ModelProviderInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextWindow?: number;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  supportsCaching?: boolean;
}

export interface ProviderFactory {
  /**
   * Provider identifier (e.g., "openai", "anthropic", "google")
   */
  readonly providerId: string;

  /**
   * Display name for the provider
   */
  readonly displayName: string;

  /**
   * Check if provider is available (API keys, etc.)
   */
  isAvailable(config: ProviderConfig): boolean;

  /**
   * Create a language model instance
   */
  createModel(modelId: string, config: ProviderConfig): LanguageModel;

  /**
   * Get available models for this provider
   */
  getAvailableModels(config: ProviderConfig): ModelProviderInfo[];

  /**
   * Validate provider configuration
   */
  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] };

  /**
   * Get default configuration for this provider
   */
  getDefaultConfig(): ProviderConfig;
}

/**
 * Provider Manager - manages all available providers
 */
export class ProviderManager {
  private readonly providers = new Map<string, ProviderFactory>();
  private config: OpenCodeConfig;

  constructor(config: OpenCodeConfig) {
    this.config = config;
  }

  /**
   * Register a provider factory
   */
  registerProvider(provider: ProviderFactory): void {
    this.providers.set(provider.providerId, provider);
  }

  /**
   * Get a specific provider
   */
  getProvider(providerId: string): ProviderFactory | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderFactory[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get available providers (those with valid configuration)
   */
  getAvailableProviders(): ProviderFactory[] {
    return Array.from(this.providers.values()).filter((provider) => {
      const providerConfig = this.config.provider?.[provider.providerId] || {};
      return provider.isAvailable(providerConfig);
    });
  }

  /**
   * Create a language model from configuration
   */
  createLanguageModel(modelId: string): LanguageModel {
    // Parse provider from model ID (e.g., "openai/gpt-4" -> "openai")
    const [providerId, model] = this.parseModelId(modelId);

    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(
        `Provider '${providerId}' not found for model '${modelId}'`
      );
    }

    const providerConfig =
      this.config.provider?.[providerId] || provider.getDefaultConfig();

    if (!provider.isAvailable(providerConfig)) {
      throw new Error(
        `Provider '${providerId}' is not available. Check your configuration.`
      );
    }

    return provider.createModel(model, providerConfig);
  }

  /**
   * Get all available models across all providers
   */
  getAllAvailableModels(): ModelProviderInfo[] {
    const models: ModelProviderInfo[] = [];

    for (const provider of this.getAvailableProviders()) {
      try {
        const providerConfig =
          this.config.provider?.[provider.providerId] || {};
        const providerModels = provider.getAvailableModels(providerConfig);
        models.push(...providerModels);
      } catch (error) {
        console.warn(
          `Failed to get models for provider ${provider.providerId}:`,
          error
        );
      }
    }

    return models;
  }

  /**
   * Validate all provider configurations
   */
  validateAllConfigurations(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.provider) {
      for (const [providerId, providerConfig] of Object.entries(
        this.config.provider
      )) {
        const provider = this.getProvider(providerId);
        if (!provider) {
          errors.push(`Unknown provider: ${providerId}`);
          continue;
        }

        const validation = provider.validateConfig(providerConfig);
        if (!validation.valid) {
          errors.push(
            ...validation.errors.map((err) => `${providerId}: ${err}`)
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse model ID into provider and model parts
   */
  private parseModelId(modelId: string): [string, string] {
    const parts = modelId.split("/");
    if (parts.length !== 2) {
      throw new Error(
        `Invalid model ID format: '${modelId}'. Expected format: 'provider/model'`
      );
    }
    return [parts[0], parts[1]];
  }

  /**
   * Update configuration
   */
  updateConfig(config: OpenCodeConfig): void {
    this.config = config;
  }
}

/**
 * Create provider manager with all built-in providers
 */
export function createProviderManager(config: OpenCodeConfig): ProviderManager {
  const manager = new ProviderManager(config);

  // Import providers dynamically to avoid circular dependencies
  import("../providers")
    .then(({ OpenAIProvider, AnthropicProvider, getAllCommonProviders }) => {
      // Register built-in providers
      manager.registerProvider(new OpenAIProvider());
      manager.registerProvider(new AnthropicProvider());

      // Register common generic providers
      const commonProviders = getAllCommonProviders();
      for (const provider of commonProviders) {
        manager.registerProvider(provider);
      }
    })
    .catch(console.error);

  return manager;
}

/**
 * Utility function to get model provider from model ID
 */
export function getProviderFromModelId(modelId: string): string {
  const parts = modelId.split("/");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid model ID format: '${modelId}'. Expected format: 'provider/model'`
    );
  }
  return parts[0];
}

/**
 * Utility function to get model name from model ID
 */
export function getModelNameFromId(modelId: string): string {
  const parts = modelId.split("/");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid model ID format: '${modelId}'. Expected format: 'provider/model'`
    );
  }
  return parts[1];
}
