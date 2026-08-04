"use client";
import { verifyOTP } from "@/actions/auth/reset-request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "El OTP debe tener 6 dígitos")
    .regex(/^[0-9]+$/, "El OTP debe contener solo números"),
});

type OTPSchemaType = z.infer<typeof otpSchema>;

interface Props {
  otpId: string;
}

const OTPForm = ({ otpId }: Props) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<OTPSchemaType>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = form.watch("otp");

  const setOtpDigit = (index: number, digit: string) => {
    const digits = otpValue.padEnd(6, " ").split("");
    digits[index] = digit;
    form.setValue("otp", digits.join("").replace(/ /g, ""));
  };

  const handleSubmit = (values: OTPSchemaType) => {
    startTransition(() => {
      verifyOTP(otpId, Number(values.otp)).then((res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        router.push(`/reset-request/otp/${otpId}/reset-now`);
      });
    });
  };

  return (
    <div>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 !mt-[36px]"
      >
        <div className="flex justify-between">
          {[...Array(6)].map((_, i) => (
            <Input
              key={i}
              id={`otp-input-${i}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={otpValue[i] || ""}
              onChange={(e) => {
                form.clearErrors("otp");
                const value = e.target.value.replace(/\D/g, "");
                if (!value) {
                  setOtpDigit(i, "");
                  return;
                }

                const digit = value.slice(-1);
                const digits = otpValue.padEnd(6, " ").split("");
                digits[i] = digit;
                const next = digits.join("").replace(/ /g, "");
                form.setValue("otp", next);

                if (i < 5) {
                  const nextInput = document.getElementById(`otp-input-${i + 1}`);
                  if (nextInput) (nextInput as HTMLInputElement).focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== "Backspace") return;
                e.preventDefault();

                if (otpValue[i]) {
                  const digits = otpValue.split("");
                  digits[i] = "";
                  form.setValue("otp", digits.join("").replace(/\s/g, ""));
                  return;
                }

                if (i > 0) {
                  const digits = otpValue.split("");
                  digits[i - 1] = "";
                  form.setValue("otp", digits.join("").replace(/\s/g, ""));
                  const prevInput = document.getElementById(`otp-input-${i - 1}`);
                  if (prevInput) (prevInput as HTMLInputElement).focus();
                }
              }}
              className={`!text-[30px] text-[#4E4E4E] !font-medium !leading-[45px] w-[43.83px] 
              lg:w-[70px] h-[70px] lg:h-[90px] text-center text-xl rounded-[12px] lg:rounded-[20px] 
              focus:outline-none  border-[1px] 
              ${
                form.formState.errors.otp
                  ? "bg-red-200/50 border-red-500/50"
                  : otpValue[i]
                    ? "border-primary "
                    : "border-[#121D42] bg-white"
              }`}
            />
          ))}
        </div>
        <Button
          type="submit"
          className="w-full min-h-[45px]"
          disabled={pending}
        >
          {pending ? "Espera un momento..." : "Verificar"}
        </Button>
      </form>
    </div>
  );
};

export default OTPForm;
