import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import React from 'react';
import { StyleSheet } from 'react-native';

import { ScanTabButton, TabBarButton, TabBarContainer } from '@/components/navigation/TabBar';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBarContainer>
          <TabTrigger name="index" href="/" asChild>
            <TabBarButton icon="home" activeIcon="homeFilled" label="Home" />
          </TabTrigger>
          <TabTrigger name="diary" href="/diary" asChild>
            <TabBarButton icon="diary" activeIcon="diaryFilled" label="Diary" />
          </TabTrigger>
          <TabTrigger name="scan" href="/scan" asChild>
            <ScanTabButton />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabBarButton icon="progress" activeIcon="progressFilled" label="Progress" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabBarButton icon="profile" activeIcon="profileFilled" label="Profile" />
          </TabTrigger>
        </TabBarContainer>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // TabSlot defaults to flexShrink: 0, which lets a long screen push the
  // tab bar off the bottom; a zero basis makes it fill only the leftover space.
  slot: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 },
});
