import type { Analysis } from "@shared/schema";

export class ClickUpIntegration {
  private apiToken: string;
  private baseUrl = 'https://api.clickup.com/api/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async exportAnalysis(analysis: Analysis, listId: string): Promise<string> {
    try {
      const taskData = {
        name: `📞 ${analysis.title}`,
        description: this.formatAnalysisDescription(analysis),
        status: 'to do',
        priority: this.getPriority(analysis.interestLevel),
        due_date: this.getDueDate(analysis),
        tags: this.getTags(analysis),
        custom_fields: await this.getCustomFields(analysis, listId),
      };

      const response = await fetch(`${this.baseUrl}/list/${listId}/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error(`Erreur ClickUp: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers ClickUp:", error);
      throw new Error("Échec de l'export vers ClickUp");
    }
  }

  private formatAnalysisDescription(analysis: Analysis): string {
    return `
## 📊 Analyse LeadMirror

**Niveau d'intérêt:** ${analysis.interestLevel === 'hot' ? '🔥 Chaud' : 
                         analysis.interestLevel === 'warm' ? '🌤 Tiède' : '❄️ Froid'}

**Justification:** ${analysis.interestJustification}

## 🎯 Conseils stratégiques
${analysis.strategicAdvice}

## 📧 Message de relance
**Objet:** ${analysis.followUpSubject}

\`\`\`
${analysis.followUpMessage}
\`\`\`

${analysis.objections && analysis.objections.length > 0 ? `
## ⚠️ Objections identifiées
${analysis.objections.map((obj: any) => `- **${obj.type}** (${obj.intensity}): ${obj.description}`).join('\n')}
` : ''}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
## ✅ Signaux d'achat
${analysis.buyingSignals.map((signal: any) => `- **${signal.signal}** (${signal.strength}): ${signal.description}`).join('\n')}
` : ''}

---
*Analysé automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString('fr-FR')}*
    `.trim();
  }

  private getPriority(interestLevel: string): number {
    switch (interestLevel) {
      case 'hot': return 1; // Urgent
      case 'warm': return 2; // High
      case 'cold': return 3; // Normal
      default: return 4; // Low
    }
  }

  private getDueDate(analysis: Analysis): number | undefined {
    if (analysis.nextSteps && analysis.nextSteps.length > 0) {
      const firstStep = analysis.nextSteps[0] as any;
      if (firstStep.timeframe === "Aujourd'hui") {
        return Date.now();
      } else if (firstStep.timeframe === "Cette semaine") {
        return Date.now() + (7 * 24 * 60 * 60 * 1000);
      }
    }
    return undefined;
  }

  private getTags(analysis: Analysis): string[] {
    const tags = ['leadmirror', analysis.interestLevel];
    
    if (analysis.objections && analysis.objections.length > 0) {
      tags.push('objections');
    }
    
    if (analysis.buyingSignals && analysis.buyingSignals.length > 0) {
      tags.push('buying-signals');
    }

    return tags;
  }

  private async getCustomFields(analysis: Analysis, listId: string): Promise<any[]> {
    try {
      // Récupérer les champs personnalisés de la liste
      const response = await fetch(`${this.baseUrl}/list/${listId}/field`, {
        headers: {
          'Authorization': this.apiToken,
        },
      });

      if (!response.ok) return [];

      const fieldsData = await response.json();
      const customFields: any[] = [];

      // Mapper les données d'analyse aux champs personnalisés
      for (const field of fieldsData.fields) {
        if (field.name === 'Score de confiance' && analysis.confidenceScore) {
          customFields.push({
            id: field.id,
            value: analysis.confidenceScore,
          });
        } else if (field.name === 'Niveau d\'intérêt') {
          customFields.push({
            id: field.id,
            value: analysis.interestLevel,
          });
        }
      }

      return customFields;
    } catch (error) {
      console.warn('Impossible de mapper les champs personnalisés ClickUp');
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': this.apiToken,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}