import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootTabs } from "./RootTabs";
import { ThriftDetailScreen } from "../../presentation/screens/thrift/ThriftDetailScreen";
import { EditProfileScreen } from "../../presentation/screens/profile/EditProfileScreen";
import { LoginScreen } from "../../presentation/screens/auth/LoginScreen";
import type { ThriftStoreId } from "../../domain/entities/ThriftStore";
import type { User } from "../../domain/entities/User";

export type RootStackParamList = {
  login: undefined;
  tabs: undefined;
  thriftDetail: { id: ThriftStoreId };
  editProfile: {
    profile: User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; avatarUrl?: string };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="login">
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="tabs" component={RootTabs} />
      <Stack.Screen name="thriftDetail" component={ThriftDetailScreen} />
      <Stack.Screen name="editProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
