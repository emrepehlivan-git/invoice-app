export {
  ErrorCode,
  type ErrorCodeType,
  type ErrorMetadata,
  type ActionError,
  type ActionSuccess,
  type ActionResult,
  type SimpleResult,
  isActionError,
  isActionSuccess,
} from "./types";

export {
  AppError,
  AuthError,
  NotFoundError,
  ValidationError,
  BusinessError,
  DatabaseError,
  ExternalServiceError,
} from "./classes";

export {
  parseError,
  parsePrismaError,
  parseZodError,
  getZodFieldErrors,
  isPrismaError,
  isUniqueConstraintError,
  getUniqueConstraintField,
} from "./parsers";

export {
  withErrorHandler,
  withSimpleErrorHandler,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  assertCondition,
  assertExists,
  assertAccess,
  isRedirectError,
  rethrowRedirectError,
} from "./handler";

export {
  getErrorMessage,
  getFieldErrorMessage,
  getAllFieldErrors,
  type TranslationFunction,
} from "./messages";
