import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isValidCzechPhone } from "@/src/components/form/PhoneInput";
import { useAuth } from "../hooks/useAuth";

export type LoginFormValues = {
  phone: string;
  password: string;
};

export function useLoginForm(returnTo?: string) {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const loginSchema = z.object({
    phone: z
      .string()
      .min(1, t("auth.errors.phoneRequired"))
      .refine(isValidCzechPhone, t("auth.errors.phoneComplete")),
    password: z.string().min(6, t("auth.errors.passwordMin")),
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.phone, data.password, returnTo);
  };

  return {
    form,
    isLoading,
    submit: form.handleSubmit(onSubmit),
  };
}
