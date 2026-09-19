import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useTopup } from "../hooks/useTopup";
import { MAX_TOPUP_CZK, MIN_TOPUP_CZK } from "../topupLimits";
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
  // The last three mirror the server's own rules. They were server-only, so a
  // 1 Kč top-up reached the API and came back as a validation error the screen
  // could not show — the amount has to be refused here, where it can be
  // explained in the reader's language before anything is sent.
  const topupSchema = z.object({
    amount: z
      .string()
      .min(1, t("balance.errors.amountRequired"))
      .refine((val) => !isNaN(Number(val)), t("balance.errors.amountNumber"))
      .refine((val) => Number(val) > 0, t("balance.errors.amountPositive"))
      .refine(
        (val) => Number.isInteger(Number(val)),
        t("balance.errors.amountWhole"),
      )
      .refine(
        (val) => Number(val) >= MIN_TOPUP_CZK,
        t("balance.errors.amountMin", { amount: MIN_TOPUP_CZK }),
      )
      .refine(
        (val) => Number(val) <= MAX_TOPUP_CZK,
        t("balance.errors.amountMax", { amount: MAX_TOPUP_CZK }),
      ),
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
