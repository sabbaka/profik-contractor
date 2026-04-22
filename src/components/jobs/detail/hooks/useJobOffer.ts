import {
  useCreateOfferMutation,
  useGetMyOfferForJobQuery,
  useHasOfferedQuery,
  useMeQuery,
} from "@/src/api/profikApi";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

type OfferMode = "idle" | "counter";

interface UseJobOfferOptions {
  jobId: string;
  jobPrice: number;
  onSuccess?: () => void;
}

export const useJobOffer = ({ jobId, jobPrice, onSuccess }: UseJobOfferOptions) => {
  const { data: me } = useMeQuery();
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
      Alert.alert("Unauthorized", "Only contractors can submit offers.");
      return;
    }

    try {
      const created = await createOffer({
        jobId,
        price: jobPrice,
      }).unwrap();

      Alert.alert("Success", "Offer submitted successfully");
      setLastOffer({ price: jobPrice });
      setLastOfferId((created as any)?.id ?? null);
      setModeState("idle");
      setPrice("");
      setMessage("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || "Failed to submit offer";
      Alert.alert("Error", msg);
    }
  }, [isContractor, jobId, jobPrice, createOffer, onSuccess]);

  const submitOffer = useCallback(async () => {
    if (!isContractor) {
      Alert.alert("Unauthorized", "Only contractors can submit offers.");
      return;
    }

    if (!price.trim()) {
      Alert.alert("Validation", "Please enter your offer price.");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Validation", "Price must be a positive number.");
      return;
    }

    if (mode === "counter" && !message.trim()) {
      Alert.alert(
        "Validation",
        "Please explain your price to the client.",
      );
      return;
    }

    try {
      const created = await createOffer({
        jobId,
        price: priceNum,
        message: message.trim() || undefined,
      }).unwrap();

      Alert.alert("Success", "Offer submitted successfully");
      setLastOffer({ price: priceNum, message: message.trim() || undefined });
      setLastOfferId((created as any)?.id ?? null);
      setModeState("idle");
      setMessage("");
      setPrice("");
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || "Failed to submit offer";
      Alert.alert("Error", msg);
    }
  }, [isContractor, price, message, mode, jobId, createOffer, onSuccess]);

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
