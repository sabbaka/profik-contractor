import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isValidCzechPhone } from "@/src/components/form/PhoneInput";
import { useSignup } from "../hooks/useSignup";

export type SignupFormData = {
  phone: string;
  name: string;
  email: string;
  password: string;
};

interface UseSignupFormOptions {
  onCodeSent?: () => void;
}

export function useSignupForm(options?: UseSignupFormOptions) {
  const { t } = useTranslation();
  const { signup, isLoading } = useSignup();
  const signupSchema = z.object({
    phone: z
      .string()
      .min(1, t("auth.errors.phoneRequired"))
      .refine(isValidCzechPhone, t("auth.errors.phoneComplete")),
    name: z.string().min(2, t("auth.errors.nameMin")),
    email: z.email(t("auth.errors.emailInvalid")).or(z.literal("")),
    password: z.string().min(6, t("auth.errors.passwordMin")),
  });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    reValidateMode: "onChange",
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const handleRequestCode = async (data: SignupFormData) => {
    const result = await signup({
      phone: data.phone.trim(),
      name: data.name.trim(),
      email: data.email.trim() || undefined,
      password: data.password.trim(),
    });

    if (result.success) {
      options?.onCodeSent?.();
    }

    return result;
  };

  const handleVerifyCode = async (code: string) => {
    if (code.length !== 6) {
      return;
    }

    await signup({
      phone: form.getValues("phone"),
      name: form.getValues("name"),
      email: form.getValues("email"),
      password: form.getValues("password"),
      code: code,
    });
  };

  return {
    form,
    isLoading,
    handleRequestCode: form.handleSubmit(handleRequestCode),
    handleVerifyCode,
  };
}
