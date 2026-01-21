import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTopup } from "../hooks/useTopup";
import { TopupResult } from "../types";

const topupSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)), "Must be a valid number")
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),
});

export type TopupFormValues = z.infer<typeof topupSchema>;

interface UseTopupFormOptions {
  onSuccess?: (balanceUpdated: boolean, newBalance?: number) => void;
}

export function useTopupForm(options?: UseTopupFormOptions) {
  const { topup, isLoading, balance, isBalanceLoading, refetchBalance } =
    useTopup();

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

