import { Client } from "@notionhq/client";
import type { Analysis } from "@shared/schema";

export class NotionIntegration {
  private notion: Client;
  private databaseId: string;

  constructor(token: string, databaseId: string) {
    this.notion = new Client({ auth: token });
    this.databaseId = databaseId;
  }

  async exportAnalysis(analysis: Analysis): Promise<string> {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          "Titre": {
            title: [
              {
                text: {
                  content: analysis.title || "Analyse sans titre",
                },
              },
            ],
          },
          "Niveau d'intérêt": {
            select: {
              name: analysis.interestLevel === 'hot' ? 'Chaud' : 
                   analysis.interestLevel === 'warm' ? 'Tiède' : 'Froid',
            },
          },
          "Score de confiance": {
            number: analysis.confidenceScore || 0,
          },
          "Date d'analyse": {
            date: {
              start: analysis.createdAt.split('T')[0],
            },
          },
          "Statut": {
            select: {
              name: "À suivre",
            },
          },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "📊 Résumé de l'analyse",
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: analysis.interestJustification,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "🎯 Conseils stratégiques",
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: analysis.strategicAdvice,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "📧 Message de relance",
                  },
                },
              ],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `Objet: ${analysis.followUpSubject}\n\n${analysis.followUpMessage}`,
                  },
                },
              ],
            },
          },
        ],
      });

      return response.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers Notion:", error);
      throw new Error("Échec de l'export vers Notion");
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.notion.databases.retrieve({ database_id: this.databaseId });
      return true;
    } catch (error) {
      return false;
    }
  }
}