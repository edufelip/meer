import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { RootTabs } from "./RootTabs";
import { ThriftDetailScreen } from "../../presentation/screens/thrift/ThriftDetailScreen";
import { StoreRatingsScreen } from "../../presentation/screens/ratings/StoreRatingsScreen";
import { EditProfileScreen } from "../../presentation/screens/profile/EditProfileScreen";
import { LoginScreen } from "../../presentation/screens/auth/LoginScreen";
import { SignUpScreen } from "../../presentation/screens/auth/SignUpScreen";
import { BrechoFormScreen } from "../../presentation/screens/thrift/BrechoFormScreen";
import { MyContentsScreen } from "../../presentation/screens/content/MyContentsScreen";
import { SearchScreen } from "../../presentation/screens/search/SearchScreen";
import { ContactScreen } from "../../presentation/screens/support/ContactScreen";
import { EditContentScreen } from "../../presentation/screens/content/EditContentScreen";
import { ContentDetailScreen } from "../../presentation/screens/content/ContentDetailScreen";
import { ContentsScreen } from "../../presentation/screens/content/ContentsScreen";
import { CategoryStoresScreen } from "../../presentation/screens/categories/CategoryStoresScreen";
import type { ThriftStoreId } from "../../domain/entities/ThriftStore";
import type { RootTabParamList } from "./RootTabs";
import type { User } from "../../domain/entities/User";
import type { GuideContent, GuideContentId } from "../../domain/entities/GuideContent";

export type RootStackParamList = {
  login: undefined;
  signup: undefined;
  tabs: NavigatorScreenParams<RootTabParamList>;
  thriftDetail: { id: ThriftStoreId };
  storeRatings: { storeId: ThriftStoreId; storeName?: string; reviewCount?: number };
  editProfile: {
    profile: User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; avatarUrl?: string };
  };
  brechoForm: { thriftStore: import("../../domain/entities/ThriftStore").ThriftStore | null };
  myContents: { storeId: ThriftStoreId };
  search: undefined;
  contact: undefined;
  editContent: { articleId?: string; storeId: ThriftStoreId; article?: GuideContent };
  categoryStores: { categoryId?: string; title: string; type?: "nearby" | "category"; lat?: number; lng?: number };
  contentDetail: { content: GuideContent } | { contentId: GuideContentId };
  contents:
    | {
        initialItems?: GuideContent[];
        initialPage?: number;
        initialHasNext?: boolean;
        initialPageSize?: number;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="login">
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="signup" component={SignUpScreen} />
      <Stack.Screen name="tabs" component={RootTabs} />
      <Stack.Screen name="thriftDetail" component={ThriftDetailScreen} />
      <Stack.Screen name="storeRatings" component={StoreRatingsScreen} />
      <Stack.Screen name="editProfile" component={EditProfileScreen} />
      <Stack.Screen name="brechoForm" component={BrechoFormScreen} />
      <Stack.Screen name="myContents" component={MyContentsScreen} />
      <Stack.Screen name="search" component={SearchScreen} />
      <Stack.Screen name="contact" component={ContactScreen} />
      <Stack.Screen name="editContent" component={EditContentScreen} />
      <Stack.Screen name="contentDetail" component={ContentDetailScreen} />
      <Stack.Screen name="contents" component={ContentsScreen} />
      <Stack.Screen name="categoryStores" component={CategoryStoresScreen} />
    </Stack.Navigator>
  );
}
