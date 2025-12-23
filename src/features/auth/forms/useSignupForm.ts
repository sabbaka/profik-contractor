import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSignup } from "../hooks/useSignup";

const signupSchema = z.object({
  phone: z.string().min(6, "Phone is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email").or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupFormData = z.infer<typeof signupSchema>;

interface UseSignupFormOptions {
  onCodeSent?: () => void;
}

export function useSignupForm(options?: UseSignupFormOptions) {
  const { signup, isLoading } = useSignup();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
