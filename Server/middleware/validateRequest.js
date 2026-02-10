import { validationResult } from "express-validator";
import { body } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};

export const PreApprovalValidator = [
  body("visitorName")
    .trim()
    .notEmpty().withMessage("Visitor name is required")
    .isLength({ min: 2 }).withMessage("Visitor name too short"),

  body("contactNumber")
    .notEmpty().withMessage("Contact number is required")
    .isMobilePhone("en-IN").withMessage("Invalid Indian phone number"),

  body("purpose")
    .notEmpty().withMessage("Purpose is required"),

  body("scheduledAt")
    .notEmpty().withMessage("Scheduled date is required")
    .isISO8601().withMessage("Invalid date format")
    .toDate()
];

export const QrValidator = [
  body("qrToken")
    .notEmpty().withMessage("QR token is required")
    .isJWT().withMessage("Invalid QR token format")
];
