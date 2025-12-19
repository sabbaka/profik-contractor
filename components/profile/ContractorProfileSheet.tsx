import { useMeQuery } from '@/src/api/profikApi';
import { logout } from '@/src/store/authSlice';
import { ChevronRight, LogOut, User } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Group, H2, Sheet, Text, XStack, YStack } from 'tamagui';
import { useDispatch } from 'react-redux';

interface ContractorProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractorProfileSheet({
  open,
  onOpenChange,
}: ContractorProfileSheetProps) {
  const { data: user, isLoading } = useMeQuery();
  const dispatch = useDispatch();

  const handleOpenJobsPress = () => {
    onOpenChange(false);
    router.push({ pathname: '/(contractor)/open' as any });
  };

  const handleBalancePress = () => {
    onOpenChange(false);
    router.push({ pathname: '/(contractor)/balance' as any });
  };

  const handleLogout = () => {
    onOpenChange(false);
    dispatch(logout());
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[40]}
      dismissOnSnapToBottom
      defaultPosition={0}
      zIndex={100_000}
      animation="medium"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
      >
        <YStack alignItems="center" paddingVertical="$3">
          <YStack
            width={40}
            height={5}
            backgroundColor="$gray6"
            borderRadius="$10"
          />
        </YStack>
        <YStack padding="$5" gap="$4">
          <XStack alignItems="center" gap="$4">
            <YStack
              width="$6"
              height="$6"
              borderRadius="$10"
              backgroundColor="$gray5"
              alignItems="center"
              justifyContent="center"
            >
              <User size="$4" color="black" />
            </YStack>
            <YStack>
              <H2>{isLoading ? 'Loading...' : user?.name || 'User'}</H2>
              <Text theme="alt2">{user?.email || ''}</Text>
            </YStack>
          </XStack>

          <YStack gap="$3">
            <Group>
              <Group.Item>
                <Pressable onPress={handleOpenJobsPress}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical="$3"
                    paddingHorizontal="$2"
                    borderBottomWidth={1}
                    borderBottomColor="$gray5"
                  >
                    <Text fontSize={20}>Open Jobs</Text>
                    <ChevronRight size="$1" color="$gray5" />
                  </XStack>
                </Pressable>
              </Group.Item>
              <Group.Item>
                <Pressable onPress={handleBalancePress}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical="$3"
                    paddingHorizontal="$2"
                    borderBottomWidth={1}
                    borderBottomColor="$gray5"
                  >
                    <Text fontSize={20}>Balance</Text>
                    <ChevronRight size="$1" color="$gray5" />
                  </XStack>
                </Pressable>
              </Group.Item>
              <Group.Item>
                <Pressable onPress={handleLogout}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical="$3"
                    paddingHorizontal="$2"
                    borderBottomWidth={0}
                  >
                    <XStack alignItems="center" gap="$2">
                      <LogOut size="$1" color="$red10" />
                      <Text fontSize={20} color="$red10">
                        Logout
                      </Text>
                    </XStack>
                  </XStack>
                </Pressable>
              </Group.Item>
            </Group>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
