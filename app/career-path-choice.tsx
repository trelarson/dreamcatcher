// app/career-path-choice.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CareerPathChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleChoice = (pathType: "new" | "pivot") => {
    // Navigate to action plan with the path type
    router.push({
      pathname: "/action-plan",
      params: {
        ...params,
        pathType, // Add the path type to params
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Decorative corners */}
      <View style={styles.cornerTopLeft}>
        <Text style={styles.cornerText}>⚙</Text>
      </View>
      <View style={styles.cornerTopRight}>
        <Text style={styles.cornerText}>⚙</Text>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>⚙️ Choose Your Approach ⚙️</Text>
      <Text style={styles.subtitle}>
        The gears turn differently for each dreamer.{"\n"}
        How shall you walk this path?
      </Text>

      {/* Choice Cards */}
      <View style={styles.choicesContainer}>
        {/* New Career Path Option */}
        <Pressable
          style={styles.choiceCard}
          onPress={() => handleChoice("new")}
          accessibilityRole="button"
          accessibilityLabel="Forge a New Path — start fresh in a new career"
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.choiceEmoji}>🌟</Text>
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>FRESH START</Text>
            </View>
          </View>

          <Text style={styles.choiceTitle}>Forge a New Path</Text>

          <Text style={styles.choiceDescription}>
            Begin your journey from the foundation. Build the skills, gather the
            credentials, and step boldly into uncharted territory.
          </Text>

          <View style={styles.pathFeatures}>
            <Text style={styles.featureLabel}>The Advisor Shall Reveal:</Text>
            <Text style={styles.featureItem}>• Essential skills to master</Text>
            <Text style={styles.featureItem}>
              • Educational paths & certifications
            </Text>
            <Text style={styles.featureItem}>
              • First opportunities to pursue
            </Text>
            <Text style={styles.featureItem}>• Timeline: 6-18 months</Text>
          </View>

          <View style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>Begin Anew →</Text>
          </View>
        </Pressable>

        {/* Career Pivot Option */}
        <Pressable
          style={styles.choiceCard}
          onPress={() => handleChoice("pivot")}
          accessibilityRole="button"
          accessibilityLabel="Pivot From Where You Stand — leverage existing skills"
        >
          <View style={styles.choiceHeader}>
            <Text style={styles.choiceEmoji}>🔄</Text>
            <View style={[styles.iconBadge, styles.iconBadgePivot]}>
              <Text style={styles.iconBadgeText}>STRATEGIC MOVE</Text>
            </View>
          </View>

          <Text style={styles.choiceTitle}>Pivot From Where You Stand</Text>

          <Text style={styles.choiceDescription}>
            Leverage what you already possess. Your experience is currency—spend
            it wisely to reach adjacent territory.
          </Text>

          <View style={styles.pathFeatures}>
            <Text style={styles.featureLabel}>The Advisor Shall Reveal:</Text>
            <Text style={styles.featureItem}>
              • How to leverage existing skills
            </Text>
            <Text style={styles.featureItem}>
              • Adjacent roles & opportunities
            </Text>
            <Text style={styles.featureItem}>
              • Internal transition strategies
            </Text>
            <Text style={styles.featureItem}>• Timeline: 3-12 months</Text>
          </View>

          <View style={styles.chooseButton}>
            <Text style={styles.chooseButtonText}>Strategic Pivot →</Text>
          </View>
        </Pressable>
      </View>

      {/* Footer wisdom */}
      <View style={styles.wisdomCard}>
        <Text style={styles.wisdomText}>
          Both paths lead to dreams realized.{"\n"}
          Choose the one that matches your starting position.
        </Text>
      </View>

      {/* Decorative corners bottom */}
      <View style={styles.cornerBottomLeft}>
        <Text style={styles.cornerText}>⚙</Text>
      </View>
      <View style={styles.cornerBottomRight}>
        <Text style={styles.cornerText}>⚙</Text>
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
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  choicesContainer: {
    gap: 20,
    marginBottom: 25,
  },
  choiceCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 24,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  choiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  choiceEmoji: {
    fontSize: 40,
  },
  iconBadge: {
    backgroundColor: "#2C6B7F",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  iconBadgePivot: {
    backgroundColor: "#8B5A3C",
  },
  iconBadgeText: {
    fontSize: 10,
    fontFamily: "Cinzel-Bold",
    color: "#FDF6E3",
    textTransform: "uppercase",
  },
  choiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
    marginBottom: 12,
  },
  choiceDescription: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 22,
    marginBottom: 20,
  },
  pathFeatures: {
    backgroundColor: "rgba(27, 77, 92, 0.05)",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#D4AF37",
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  featureItem: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 22,
    marginBottom: 4,
  },
  chooseButton: {
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
  chooseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  wisdomCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  wisdomText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 22,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 1,
  },
  cornerTopRight: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 8,
    left: 8,
    zIndex: 1,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 8,
    right: 8,
    zIndex: 1,
  },
  cornerText: {
    fontSize: 20,
    color: "#D4AF37",
    fontWeight: "bold",
  },
});
