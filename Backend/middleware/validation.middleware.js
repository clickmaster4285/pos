import Joi from "joi";
import { BadRequestError } from "../utils/errors.js";

export const validateRequest = (schema) => {
  return (req, res, next) => {
      console.log("the schema.params is", schema.params);
    const validationSchema = Joi.object({
      body: schema.body ? Joi.object(schema.body).unknown(false) : Joi.any(),
      params: schema.params ? Joi.object(schema.params).unknown(false) : Joi.any(),
      query: schema.query ? Joi.object(schema.query).unknown(false) : Joi.any(),
    });

    const { error } = validationSchema.validate({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (error) {
      throw new BadRequestError(`Validation error: ${error.details.map((d) => d.message).join(", ")}`);
    }

    next();
  };
};

// Joi custom validator for MongoDB ObjectId
Joi.objectId = () =>
  Joi.string().regex(/^[0-9a-fA-F]{24}$/, "MongoDB ObjectId");