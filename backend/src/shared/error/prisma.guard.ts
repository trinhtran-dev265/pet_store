import { Prisma } from '@prisma/client';

export function isPrismaKnownError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaValidationError(
  err: unknown,
): err is Prisma.PrismaClientValidationError {
  return err instanceof Prisma.PrismaClientValidationError;
}

export function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
}
