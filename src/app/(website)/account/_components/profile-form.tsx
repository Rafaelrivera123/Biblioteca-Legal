"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CalendarIcon, Loader2, Pencil, Save } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { updateProfile } from "@/actions/profile/update";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";
import {
  profileSchema,
  ProfileSchemaType,
} from "@/schemas/profile/profileSchema";
import { User } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

// Type Definitions
type ProfileFormProps = {
  user: User;
};

const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const [editable, setEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageLoader, setImageLoader] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      image: user?.image || "/default-profile.jpg", // Default profile image
      email: user?.email || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      gender: user?.gender || "",
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageLoader(true);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
      });
      form.setValue("image", blob.url);
      setImageLoader(false);
    }
  };

  const onSubmit = (data: ProfileSchemaType) => {
    startTransition(() => {
      updateProfile(data).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        // handle successful profile update
        toast.success(res.message);
        setEditable(false);
      });
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-tourHub-title2 text-[30px] font-bold font-inter">
            Perfil
          </h2>
          <p className="text-tourHub-green-dark text-base mb-1">
            Administra tu perfil
          </p>
        </div>
        {editable && (
          <Button
            onClick={() => setEditable((prev) => !prev)}
            variant="outline"
            className="text-primary hover:text-primary/80"
          >
            Cancelar
          </Button>
        )}
        {!editable && (
          <Button
            className="text-sm rounded-md px-3 py-2"
            onClick={() => {
              if (editable) {
                form.handleSubmit(onSubmit)();
              }
              setEditable((prev) => !prev);
            }}
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : editable ? (
              <Save className="mr-2 h-4 w-4" />
            ) : (
              <Pencil className="mr-2 h-4 w-4" />
            )}
            {pending ? "Guardando" : editable ? "Guardar" : "Editar"}
          </Button>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-6"
        >
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem className="col-span-2 flex items-center gap-x-4">
                <div className="h-[100px] w-[100px] flex justify-center items-center relative">
                  <motion.div
                    initial={{ filter: "blur(0px)" }}
                    animate={{
                      filter: imageLoader ? "blur(1px)" : "blur(0px)",
                      transition: { duration: 0.5 },
                    }}
                    className="h-full w-full rounded-full relative flex justify-center items-center"
                  >
                    <Image
                      src={field.value || "/default-profile.jpg"}
                      alt="perfil"
                      fill
                      className="rounded-full object-cover text-tourHub-green-dark bg-gray-100"
                    />
                  </motion.div>
                  {imageLoader && (
                    <Loader2 className="animate-spin h-5 w-5 absolute" />
                  )}
                </div>
                {editable && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="text-primary hover:text-primary/80"
                      onClick={handleUploadClick}
                      disabled={imageLoader}
                    >
                      Subir
                    </Button>
                  </>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Nombre</FormLabel>}
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    {...field}
                    className="disabled:opacity-100"
                    disabled={!editable}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Apellido</FormLabel>}
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Tu apellido"
                    {...field}
                    className="disabled:opacity-100"
                    disabled={!editable}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Correo electrónico</FormLabel>}
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Correo electrónico principal"
                    {...field}
                    disabled
                    className="disabled:opacity-70"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Teléfono</FormLabel>}
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Tu número de teléfono"
                    {...field}
                    className="disabled:opacity-100"
                    disabled={!editable}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Fecha de nacimiento</FormLabel>}
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal text-primary hover:text-primary/80",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!editable}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Selecciona tu fecha de nacimiento</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Input
                        type="date"
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const dateValue = e.target.value
                            ? new Date(e.target.value)
                            : undefined;
                          field.onChange(dateValue);
                        }}
                        disabled={!editable}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                {editable && <FormLabel>Género</FormLabel>}
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={cn(
                        "w-full pl-3 text-left flex justify-between font-normal text-primary hover:text-primary/80 border-input border-[1px] outline-none"
                      )}
                      disabled={!editable}
                    >
                      {field.value || "Selecciona el género"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Masculino</SelectItem>
                      <SelectItem value="Female">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {editable && (
            <div className="col-span-2 mt-4 flex justify-end">
              <Button type="submit" disabled={!editable || pending}>
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {pending ? "Guardando" : "Guardar cambios"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
