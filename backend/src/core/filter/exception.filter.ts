import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, error, message } = this.extractExceptionInfo(exception);

    this.logger.error({
      path: req.url,
      method: req.method,
      status,
      error,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const responseBody: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    res.status(status).json(responseBody);
  }

  private extractExceptionInfo(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { status, error: response, message: response };
      }

      if (this.isRecord<string, unknown>(response)) {
        const msg = this.normalizeMessage(response.message);
        const err = this.normalizeError(response.error, msg);
        return { status, error: err, message: msg };
      }

      return { status, error: exception.name, message: exception.message };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: exception.name,
        message: exception.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'UnknownError',
      message: 'An unexpected error occurred',
    };
  }

  private normalizeMessage(message: unknown): string | string[] {
    if (Array.isArray(message)) {
      return message.map((m) => String(m));
    }
    if (typeof message === 'string') return message;
    return JSON.stringify(message);
  }

  private normalizeError(error: unknown, fallback: string | string[]): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof fallback === 'string') return fallback;
    return fallback.join(', ');
  }

  private isRecord<K extends keyof never, V>(
    value: unknown,
  ): value is Record<K, V> {
    return typeof value === 'object' && value !== null;
  }
}
