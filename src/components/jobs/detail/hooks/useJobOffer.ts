import {
  useCreateOfferMutation,
  useGetMyOfferForJobQuery,
  useHasOfferedQuery,
  useMeQuery,
} from "@/src/api/profikApi";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type OfferMode = "idle" | "counter";

interface UseJobOfferOptions {
  jobId: string;
  jobPrice: number;
  onSuccess?: () => void;
}

export const useJobOffer = ({ jobId, jobPrice, onSuccess }: UseJobOfferOptions) => {
  const { t } = useTranslation();
  const isGuest = useIsGuest();
  const { data: me } = useMeQuery(undefined, { skip: isGuest });
  const [createOffer, { isLoading: isSubmitting }] = useCreateOfferMutation();

  const [mode, setModeState] = useState<OfferMode>("idle");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [lastOffer, setLastOffer] = useState<{
    price: number;
    message?: string;
  } | null>(null);
  const [lastOfferId, setLastOfferId] = useState<string | null>(null);

  const isContractor = me?.role === "contractor";

  const { data: offerStatus } = useHasOfferedQuery(jobId, {
    skip: !me || !isContractor,
  });

  const { data: myOffer } = useGetMyOfferForJobQuery(jobId, {
    skip: !me || !isContractor || !offerStatus?.hasOffered,
    refetchOnMountOrArgChange: true,
  });

  const offerIdForChat = lastOfferId ?? (myOffer as any)?.id ?? null;

  const hasOffered = !!(offerStatus?.hasOffered || lastOffer || myOffer);

  const myOfferPrice = (lastOffer?.price ?? (myOffer as any)?.price) as
    | number
    | undefined;

  const myOfferMessage = (lastOffer?.message ?? (myOffer as any)?.message) as
    | string
    | undefined;

  const myOfferStatus = (lastOffer ? 'pending' : (myOffer as any)?.status) as
    | 'pending' | 'accepted' | 'declined'
    | undefined;

  const setMode = useCallback(
    (next: OfferMode) => {
      setModeState(next);
      if (next === "counter") {
        setPrice(String(jobPrice));
        setMessage("");
      } else {
        setPrice("");
        setMessage("");
      }
    },
    [jobPrice],
  );

  const acceptClientPrice = useCallback(async () => {
    if (!isContractor) {
      Alert.alert(t("offer.unauthorizedTitle"), t("offer.unauthorizedBody"));
      return;
    }

    try {
      const created = await createOffer({
        jobId,
        price: jobPrice,
      }).unwrap();

      Alert.alert(t("common.success"), t("offer.submitted"));
      setLastOffer({ price: jobPrice });
      setLastOfferId((created as any)?.id ?? null);
      setModeState("idle");
      setPrice("");
      setMessage("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || t("offer.failedSubmit");
      Alert.alert(t("common.error"), msg);
    }
  }, [isContractor, jobId, jobPrice, createOffer, onSuccess, t]);

  const submitOffer = useCallback(async () => {
    if (!isContractor) {
      Alert.alert(t("offer.unauthorizedTitle"), t("offer.unauthorizedBody"));
      return;
    }

    if (!price.trim()) {
      Alert.alert(t("common.validation"), t("offer.validation.priceRequired"));
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert(t("common.validation"), t("offer.validation.pricePositive"));
      return;
    }

    if (mode === "counter" && !message.trim()) {
      Alert.alert(
        t("common.validation"),
        t("offer.validation.messageRequired"),
      );
      return;
    }

    try {
      const created = await createOffer({
        jobId,
        price: priceNum,
        message: message.trim() || undefined,
      }).unwrap();

      Alert.alert(t("common.success"), t("offer.submitted"));
      setLastOffer({ price: priceNum, message: message.trim() || undefined });
      setLastOfferId((created as any)?.id ?? null);
      setModeState("idle");
      setMessage("");
      setPrice("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || t("offer.failedSubmit");
      Alert.alert(t("common.error"), msg);
    }
  }, [isContractor, price, message, mode, jobId, createOffer, onSuccess, t]);

  return {
    isContractor,
    mode,
    setMode,
    clientPrice: jobPrice,
    price,
    setPrice,
    message,
    setMessage,
    hasOffered,
    myOfferPrice,
    myOfferMessage,
    myOfferStatus,
    offerIdForChat,
    isSubmitting,
    submitOffer,
    acceptClientPrice,
  };
};
