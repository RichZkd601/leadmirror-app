import { NotionIntegration } from './notion';
import { PipedriveIntegration } from './pipedrive';
import { ClickUpIntegration } from './clickup';
import { TrelloIntegration } from './trello';
import type { Analysis } from "@shared/schema";

export interface CRMIntegration {
  exportAnalysis(analysis: Analysis, options?: any): Promise<string>;
  testConnection(): Promise<boolean>;
}

export class CRMIntegrationManager {
  private integrations: Map<string, CRMIntegration> = new Map();

  addNotionIntegration(token: string, databaseId: string) {
    this.integrations.set('notion', new NotionIntegration(token, databaseId));
  }

  addPipedriveIntegration(apiToken: string, companyDomain: string) {
    this.integrations.set('pipedrive', new PipedriveIntegration(apiToken, companyDomain));
  }

  addClickUpIntegration(apiToken: string) {
    this.integrations.set('clickup', new ClickUpIntegration(apiToken));
  }

  addTrelloIntegration(apiKey: string, token: string) {
    this.integrations.set('trello', new TrelloIntegration(apiKey, token));
  }

  async exportToAll(analysis: Analysis, options: {
    notion?: { databaseId: string };
    pipedrive?: { personId?: number };
    clickup?: { listId: string };
    trello?: { listId: string };
  } = {}): Promise<{ [key: string]: string | Error }> {
    const results: { [key: string]: string | Error } = {};

    for (const [platform, integration] of this.integrations) {
      try {
        const platformOptions = options[platform as keyof typeof options];
        const result = await integration.exportAnalysis(analysis, platformOptions);
        results[platform] = result;
      } catch (error) {
        results[platform] = error as Error;
      }
    }

    return results;
  }

  async exportTo(platform: string, analysis: Analysis, options?: any): Promise<string> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      throw new Error(`Integration ${platform} not configured`);
    }

    return await integration.exportAnalysis(analysis, options);
  }

  async testConnection(platform: string): Promise<boolean> {
    const integration = this.integrations.get(platform);
    if (!integration) {
      return false;
    }

    return await integration.testConnection();
  }

  getConfiguredPlatforms(): string[] {
    return Array.from(this.integrations.keys());
  }
}

export { NotionIntegration, PipedriveIntegration, ClickUpIntegration, TrelloIntegration };