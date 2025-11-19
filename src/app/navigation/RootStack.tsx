import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootTabs } from "./RootTabs";
import { ThriftDetailScreen } from "../../presentation/screens/thrift/ThriftDetailScreen";
import type { ThriftStoreId } from "../../domain/entities/ThriftStore";

export type RootStackParamList = {
  tabs: undefined;
  thriftDetail: { id: ThriftStoreId };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" component={RootTabs} />
      <Stack.Screen name="thriftDetail" component={ThriftDetailScreen} />
    </Stack.Navigator>
  );
}
