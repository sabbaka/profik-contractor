import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { isValidCzechPhone } from "@/src/components/form/PhoneInput";
import { useAuth } from "../hooks/useAuth";

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone is required")
    .refine(isValidCzechPhone, "Enter a complete phone number (+420 XXX XXX XXX)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const { login, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.phone, data.password);
  };

  return {
    form,
    isLoading,
    submit: form.handleSubmit(onSubmit),
  };
}
