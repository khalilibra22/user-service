import Joi from "joi";

export const academicBackgroundSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  startDate: Joi.date().timestamp().required(),
  endDate: Joi.date().timestamp().required(),
  institution: Joi.string().required(),
  location: Joi.string().optional(),
  documentUrl: Joi.string().uri().optional(),
  type: Joi.string()
    .valid("experience", "education", "certification")
    .required(),
});

export const updateAcademicBackgroundSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  startDate: Joi.date().timestamp().required(),
  endDate: Joi.date().timestamp().required(),
  institution: Joi.string().required(),
  location: Joi.string().optional(),
  documentUrl: Joi.string().uri().optional(),
});

export const taxonomyValidationSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});
