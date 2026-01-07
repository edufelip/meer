import "react-native-gesture-handler";
import "./global.css";
import React from "react";
import messaging from "@react-native-firebase/messaging";
import { AppRoot } from "./src/app";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("FCM background message:", remoteMessage);
});

export default function App() {
  return <AppRoot />;
}
