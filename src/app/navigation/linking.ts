import type { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { getWebBaseUrl, getWwwBaseUrl } from "../../shared/deepLinks";
import type { RootStackParamList } from "./RootStack";

const prefixes = (() => {
  const items = [Linking.createURL("/"), "meer://", "exp+meer://"];
  const webBaseUrl = getWebBaseUrl();
  if (webBaseUrl) items.push(webBaseUrl);
  const wwwBaseUrl = getWwwBaseUrl();
  if (wwwBaseUrl && wwwBaseUrl !== webBaseUrl) items.push(wwwBaseUrl);
  return items;
})();

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes,
  config: {
    screens: {
      login: "login",
      signup: "signup",
      tabs: {
        screens: {
          home: "home",
          favorites: "favorites",
          categories: "categories",
          profile: "profile"
        }
      },
      thriftDetail: "store/:id",
      contentDetail: "content/:contentId",
      search: "search",
      contact: "contact"
    }
  }
};
