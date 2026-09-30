import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER, AiProvider } from './ai.provider';
import { SYSTEM_PROMPT, UNAVAILABLE_MESSAGE } from './ai.prompt';

const LABELS: Record<string, string> = {
  LOW_YIELD: 'Low yield', PESTS_DISEASE: 'Pests / disease', SOIL_QUALITY: 'Soil quality', WATER_AVAILABILITY: 'Water availability',
  BUYER_ACCESS: 'Access to buyers', FINANCE_ACCESS: 'Access to finance', INPUT_COSTS: 'Input costs',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private readonly prisma: PrismaService, @Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  /** Minimal farm context. No phone number, email or surname is ever sent to the AI provider. */
  async buildContext(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId }, include: { farmer: true, insight: true } });
    if (!farm) throw new NotFoundException('We could not find this farm.');
    const insights = (farm.insight?.insights as any[]) ?? [];
    const recs = (farm.insight?.recommendations as any[]) ?? [];
    return {
      farmerFirstName: farm.farmer.fullName.split(' ')[0],
      county: `${farm.farmer.county} County`,
      farmSizeAcres: farm.sizeAcres, primaryCrop: farm.primaryCrop, coffeeVariety: farm.coffeeVariety, coffeeTrees: farm.coffeeTrees,
      estimatedAnnualProductionKg: farm.estimatedAnnualProductionKg,
      lastHarvestDate: farm.lastHarvestDate?.toISOString().slice(0, 10) ?? 'not recorded',
      lastSoilTestDate: farm.lastSoilTestDate?.toISOString().slice(0, 10) ?? 'not recorded',
      challenges: farm.challenges.map((c) => LABELS[c] ?? c),
      farmOpportunityScore: farm.insight?.opportunityScore ?? null,
      scoreNote: 'Prototype rule-based indicator; higher means more areas where support could help.',
      existingInsights: insights.map((i) => `${i.title}: ${i.description}`),
      recommendations: recs.map((r) => `${r.title} — ${r.reason}`),
      notAvailable: ['weather data', 'satellite data', 'soil lab results', 'market prices'],
    };
  }

  async ask(farmId: string, question: string) {
    const context = await this.buildContext(farmId); // 404s before we ever touch the provider
    if (!this.provider.isConfigured()) throw new ServiceUnavailableException({ message: UNAVAILABLE_MESSAGE, error: 'AI_UNAVAILABLE' });
    try {
      const raw = await this.provider.complete({
        system: SYSTEM_PROMPT,
        prompt: `<farm_context>\n${JSON.stringify(context, null, 2)}\n</farm_context>\n\n<farmer_question>\n${question}\n</farmer_question>`,
      });
      const answer = raw.slice(0, 3000).trim();
      if (answer.length < 10) throw new Error('Empty AI response');
      return {
        answer,
        disclaimer: 'General decision-support guidance based on the information you provided. Please confirm important decisions with a qualified agronomist.',
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(`AI request failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new ServiceUnavailableException({ message: UNAVAILABLE_MESSAGE, error: 'AI_UNAVAILABLE' });
    }
  }
}
