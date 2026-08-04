import * as z from "zod";

export const registrationSchema = z
  .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({
        message: "Debes aceptar los Términos de Servicio",
      }),
    }),
    promotion: z.boolean().default(true).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegistrationSchemaType = z.infer<typeof registrationSchema>;

// LOGIN

// Define the form schema with Zod
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

// Infer the type from the schema
export type LoginFormValues = z.infer<typeof loginFormSchema>;

// Define the form schema with Zod
export const resetReqestForm = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

// Infer the type from the schema
export type ResetRequestFormValues = z.infer<typeof resetReqestForm>;

// Define the form schema with Zod
export const forgetPassword = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

export type ForgetPasswordType = z.infer<typeof forgetPassword>;
