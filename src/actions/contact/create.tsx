"use server";

import ContactFormSubmissionTemplate from "@/email-templates/contact-form-submission";
import { prisma } from "@/lib/db";
import { supersendtx } from "@/lib/supersendtx";
import { contactFormSchema, ContactFormValues } from "@/schemas/contact";

export async function createContact(data: ContactFormValues) {
  // Fetch settings from the database
  const settings = await prisma.setting.findFirst();

  // Return early if settings or supportEmail are missing
  if (!settings || !settings.supportEmail) {
    return {
      success: false,
      message:
        "Unable to process your request at the moment. Please try again later.",
    };
  }

  // Validate the input data
  const parsedData = contactFormSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      message: "Invalid form data. " + parsedData.error.message,
    };
  }

  const { name, email, message } = parsedData.data;
  const submittedAt = new Date();

  try {
    await supersendtx.emails.send({
      from: `${name} <contact@bibliotecalegalhn.com>`,
      to: [settings.supportEmail],
      subject: "New Contact Form Submission",
      replyTo: email,
      react: ContactFormSubmissionTemplate({
        customerEmail: email,
        customerName: name,
        message,
        submittedAt,
      }),
    });

    return {
      success: true,
      message:
        "Thank you for contacting us, " +
        name +
        ". Your message has been successfully sent.",
    };
  } catch (error) {
    console.error("Email sending error:", error);

    return {
      success: false,
      message:
        "There was an error sending your message. Please try again later or contact us directly at " +
        settings.supportEmail,
    };
  }
}
