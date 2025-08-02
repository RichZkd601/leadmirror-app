import type { Analysis } from "@shared/schema";

export class PipedriveIntegration {
  private apiToken: string;
  private baseUrl: string;

  constructor(apiToken: string, companyDomain: string) {
    this.apiToken = apiToken;
    this.baseUrl = `https://${companyDomain}.pipedrive.com/api/v1`;
  }

  async exportAnalysis(analysis: Analysis, personId?: number): Promise<string> {
    try {
      // Créer une note d'activité dans Pipedrive
      const noteResponse = await fetch(`${this.baseUrl}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: this.apiToken,
          content: this.formatAnalysisNote(analysis),
          person_id: personId,
          pinned_to_person_flag: true,
        }),
      });

      if (!noteResponse.ok) {
        throw new Error(`Erreur Pipedrive: ${noteResponse.statusText}`);
      }

      const noteData = await noteResponse.json();

      // Créer une activité de suivi si recommandée
      if (analysis.nextSteps && analysis.nextSteps.length > 0) {
        const activityResponse = await fetch(`${this.baseUrl}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_token: this.apiToken,
            subject: `Suivi: ${analysis.title}`,
            note: analysis.nextSteps.map((step: any) => 
              `${step.action} (${step.timeframe})`
            ).join('\n'),
            person_id: personId,
            type: 'call',
            due_date: this.getNextBusinessDay(),
          }),
        });

        if (!activityResponse.ok) {
          console.warn('Impossible de créer l\'activité de suivi dans Pipedrive');
        }
      }

      return noteData.data.id.toString();
    } catch (error) {
      console.error("Erreur lors de l'export vers Pipedrive:", error);
      throw new Error("Échec de l'export vers Pipedrive");
    }
  }

  private formatAnalysisNote(analysis: Analysis): string {
    return `
🔍 ANALYSE LeadMirror - ${analysis.title}

📊 NIVEAU D'INTÉRÊT: ${analysis.interestLevel.toUpperCase()}
${analysis.interestJustification}

🎯 CONSEILS STRATÉGIQUES:
${analysis.strategicAdvice}

📧 MESSAGE DE RELANCE SUGGÉRÉ:
Objet: ${analysis.followUpSubject}

${analysis.followUpMessage}

${analysis.objections && analysis.objections.length > 0 ? `
⚠️ OBJECTIONS IDENTIFIÉES:
${analysis.objections.map((obj: any) => `• ${obj.description} (${obj.intensity})`).join('\n')}
` : ''}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
✅ SIGNAUX D'ACHAT:
${analysis.buyingSignals.map((signal: any) => `• ${signal.description} (${signal.strength})`).join('\n')}
` : ''}

---
Analysé automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
    `.trim();
  }

  private getNextBusinessDay(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    
    // Si c'est un weekend, passer au lundi
    if (date.getDay() === 0) date.setDate(date.getDate() + 1); // Dimanche -> Lundi
    if (date.getDay() === 6) date.setDate(date.getDate() + 2); // Samedi -> Lundi
    
    return date.toISOString().split('T')[0];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}