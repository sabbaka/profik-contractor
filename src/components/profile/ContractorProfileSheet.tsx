import { useMeQuery } from '@/src/api/profikApi';
import { colors } from '@/src/theme';
import { logout } from '@/src/store/authSlice';
import { ChevronRight, LogOut, User } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { useDispatch } from 'react-redux';
import { Group, Sheet, Text, XStack, YStack } from 'tamagui';

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
        backgroundColor={colors.bgCard}
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
      >
        <YStack alignItems="center" paddingVertical="$3">
          <YStack
            width={40}
            height={5}
            backgroundColor={colors.border}
            borderRadius="$10"
          />
        </YStack>
        <YStack padding="$5" gap="$4">
          <XStack alignItems="center" gap="$4">
            <YStack
              width="$6"
              height="$6"
              borderRadius="$10"
              backgroundColor={colors.accent}
              alignItems="center"
              justifyContent="center"
            >
              <User size="$4" color={colors.textInverse} />
            </YStack>
            <YStack>
              <Text fontSize={22} fontWeight="bold" color={colors.textPrimary}>
                {isLoading ? 'Loading...' : user?.name || 'User'}
              </Text>
              <Text color={colors.textSecondary}>{user?.email || ''}</Text>
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
                    borderBottomColor={colors.border}
                  >
                    <Text fontSize={20} color={colors.textPrimary}>Jobs</Text>
                    <ChevronRight size="$1" color={colors.textMuted} />
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
                    borderBottomColor={colors.border}
                  >
                    <Text fontSize={20} color={colors.textPrimary}>Balance</Text>
                    <ChevronRight size="$1" color={colors.textMuted} />
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
                      <LogOut size="$1" color={colors.error} />
                      <Text fontSize={20} color={colors.error}>
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
