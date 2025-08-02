import type { Analysis } from "@shared/schema";

export class TrelloIntegration {
  private apiKey: string;
  private token: string;
  private baseUrl = 'https://api.trello.com/1';

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  async exportAnalysis(analysis: Analysis, listId: string): Promise<string> {
    try {
      const cardData = {
        name: `📞 ${analysis.title}`,
        desc: this.formatAnalysisDescription(analysis),
        idList: listId,
        pos: 'top',
        key: this.apiKey,
        token: this.token,
      };

      const response = await fetch(`${this.baseUrl}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        throw new Error(`Erreur Trello: ${response.statusText}`);
      }

      const card = await response.json();

      // Ajouter des labels basés sur le niveau d'intérêt
      await this.addLabels(card.id, analysis.interestLevel);

      // Ajouter une checklist si il y a des actions à faire
      if (analysis.nextSteps && analysis.nextSteps.length > 0) {
        await this.addChecklist(card.id, analysis.nextSteps);
      }

      return card.id;
    } catch (error) {
      console.error("Erreur lors de l'export vers Trello:", error);
      throw new Error("Échec de l'export vers Trello");
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

## 📧 Message de relance suggéré
**Objet:** ${analysis.followUpSubject}

\`\`\`
${analysis.followUpMessage}
\`\`\`

${analysis.objections && analysis.objections.length > 0 ? `
## ⚠️ Objections identifiées
${analysis.objections.map((obj: any) => `• **${obj.type}** (${obj.intensity}): ${obj.description}`).join('\n')}

**Stratégies de réponse:**
${analysis.objections.map((obj: any) => `• ${obj.responseStrategy || 'Stratégie à définir'}`).join('\n')}
` : ''}

${analysis.buyingSignals && analysis.buyingSignals.length > 0 ? `
## ✅ Signaux d'achat détectés
${analysis.buyingSignals.map((signal: any) => `• **${signal.signal}** (${signal.strength}): ${signal.description}`).join('\n')}
` : ''}

${analysis.advancedInsights ? `
## 🧠 Insights avancés
**Score de qualité:** ${analysis.advancedInsights.conversationQualityScore}/100
**Probabilité de closing:** ${analysis.advancedInsights.predictions?.closingProbability || 'N/A'}%
**Temps estimé pour closer:** ${analysis.advancedInsights.salesTiming?.timeToClose || 'N/A'}
` : ''}

---
*Analysé automatiquement par LeadMirror le ${new Date(analysis.createdAt).toLocaleDateString('fr-FR')}*
    `.trim();
  }

  private async addLabels(cardId: string, interestLevel: string): Promise<void> {
    try {
      const boardResponse = await fetch(`${this.baseUrl}/cards/${cardId}/board?key=${this.apiKey}&token=${this.token}`);
      const board = await boardResponse.json();

      const labelsResponse = await fetch(`${this.baseUrl}/boards/${board.id}/labels?key=${this.apiKey}&token=${this.token}`);
      const labels = await labelsResponse.json();

      // Trouver ou créer le label approprié
      const colorMap = {
        hot: 'red',
        warm: 'orange', 
        cold: 'blue'
      };

      const labelName = interestLevel === 'hot' ? '🔥 Chaud' : 
                       interestLevel === 'warm' ? '🌤 Tiède' : '❄️ Froid';

      let targetLabel = labels.find((label: any) => label.name === labelName);

      if (!targetLabel) {
        // Créer le label s'il n'existe pas
        const createLabelResponse = await fetch(`${this.baseUrl}/boards/${board.id}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: labelName,
            color: colorMap[interestLevel as keyof typeof colorMap],
            key: this.apiKey,
            token: this.token,
          }),
        });
        targetLabel = await createLabelResponse.json();
      }

      // Ajouter le label à la carte
      await fetch(`${this.baseUrl}/cards/${cardId}/idLabels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: targetLabel.id,
          key: this.apiKey,
          token: this.token,
        }),
      });
    } catch (error) {
      console.warn('Impossible d\'ajouter des labels à la carte Trello');
    }
  }

  private async addChecklist(cardId: string, nextSteps: any[]): Promise<void> {
    try {
      // Créer une checklist
      const checklistResponse = await fetch(`${this.baseUrl}/cards/${cardId}/checklists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '📋 Actions à réaliser',
          key: this.apiKey,
          token: this.token,
        }),
      });

      const checklist = await checklistResponse.json();

      // Ajouter les éléments à la checklist
      for (const step of nextSteps) {
        await fetch(`${this.baseUrl}/checklists/${checklist.id}/checkItems`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${step.action} (${step.timeframe || 'À planifier'})`,
            key: this.apiKey,
            token: this.token,
          }),
        });
      }
    } catch (error) {
      console.warn('Impossible d\'ajouter une checklist à la carte Trello');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/members/me?key=${this.apiKey}&token=${this.token}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}