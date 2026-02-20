import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { purchaseAnnualPlan, restorePurchases } from "@/services/purchases";

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const onPurchaseSuccess = () => {
    if (params.title) {
      router.replace({ pathname: "/action-plan", params });
    } else {
      router.back();
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const granted = await purchaseAnnualPlan();
      if (granted) {
        Alert.alert(
          "⚙️ The Vault Opens!",
          "You now have full access to the Dreamwright oracle. Your action plans await.",
          [{ text: "Continue", onPress: onPurchaseSuccess }],
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const granted = await restorePurchases();
      if (granted) {
        Alert.alert("⚙️ Restored!", "Your subscription has been restored.", [
          { text: "Continue", onPress: onPurchaseSuccess },
        ]);
      } else {
        Alert.alert(
          "No Purchase Found",
          "We couldn't find a previous purchase linked to your account.",
        );
      }
    } catch (error: any) {
      Alert.alert("Restore Failed", error?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </Pressable>

      <Text style={styles.title}>⚙️ Unlock Your Path ⚙️</Text>
      <Text style={styles.subtitle}>
        The oracle has revealed your paths.{"\n"}
        Now unlock the power to walk them.
      </Text>

      {/* What's Included */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>What Awaits Inside:</Text>

        {[
          {
            icon: "🎯",
            title: "Milestone Action Plans",
            desc: "Detailed milestones broken into achievable tasks",
          },
          {
            icon: "📊",
            title: "Progress Tracking",
            desc: "Track your journey checkpoint by checkpoint",
          },
          {
            icon: "🔗",
            title: "Curated Resources",
            desc: "Real courses, links, and communities for each step",
          },
          {
            icon: "💾",
            title: "Save & Resume",
            desc: "Your progress is saved to the cloud",
          },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pricing Card */}
      <Text style={styles.pricingLabel}>Early Access Pricing:</Text>

      <Pressable
        style={[styles.pricingCard, styles.pricingCardHighlighted]}
        onPress={handlePurchase}
        disabled={loading}
      >
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>⭐ EARLY ACCESS</Text>
        </View>
        <Text style={styles.pricingPeriod}>Annual Plan</Text>
        <Text style={styles.pricingPrice}>
          $0.99<Text style={styles.pricingPeriodSmall}>/year</Text>
        </Text>
        <Text style={styles.pricingTotal}>Full Access • Cancel Anytime</Text>
      </Pressable>

      {/* Advisor Wisdom */}
      <View style={styles.wisdomCard}>
        <Text style={styles.wisdomText}>
          The brass gears turn for those who dare to act.{"\n"}
          Someone less qualified is already walking their path.{"\n"}
          {"\n"}
          Will you unlock yours?
        </Text>
      </View>

      <Pressable onPress={handleRestore} disabled={loading}>
        <Text style={styles.restoreLink}>Restore Previous Purchase</Text>
      </Pressable>

      <Text style={styles.footer}>
        Cancel or manage your subscription anytime in your device settings.
      </Text>
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
  closeButton: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#FDF6E3",
  },
  title: {
    fontSize: 28,
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
    marginBottom: 25,
    lineHeight: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    marginBottom: 15,
  },
  featuresCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#D4AF37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  pricingCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#B8860B",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  pricingCardHighlighted: {
    borderColor: "#D4AF37",
    borderWidth: 3,
    backgroundColor: "#FFF8DC",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: "CrimsonText-Regular",
    color: "#C0C0C0",
  },
  pricingLabel: {
    fontSize: 16,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    marginBottom: 12,
  },
  popularBadge: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  pricingPeriod: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  pricingPrice: {
    fontSize: 42,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
  },
  pricingPeriodSmall: {
    fontSize: 18,
    fontFamily: "CrimsonText-Regular",
    color: "#8B5A3C",
  },
  pricingTotal: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#6B4423",
    marginTop: 4,
  },
  wisdomCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    marginBottom: 15,
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
  restoreLink: {
    fontSize: 13,
    fontFamily: "CrimsonText-Regular",
    color: "#C0C0C0",
    textAlign: "center",
    textDecorationLine: "underline",
    marginBottom: 12,
  },
  footer: {
    fontSize: 12,
    fontFamily: "CrimsonText-Regular",
    color: "#8B8B8B",
    textAlign: "center",
  },
});
