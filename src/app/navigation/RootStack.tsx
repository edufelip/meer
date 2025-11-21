import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootTabs } from "./RootTabs";
import { ThriftDetailScreen } from "../../presentation/screens/thrift/ThriftDetailScreen";
import { EditProfileScreen } from "../../presentation/screens/profile/EditProfileScreen";
import type { ThriftStoreId } from "../../domain/entities/ThriftStore";

export type RootStackParamList = {
  tabs: undefined;
  thriftDetail: { id: ThriftStoreId };
  editProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" component={RootTabs} />
      <Stack.Screen name="thriftDetail" component={ThriftDetailScreen} />
      <Stack.Screen name="editProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
