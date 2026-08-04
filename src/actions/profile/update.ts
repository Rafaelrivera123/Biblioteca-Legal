"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  profileSchema,
  ProfileSchemaType,
} from "@/schemas/profile/profileSchema";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: ProfileSchemaType) {
  const cu = await auth();

  if (!cu?.user.id) {
    return {
      success: false,
      message: "Usuario no autenticado",
    };
  }

  const parsedData = profileSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      message: parsedData.error.message,
    };
  }

  try {
    const placeholderImages = new Set(["", "/default-profile.jpg", "/placeholder.svg"]);
    const image = parsedData.data.image?.trim();
    const updatedUser = await prisma.user.update({
      where: {
        id: cu.user.id,
      },
      data: {
        ...parsedData.data,
        image: image && !placeholderImages.has(image) ? image : null,
      },
    });

    revalidatePath("/account");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Perfil actualizado con éxito",
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return {
      success: false,
      message: "Error al actualizar el perfil",
    };
  }
}
