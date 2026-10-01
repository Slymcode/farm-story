import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResponseMessage } from '../common/response';
import { AUTH_COOKIE, TOKEN_TTL_SECONDS, cookieOptions } from './auth.config';
import { AuthUser } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUserResponse, LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setCookie(res: Response, token: string) { res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: TOKEN_TTL_SECONDS * 1000 }); }

  @Post('register') @HttpCode(201) @ResponseMessage('Account created successfully!')
  @ApiOperation({ summary: 'Create a farmer account and sign in', description: 'Creates a FARMER user with onboardingCompleted=false and sets the HTTP-only session cookie. The password is stored as a bcrypt hash and never returned.' })
  @ApiResponse({ status: 201, type: AuthUserResponse }) @ApiResponse({ status: 400, description: 'VALIDATION_ERROR' }) @ApiResponse({ status: 409, description: 'An account with this email already exists' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    this.setCookie(res, token);
    return user;
  }

  @Post('login') @HttpCode(200) @ResponseMessage('Logged in successfully')
  @ApiOperation({ summary: 'Log in with email and password', description: 'Sets the HTTP-only session cookie. The same generic error is returned for an unknown email and a wrong password.' })
  @ApiResponse({ status: 200, type: AuthUserResponse }) @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    this.setCookie(res, token);
    return user;
  }

  @Post('logout') @HttpCode(200) @ResponseMessage('Logged out successfully')
  @ApiOperation({ summary: 'Log out (clears the session cookie)', description: 'Safe to call when already logged out.' })
  @ApiResponse({ status: 200, description: '{ success: true, message: "Logged out successfully" }' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, cookieOptions());
  }

  @Get('me') @UseGuards(JwtAuthGuard) @ResponseMessage('Session loaded')
  @ApiCookieAuth(AUTH_COOKIE)
  @ApiOperation({ summary: 'The currently logged-in farmer', description: 'Never includes the password or its hash.' })
  @ApiResponse({ status: 200, type: AuthUserResponse }) @ApiResponse({ status: 401, description: 'Not logged in' })
  me(@CurrentUser() user: AuthUser) { return this.auth.session(user); }
}
