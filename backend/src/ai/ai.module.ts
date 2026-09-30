import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AI_PROVIDER, AnthropicProvider } from './ai.provider';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    // Provider factory: change this one line to use a different AiProvider implementation.
    { provide: AI_PROVIDER, useFactory: () => new AnthropicProvider(process.env.AI_API_KEY, process.env.AI_MODEL || 'claude-sonnet-4-6') },
  ],
})
export class AiModule {}
