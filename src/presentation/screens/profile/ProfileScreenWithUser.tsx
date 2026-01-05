import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useDependencies } from "../../../app/providers/AppProvidersWithDI";
import type { User } from "../../../domain/entities/User";
import { useProfileSummaryStore } from "../../state/profileSummaryStore";

export function ProfileScreenWithUser() {
  const { getCurrentUserUseCase } = useDependencies();
  const setProfile = useProfileSummaryStore((state) => state.setProfile);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserUseCase
      .execute()
      .then(result => {
        if (isMounted) {
          setUser(result);
          if (result) {
            setProfile(result);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [getCurrentUserUseCase, setProfile]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>No user found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "600"
  }
});
