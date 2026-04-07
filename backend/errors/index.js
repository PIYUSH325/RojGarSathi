class CustomAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message, 401);
  }
}
class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message, 404);
  }
}

module.exports = { CustomAPIError, UnauthenticatedError, BadRequestError, NotFoundError };
