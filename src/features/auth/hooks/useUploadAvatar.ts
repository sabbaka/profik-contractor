import { useUploadAvatarMutation } from "@/src/api/profikApi";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { AuthResult, extractErrorMessage } from "../types";

export interface UseUploadAvatarReturn {
  /**
   * Open the OS image picker, ask for permission if needed and POST the
   * selected image to /users/me/avatar. The /me cache is updated optimistically
   * via the underlying mutation's onQueryStarted.
   */
  pickAndUpload: () => Promise<AuthResult & { cancelled?: boolean }>;
  isUploading: boolean;
}

export function useUploadAvatar(): UseUploadAvatarReturn {
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  const pickAndUpload = async (): Promise<
    AuthResult & { cancelled?: boolean }
  > => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access to change your avatar.",
      );
      return { success: false, error: "Permission denied" };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, cancelled: true, error: "Cancelled" };
    }

    const asset = result.assets[0];
    try {
      await uploadAvatar({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      }).unwrap();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: extractErrorMessage(err) };
    }
  };

  return { pickAndUpload, isUploading };
}
