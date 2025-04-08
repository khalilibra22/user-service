import Joi from "joi";

export const academicBackgroundSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  startDate: Joi.date().timestamp().required(),
  endDate: Joi.date().timestamp().required(),
  ordering: Joi.number().integer().required(),
  institution: Joi.string().optional(),
  certificate: Joi.string().uri().optional(),
  userId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});

export const createSubjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  categoryId: Joi.number().integer().required(),
});

export const createTopicSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  subjectId: Joi.number().integer().required(),
});
