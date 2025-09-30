import ErrorResponse from "../utils/errorResponse.js";

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = "Duplicate field value entered";

    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === "email") {
      message = "Email address is already registered";
    } else if (field === "username") {
      message = "Username is already taken";
    }

    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new ErrorResponse(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new ErrorResponse(message, 401);
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large";
    error = new ErrorResponse(message, 400);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field";
    error = new ErrorResponse(message, 400);
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    error = new ErrorResponse(message, 429);
  }

  // Stripe errors
  if (err.type && err.type.startsWith("Stripe")) {
    let message = "Payment processing error";

    switch (err.type) {
      case "StripeCardError":
        message = err.message || "Your card was declined";
        break;
      case "StripeInvalidRequestError":
        message = "Invalid payment request";
        break;
      case "StripeAPIError":
        message = "Payment service temporarily unavailable";
        break;
      case "StripeConnectionError":
        message = "Network error during payment processing";
        break;
      case "StripeAuthenticationError":
        message = "Payment authentication failed";
        break;
    }

    error = new ErrorResponse(message, 400);
  }

  // Social media API errors
  if (err.response && err.response.status) {
    let message = "Social media API error";

    switch (err.response.status) {
      case 401:
        message = "Social media account authorization expired. Please reconnect your account";
        break;
      case 403:
        message = "Insufficient permissions for this social media account";
        break;
      case 429:
        message = "Social media API rate limit exceeded. Please try again later";
        break;
      case 500:
        message = "Social media service temporarily unavailable";
        break;
    }

    error = new ErrorResponse(message, err.response.status);
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Handle 404 errors
export const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not found - ${req.originalUrl}`, 404);
  next(error);
};