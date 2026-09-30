import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/response';
import { FarmQuestionDto } from './ai.dto';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('farm-question') @HttpCode(200) @ResponseMessage('Answer generated')
  @ApiOperation({ summary: 'Ask Farm Story a question about a farm. Server-side only; the API key never reaches the browser.' })
  @ApiResponse({ status: 200, description: '{ answer, disclaimer, generatedAt }' })
  @ApiResponse({ status: 503, description: 'AI_UNAVAILABLE — provider not configured or failing; rest of the app is unaffected' })
  ask(@Body() dto: FarmQuestionDto) { return this.ai.ask(dto.farmId, dto.question); }
}
