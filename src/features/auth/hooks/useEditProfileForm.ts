import { useUpdateProfileMutation } from "@/src/api/profikApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthResult, extractErrorMessage } from "../types";

const editProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .or(z.literal("")),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export interface UseEditProfileFormReturn {
  form: ReturnType<typeof useForm<EditProfileFormValues>>;
  isLoading: boolean;
  submit: () => Promise<AuthResult>;
}

export function useEditProfileForm(
  defaultValues: EditProfileFormValues,
): UseEditProfileFormReturn {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues,
  });

  const submit = (): Promise<AuthResult> =>
    new Promise((resolve) => {
      form.handleSubmit(
        async (data) => {
          try {
            const payload: { name?: string; email?: string } = { name: data.name };
            if (data.email) payload.email = data.email;
            await updateProfile(payload).unwrap();
            resolve({ success: true });
          } catch (err: unknown) {
            resolve({ success: false, error: extractErrorMessage(err) });
          }
        },
        () => resolve({ success: false, error: "Validation failed" }),
      )();
    });

  return { form, isLoading, submit };
}
