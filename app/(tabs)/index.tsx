import { askTheOracle } from "@/services/claude";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState("");

  console.log("API Key exists:", !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY);
  console.log(
    "API Key starts with sk-ant:",
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY?.startsWith("sk-ant"),
  );

  const testClaude = async () => {
    setTesting(true);
    try {
      const response = await askTheOracle(
        "Say hello in a mystical, theatrical way as the Dreamcatcher oracle.",
      );
      setResult(response);
    } catch (error) {
      setResult("Error: " + error);
    }
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎪 Dreamcatcher 🎪</Text>
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
        disabled={testing}
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
    elevation: 8, // Android shadow
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
  resultBox: {
    backgroundColor: "#FDF6E3",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  resultText: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 20,
  },
});
