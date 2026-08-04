"use server";

import { auth } from "@/auth";
import WelcomeEmail from "@/email-templates/welcome-email";
import { prisma } from "@/lib/db";
import { supersendtx } from "@/lib/supersendtx";
import { generatePassword } from "@/lib/utils";
import {
  companySchema,
  CompanySchemaType,
  employeeAdd,
  EmployeeAddSchemaType,
} from "@/schemas/company";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createCompanies(data: CompanySchemaType) {
  const cu = await auth();

  // Ensure user is admin
  if (!cu || cu.user.role !== "admin") {
    return {
      success: false,
      message: "Unauthorized access.",
    };
  }

  // Validate input
  const parsedData = companySchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      message: parsedData.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { name, location, contact_email, overview } = parsedData.data;

  try {
    // 1. Create the company
    const company = await prisma.company.create({
      data: {
        name,
        location,
        contact_email,
        overview,
      },
    });

    return {
      success: true,
      message: "Company Created",
      description: `The ${company.name} has been successfully created with the provided details.`,
      company,
    };
  } catch (error) {
    console.error("Error creating company or assigning users:", error);
    return {
      success: false,
      message:
        "An error occurred while creating the company or assigning users.",
    };
  }
}

export async function addEmployee(data: EmployeeAddSchemaType) {
  const cu = await auth();

  // Ensure user is admin
  if (!cu || cu.user.role !== "admin") {
    return {
      success: false,
      message: "Unauthorized access.",
    };
  }

  // Validate input
  const parsedData = employeeAdd.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      message: parsedData.error.message,
    };
  }

  const { email, companyId, first_name, last_name } = parsedData.data;

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
    },
  });

  if (!company) {
    return {
      success: false,
      message: "Company not found.",
    };
  }
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const password = generatePassword();
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          first_name,
          last_name,
          companyId,
          emailVerified: new Date(),
        },
      });

      if (!newUser) {
        throw new Error("Failed to create a new user.");
      }
      // send email
      await supersendtx.emails.send({
        from: "Biblioteca Legal <support@bibliotecalegalhn.com>",
        to: [newUser.email as string],
        subject: "Welcome to Biblioteca Legal - Your Account is Ready",
        react: WelcomeEmail({
          companyName: company.name,
          email: email,
          employeeName: `${first_name} ${last_name}`,
          password: password,
          websiteUrl: process.env.AUTH_URL,
        }),
      });

      revalidatePath(`/dashboard/companies/${companyId}`);

      return {
        success: true,
        message: `New user ${email} created and added to ${company.name}. A welcome email has been sent.`,
      };
    }

    if (user.companyId && user.companyId !== companyId) {
      return {
        success: false,
        message: `User ${email} is already part of another company.`,
      };
    }

    // Update the user's companyId
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId },
    });

    revalidatePath(`/dashboard/companies/${companyId}`);

    return {
      success: true,
      message: `User ${email} successfully added to the company.`,
    };
  } catch (error) {
    console.error("Error adding employee to company:", error);
    return {
      success: false,
      message: "An error occurred while adding the employee to the company.",
    };
  }
}
