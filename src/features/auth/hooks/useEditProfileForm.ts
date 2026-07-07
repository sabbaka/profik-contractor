import { useUpdateProfileMutation } from "@/src/api/profikApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { AuthResult, extractErrorMessage } from "../types";

export type EditProfileFormValues = {
  name: string;
  email: string;
};

export interface UseEditProfileFormReturn {
  form: ReturnType<typeof useForm<EditProfileFormValues>>;
  isLoading: boolean;
  submit: () => Promise<AuthResult>;
}

export function useEditProfileForm(
  defaultValues: EditProfileFormValues,
): UseEditProfileFormReturn {
  const { t } = useTranslation();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const editProfileSchema = z.object({
    name: z.string().trim().min(1, t("auth.errors.nameRequired")),
    email: z
      .string()
      .trim()
      .email(t("auth.errors.emailInvalid"))
      .or(z.literal("")),
  });

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
        () => resolve({ success: false, error: t("auth.errors.validationFailed") }),
      )();
    });

  return { form, isLoading, submit };
}
