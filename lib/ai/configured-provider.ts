import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  type LanguageModel,
  wrapLanguageModel,
} from "ai";
import { loadEnvironmentConfig } from "../config/environment";
import { ProviderManager } from "../config/providers";
import type { OpenCodeConfig } from "../config/types";
import { validateConfiguration } from "../config/validator";
import { isTestEnvironment } from "../constants";

/**
 * Configuration-aware AI provider that replaces hardcoded model setup
 */
class ConfiguredAIProvider {
  private config: OpenCodeConfig | null = null;
  private providerManager: ProviderManager | null = null;
  private isInitialized = false;
  private initializationError: Error | null = null;

  /**
   * Initialize the provider with configuration (synchronous, lazy-loaded)
   */
  private initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationError) {
      throw this.initializationError;
    }

    try {
      console.log("Loading OpenCode configuration...");

      // Load configuration synchronously
      this.config = loadEnvironmentConfig();

      // Validate configuration
      const validation = validateConfiguration(this.config);

      if (!validation.valid) {
        const errors = validation.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");
        throw new Error(`Configuration validation failed: ${errors}`);
      }

      // Log warnings but continue
      if (validation.warnings.length > 0) {
        console.warn(
          "Configuration warnings:",
          validation.warnings.map((w) => `${w.field}: ${w.message}`)
        );
      }

      // Initialize provider manager with the full config
      this.providerManager = new ProviderManager(this.config);

      console.log(
        `Configuration loaded successfully. Health: ${validation.summary.configurationHealth}/100`
      );
      this.isInitialized = true;
    } catch (error) {
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));
      console.error(
        "Failed to initialize AI configuration:",
        this.initializationError
      );
      throw this.initializationError;
    }
  }

  /**
   * Get language model with configuration-driven approach (synchronous)
   */
  getLanguageModel(modelId: string): LanguageModel {
    // Handle test environment
    if (isTestEnvironment) {
      return this.getTestModel(modelId);
    }

    // Initialize configuration if needed
    this.initialize();

    // Check if model is configured in providers
    const configuredModel = this.getConfiguredModel(modelId);
    if (configuredModel) {
      return configuredModel;
    }

    // Fallback to gateway for backwards compatibility
    console.warn(
      `Model ${modelId} not found in configuration, using gateway fallback`
    );
    return this.getGatewayModel(modelId);
  }

  /**
   * Get configured model from provider manager
   */
  private getConfiguredModel(modelId: string): LanguageModel | null {
    if (!this.config || !this.providerManager) {
      return null;
    }

    try {
      // Find which provider has this model
      for (const [providerName, providerConfig] of Object.entries(
        this.config.provider || {}
      )) {
        if (providerConfig.models && modelId in providerConfig.models) {
          const provider = this.providerManager.getProvider(providerName);
          if (provider?.isAvailable(providerConfig)) {
            console.log(
              `Using model ${modelId} from configured provider: ${providerName}`
            );
            return this.applyModelWrappers(
              provider.createModel(modelId, providerConfig),
              modelId
            );
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to get configured model ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Get gateway model (fallback)
   */
  private getGatewayModel(modelId: string): LanguageModel {
    return this.applyModelWrappers(gateway.languageModel(modelId), modelId);
  }

  /**
   * Apply model wrappers (reasoning, etc.)
   */
  private applyModelWrappers(
    model: LanguageModel,
    modelId: string
  ): LanguageModel {
    const isReasoningModel = this.isReasoningModel(modelId);

    if (isReasoningModel) {
      // For reasoning models, apply reasoning wrapper
      // wrapLanguageModel expects LanguageModelV3, so if model is a string,
      // we need to use gateway to resolve it first
      let resolvedModel: LanguageModel = model;

      if (typeof model === "string") {
        resolvedModel = gateway.languageModel(model);
      }

      // Now resolvedModel should be LanguageModelV3/V2, try to wrap it
      try {
        return wrapLanguageModel({
          model: resolvedModel as any, // Type assertion to handle V2/V3 compatibility
          middleware: extractReasoningMiddleware({ tagName: "thinking" }),
        });
      } catch (error) {
        console.warn(
          "Failed to wrap reasoning model, using unwrapped model:",
          error
        );
        return resolvedModel;
      }
    }

    return model;
  }

  /**
   * Check if model is a reasoning model
   */
  private isReasoningModel(modelId: string): boolean {
    return (
      modelId.endsWith("-thinking") ||
      (modelId.includes("reasoning") && !modelId.includes("non-reasoning"))
    );
  }

  /**
   * Get test model for testing environment
   */
  private getTestModel(modelId: string): LanguageModel {
    const myProvider = (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })();

    return myProvider.languageModel(modelId);
  }

  /**
   * Get configured title model or fallback (synchronous)
   */
  getTitleModel(): LanguageModel {
    if (isTestEnvironment) {
      return this.getTestModel("title-model");
    }

    this.initialize();

    if (!this.config) {
      // Fallback to hardcoded model if no config
      console.warn("No configuration loaded, using fallback title model");
      return gateway.languageModel("google/gemini-2.5-flash-lite");
    }

    // Check if small_model is configured
    if (this.config.small_model) {
      return this.getLanguageModel(this.config.small_model);
    }

    // Check if default model is configured
    if (this.config.model) {
      console.log("Using default model for title generation");
      return this.getLanguageModel(this.config.model);
    }

    // Fallback to hardcoded model
    console.warn("No title model configured, using fallback");
    return gateway.languageModel("google/gemini-2.5-flash-lite");
  }

  /**
   * Get configured artifact model or fallback (synchronous)
   */
  getArtifactModel(): LanguageModel {
    if (isTestEnvironment) {
      return this.getTestModel("artifact-model");
    }

    this.initialize();

    if (!this.config) {
      // Fallback to hardcoded model if no config
      console.warn("No configuration loaded, using fallback artifact model");
      return gateway.languageModel("anthropic/claude-haiku-4.5");
    }

    // For artifacts, prefer small_model or default model
    if (this.config.small_model) {
      return this.getLanguageModel(this.config.small_model);
    }

    if (this.config.model) {
      return this.getLanguageModel(this.config.model);
    }

    // Fallback to hardcoded model
    console.warn("No artifact model configured, using fallback");
    return gateway.languageModel("anthropic/claude-haiku-4.5");
  }

  /**
   * Get list of available models from configuration (synchronous)
   */
  getAvailableModels(): string[] {
    if (isTestEnvironment) {
      return [
        "chat-model",
        "chat-model-reasoning",
        "title-model",
        "artifact-model",
      ];
    }

    this.initialize();

    if (!this.config) {
      return [];
    }

    const models: string[] = [];

    // Collect models from all configured providers
    for (const [, providerConfig] of Object.entries(
      this.config.provider || {}
    )) {
      if (providerConfig.models) {
        models.push(...Object.keys(providerConfig.models));
      }
    }

    // Add default models if configured
    if (this.config.model) {
      models.push(this.config.model);
    }
    if (this.config.small_model) {
      models.push(this.config.small_model);
    }

    return Array.from(new Set(models)); // Remove duplicates
  }

  /**
   * Get configuration (for debugging)
   */
  getConfiguration(): OpenCodeConfig {
    this.initialize();
    return this.config ? { ...this.config } : {};
  }

  /**
   * Reload configuration (for development)
   */
  reloadConfiguration(): void {
    this.isInitialized = false;
    this.initializationError = null;
    this.config = null;
    this.providerManager = null;
    this.initialize();
  }
}

// Create singleton instance
const configuredProvider = new ConfiguredAIProvider();

// Export functions that replace the old hardcoded ones (synchronous interface)
export function getLanguageModel(modelId: string): LanguageModel {
  return configuredProvider.getLanguageModel(modelId);
}

export function getTitleModel(): LanguageModel {
  return configuredProvider.getTitleModel();
}

export function getArtifactModel(): LanguageModel {
  return configuredProvider.getArtifactModel();
}

export function getAvailableModels(): string[] {
  return configuredProvider.getAvailableModels();
}

export function getAIConfiguration(): OpenCodeConfig {
  return configuredProvider.getConfiguration();
}

export function reloadAIConfiguration(): void {
  configuredProvider.reloadConfiguration();
}

// Backwards compatibility - keep old sync functions with deprecation warnings
export function getLanguageModelSync(modelId: string): LanguageModel {
  console.warn(
    "getLanguageModelSync is deprecated. Use async getLanguageModel instead."
  );

  // For immediate backwards compatibility, return gateway model
  const isReasoningModel =
    modelId.endsWith("-thinking") ||
    (modelId.includes("reasoning") && !modelId.includes("non-reasoning"));

  if (isReasoningModel) {
    const gatewayModelId = modelId.replace(/-thinking$/, "");
    return wrapLanguageModel({
      model: gateway.languageModel(gatewayModelId) as any,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return gateway.languageModel(modelId);
}
