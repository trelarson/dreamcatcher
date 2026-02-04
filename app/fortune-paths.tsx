import { auth, db } from "@/config/firebase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function FortunePathsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const paths = JSON.parse(params.paths as string);
  const greeting = params.greeting as string;
  const closing = params.closing as string;

  const handlePathSelect = async (path: any) => {
    try {
      const pathParams = {
        title: path.title,
        why: path.why,
        steps: path.steps.join("|||"),
        timeline: path.timeline,
      };

      if (!auth.currentUser) {
        router.push({
          pathname: "/paywall",
          params: pathParams,
        });
        return;
      }

      // Check subscription status
      const subDoc = await getDoc(
        doc(db, "subscriptions", auth.currentUser.uid),
      );

      if (subDoc.exists() && subDoc.data().active === true) {
        // User is subscribed - go to action plan
        router.push({
          pathname: "/action-plan",
          params: pathParams,
        });
      } else {
        // Not subscribed - show paywall
        router.push({
          pathname: "/paywall",
          params: pathParams,
        });
      }
    } catch (error) {
      router.push({
        pathname: "/paywall",
        params: {
          title: path.title,
          why: path.why,
          steps: path.steps.join("|||"),
          timeline: path.timeline,
        },
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Vault</Text>
      </Pressable>

      <Text style={styles.title}>⚙️ Your Saved Fortune ⚙️</Text>

      {greeting && (
        <View style={styles.greetingCard}>
          <Text style={styles.greetingText}>{greeting}</Text>
        </View>
      )}

      <Text style={styles.pathsTitle}>Your Three Paths:</Text>

      {paths.map((path: any, index: number) => (
        <View key={index} style={styles.pathCard}>
          <View style={styles.pathHeader}>
            <Text style={styles.pathNumber}>Path {index + 1}</Text>
            <View
              style={[
                styles.eyebrowBadge,
                path.eyebrowFactor?.toLowerCase().includes("high") &&
                  styles.eyebrowHigh,
                path.eyebrowFactor?.toLowerCase().includes("medium") &&
                  styles.eyebrowMedium,
                path.eyebrowFactor?.toLowerCase().includes("low") &&
                  styles.eyebrowLow,
              ]}
            >
              <Text style={styles.eyebrowText}>
                {path.eyebrowFactor?.toLowerCase().includes("high")
                  ? "🔥 Wild"
                  : path.eyebrowFactor?.toLowerCase().includes("medium")
                    ? "⚡ Bold"
                    : "✨ Sensible"}
              </Text>
            </View>
          </View>

          <Text style={styles.pathTitle}>{path.title}</Text>

          <View style={styles.pathSection}>
            <Text style={styles.pathSectionTitle}>Why This Works:</Text>
            <Text style={styles.pathText}>{path.why}</Text>
          </View>

          <View style={styles.pathSection}>
            <Text style={styles.pathSectionTitle}>First Steps:</Text>
            {path.steps.map((step: string, stepIndex: number) => (
              <View key={stepIndex} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pathMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>⏱️ Timeline:</Text>
              <Text style={styles.metaValue}>{path.timeline}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>💰 Income:</Text>
              <Text style={styles.metaValue}>{path.income}</Text>
            </View>
          </View>

          <Pressable
            style={styles.choosePathButton}
            onPress={() => handlePathSelect(path)}
          >
            <Text style={styles.choosePathText}>Get Action Plan →</Text>
          </Pressable>
        </View>
      ))}

      {closing && (
        <View style={styles.closingCard}>
          <Text style={styles.closingText}>{closing}</Text>
        </View>
      )}
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
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  greetingCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  greetingText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 22,
  },
  pathsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    marginBottom: 15,
  },
  pathCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  pathHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pathNumber: {
    fontSize: 14,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
  },
  eyebrowBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#E8E8E8",
  },
  eyebrowHigh: {
    backgroundColor: "#FFE4E1",
  },
  eyebrowMedium: {
    backgroundColor: "#FFF8DC",
  },
  eyebrowLow: {
    backgroundColor: "#F0FFF0",
  },
  eyebrowText: {
    fontSize: 11,
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
    marginBottom: 15,
  },
  pathSection: {
    marginBottom: 15,
  },
  pathSectionTitle: {
    fontSize: 14,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginBottom: 6,
  },
  pathText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 15,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 22,
  },
  pathMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#D4AF37",
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
  },
  choosePathButton: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  choosePathText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  closingCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  closingText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 22,
  },
});
