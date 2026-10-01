import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/response';
import { PassportService } from './passport.service';

@ApiTags('Farm Passport')
@Controller()
export class PassportController {
  constructor(private readonly passports: PassportService) {}

  @Get('passport/:publicId') @ResponseMessage('Farm Passport loaded')
  @ApiOperation({ summary: 'Public, privacy-safe farm profile. No login. Never includes contact details, exact location, challenges, insights or requests.' })
  @ApiResponse({ status: 404, description: 'Unknown passport id' })
  get(@Param('publicId') publicId: string) { return this.passports.getPublic(publicId); }

  @Post('farms/:id/passport/reset') @HttpCode(200) @ResponseMessage('New Farm Passport link created')
  @ApiOperation({ summary: 'Create a new public id for this farm; the old link / QR code stops working (owner only)' })
  reset(@Param('id') id: string, @CurrentUser() user?: AuthUser) { return this.passports.rotate(id, user); }
}
