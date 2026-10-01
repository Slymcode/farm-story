import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor, SetMetadata,
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, BadRequestException, ValidationError,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

export const RESPONSE_MESSAGE = 'response_message';
/** Sets the `message` field of the success envelope. */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);

/** Wraps every successful response as { success, message, data }. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const message = this.reflector.get<string>(RESPONSE_MESSAGE, ctx.getHandler()) ?? 'OK';
    return next.handle().pipe(map((data) => ({ success: true, message, data })));
  }
}

/** Turns class-validator errors into short, friendly, per-field messages. */
export function validationExceptionFactory(errors: ValidationError[]) {
  const details = errors.map((e) => ({
    field: e.property,
    message: Object.values(e.constraints ?? {})[0] ?? 'Please check this field.',
  }));
  return new BadRequestException({
    message: details[0]?.message ?? 'Please check the information you entered.',
    error: 'VALIDATION_ERROR',
    details,
  });
}

/** Consistent error envelope: { success:false, message, error, details? } */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as any;
      const message = typeof body === 'string' ? body : Array.isArray(body.message) ? body.message[0] : body.message;
      const error = body?.error && body.error === body.error.toUpperCase() ? body.error : defaultCode(status);
      return res.status(status).json({ success: false, message, error, ...(body?.details ? { details: body.details } : {}) });
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false, message: 'Something went wrong on our side. Please try again.', error: 'INTERNAL_ERROR',
    });
  }
}

function defaultCode(status: number) {
  return ({ 400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 503: 'SERVICE_UNAVAILABLE' } as Record<number, string>)[status] ?? 'ERROR';
}
