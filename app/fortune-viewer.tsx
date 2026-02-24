import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FortuneViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fortuneText = params.fortuneText as string;
  const date = params.date as string;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Profile</Text>
      </Pressable>

      <Text style={styles.title}>⚙️ Saved Fortune ⚙️</Text>

      <View style={styles.dateCard}>
        <Text style={styles.dateText}>Divined on {date}</Text>
      </View>

      <View style={styles.fortuneCard}>
        <Text style={styles.fortuneText}>{fortuneText}</Text>
      </View>

      <View style={styles.wisdomCard}>
        <Text style={styles.wisdomText}>
          The brass gears never lie.{"\n"}
          Trust in the oracle&apos;s guidance.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B4D5C",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#C0C0C0",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  dateCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5A3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#FDF6E3",
    fontStyle: "italic",
  },
  fortuneCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fortuneText: {
    fontSize: 15,
    color: "#1B4D5C",
    lineHeight: 24,
  },
  wisdomCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  wisdomText: {
    fontSize: 14,
    color: "#FDF6E3",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
});
