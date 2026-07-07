import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useTopup } from "../hooks/useTopup";
import { TopupResult } from "../types";

export type TopupFormValues = {
  amount: string;
};

interface UseTopupFormOptions {
  onSuccess?: (balanceUpdated: boolean, newBalance?: number) => void;
}

export function useTopupForm(options?: UseTopupFormOptions) {
  const { t } = useTranslation();
  const { topup, isLoading, balance, isBalanceLoading, refetchBalance } =
    useTopup();
  const topupSchema = z.object({
    amount: z
      .string()
      .min(1, t("balance.errors.amountRequired"))
      .refine((val) => !isNaN(Number(val)), t("balance.errors.amountNumber"))
      .refine((val) => Number(val) > 0, t("balance.errors.amountPositive")),
  });

  const form = useForm<TopupFormValues>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: "",
    },
  });

  const onSubmit = async (data: TopupFormValues): Promise<TopupResult> => {
    const amount = Number(data.amount);
    const result = await topup(amount);

    if (result.success) {
      options?.onSuccess?.(result.balanceUpdated, result.newBalance);
    }

    return result;
  };

  return {
    form,
    isLoading,
    balance,
    isBalanceLoading,
    refetchBalance,
    submit: form.handleSubmit(onSubmit),
  };
}
