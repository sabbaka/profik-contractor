import {
  useCreateOfferMutation,
  useGetMyOfferForJobQuery,
  useMeQuery,
} from "@/src/api/profikApi";
import { OFFER_COST_CZK } from "@/src/components/jobs/detail/offerPricing";
import { useIsGuest } from "@/src/features/auth/hooks/useIsGuest";
import { useNameGate } from "@/src/features/auth/hooks/useNameGate";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type OfferMode = "idle" | "counter";

interface UseJobOfferOptions {
  jobId: string;
  jobPrice: number;
  /** Owner of the job, so the screen can tell it apart from work to bid on. */
  clientId?: string | null;
  onSuccess?: () => void;
}

export const useJobOffer = ({
  jobId,
  jobPrice,
  clientId,
  onSuccess,
}: UseJobOfferOptions) => {
  const { t } = useTranslation();
  const isGuest = useIsGuest();
  const { data: me } = useMeQuery(undefined, { skip: isGuest });
  const [createOffer, { isLoading: isSubmitting }] = useCreateOfferMutation();
  const { withName, nameSheetProps } = useNameGate();

  const [mode, setModeState] = useState<OfferMode>("idle");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const isContractor = me?.role === "contractor";
  // One phone is one account, so the person browsing here may also be the
  // client who posted this job. The backend refuses an offer on your own job
  // and the open-jobs feed hides it, but a direct link still lands here —
  // without this the screen would offer a button that can only fail.
  const isOwnJob = !!me && !!clientId && clientId === me.id;
  const canOffer = isContractor && !isOwnJob;
  // Sending an offer is paid for out of the balance, so the screen has to know
  // before the button is pressed — the backend answers a short balance with a
  // 403 that reads like any other failure.
  const balance = me?.balance ?? 0;
  const canAffordOffer = balance >= OFFER_COST_CZK;

  // One request answers both questions: null means no offer yet. createOffer
  // writes its response straight into this cache entry, so everything below
  // reflects the server the moment an offer is sent — no local stand-in, and
  // no guessed status.
  const { data: myOffer } = useGetMyOfferForJobQuery(jobId, {
    skip: !me || !canOffer,
    refetchOnMountOrArgChange: true,
  });

  const offerIdForChat = myOffer?.id ?? null;
  const hasOffered = !!myOffer;
  const myOfferPrice = myOffer?.price;
  const myOfferMessage = myOffer?.message;
  const myOfferStatus = myOffer?.status;

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

  const sendOfferAtClientPrice = useCallback(async () => {
    if (!canOffer) {
      Alert.alert(t("offer.unauthorizedTitle"), t("offer.unauthorizedBody"));
      return;
    }

    try {
      await createOffer({
        jobId,
        price: jobPrice,
      }).unwrap();

      Alert.alert(t("common.success"), t("offer.submitted"));
      setModeState("idle");
      setPrice("");
      setMessage("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || t("offer.failedSubmit");
      Alert.alert(t("common.error"), msg);
    }
  }, [canOffer, jobId, jobPrice, createOffer, onSuccess, t]);

  const sendOffer = useCallback(async () => {
    if (!canOffer) {
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
      await createOffer({
        jobId,
        price: priceNum,
        message: message.trim() || undefined,
      }).unwrap();

      Alert.alert(t("common.success"), t("offer.submitted"));
      setModeState("idle");
      setMessage("");
      setPrice("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || t("offer.failedSubmit");
      Alert.alert(t("common.error"), msg);
    }
  }, [canOffer, price, message, mode, jobId, createOffer, onSuccess, t]);

  // Everything the contractor can get wrong is checked here, before the name
  // sheet can appear — being asked for your name and only then told the price
  // is missing is the wrong order to learn it in.
  const isOfferValid = useCallback(() => {
    if (!canOffer) {
      Alert.alert(t("offer.unauthorizedTitle"), t("offer.unauthorizedBody"));
      return false;
    }
    if (!price.trim()) {
      Alert.alert(t("common.validation"), t("offer.validation.priceRequired"));
      return false;
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert(t("common.validation"), t("offer.validation.pricePositive"));
      return false;
    }
    if (mode === "counter" && !message.trim()) {
      Alert.alert(
        t("common.validation"),
        t("offer.validation.messageRequired"),
      );
      return false;
    }
    return true;
  }, [canOffer, price, mode, message, t]);

  // An account can exist with no name at all — signing up only takes a phone
  // number. The client picks between offers by who they are from, so this is
  // where we ask, rather than putting the field in front of everyone at
  // registration.
  const acceptClientPrice = useCallback(() => {
    if (!canOffer) {
      Alert.alert(t("offer.unauthorizedTitle"), t("offer.unauthorizedBody"));
      return;
    }
    withName(() => void sendOfferAtClientPrice());
  }, [canOffer, sendOfferAtClientPrice, t, withName]);

  const submitOffer = useCallback(() => {
    if (!isOfferValid()) return;
    withName(() => void sendOffer());
  }, [isOfferValid, sendOffer, withName]);

  return {
    nameSheetProps,
    isContractor,
    isOwnJob,
    canOffer,
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
    balance,
    canAffordOffer,
    isSubmitting,
    submitOffer,
    acceptClientPrice,
  };
};
