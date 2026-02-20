import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎪 Dreamwright 🎪</Text>
      <Text style={styles.subtitle}>The Brass Oracle Awaits</Text>

      <Text style={styles.description}>
        Step right up, dear dreamer.{"\n"}
        Place your essence into the machine for keeping.{"\n"}
        {"\n"}
        The gears shall turn.{"\n"}
        Your fortune shall be revealed.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/(tabs)/questionnaire")}
        accessibilityRole="button"
        accessibilityLabel="Begin Divination"
      >
        <Text style={styles.buttonText}>Begin Divination</Text>
      </Pressable>

      <Text style={styles.footer}>
        Dreams are achievable.{"\n"}
        Standard paths are not mandatory.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B4D5C",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  footer: {
    fontSize: 14,
    fontFamily: "CrimsonText-Italic",
    color: "#C0C0C0",
    textAlign: "center",
  },
});
