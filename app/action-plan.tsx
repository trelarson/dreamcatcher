import { auth } from "@/config/firebase";
import { askTheOracle } from "@/services/claude";
import {
  getActionPlanById,
  saveActionPlan,
  updateActionPlan,
} from "@/services/firestore";
import { usePremium } from "@/hooks/usePremium";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ActionPlanData {
  vision: string;
  destination: string;
  year5Milestone: string;
  year1Goal: string;
  month2Checkpoint: string[];
  month4Checkpoint: string[];
  month6Checkpoint: string[];
  week24: string;
  week58: string;
  tomorrow: string[];
  firstResource: string;
  realityCheck: string;
}

const PLAN_KEYS = [
  "VISION",
  "DESTINATION",
  "YEAR_5_MILESTONE",
  "YEAR_1_GOAL",
  "MONTH_6_CHECKPOINT",
  "MONTH_4_CHECKPOINT",
  "MONTH_2_CHECKPOINT",
  "WEEK_5_8",
  "WEEK_2_4",
  "TOMORROW",
  "FIRST_RESOURCE",
  "REALITY_CHECK",
] as const;

export default function ActionPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPremium, loading: premiumLoading } = usePremium();
  const initiated = useRef(false);

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<ActionPlanData | null>(null);
  const [pathTitle, setPathTitle] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Collapsible sections — all expanded by default
  const [week24Open, setWeek24Open] = useState(true);
  const [week58Open, setWeek58Open] = useState(true);
  const [month2Open, setMonth2Open] = useState(true);
  const [month4Open, setMonth4Open] = useState(true);
  const [month6Open, setMonth6Open] = useState(true);

  useEffect(() => {
    if (params.planId) {
      if (!initiated.current) {
        initiated.current = true;
        loadSavedPlan(params.planId as string);
      }
      return;
    }

    if (premiumLoading) return;
    if (initiated.current) return;
    initiated.current = true;

    if (!isPremium) {
      router.replace({ pathname: "/paywall", params });
      return;
    }

    generateActionPlan();
  }, [isPremium, premiumLoading]);

  const loadSavedPlan = async (id: string) => {
    setLoading(true);
    try {
      const plan = await getActionPlanById(id);
      if (plan) {
        setPathTitle(plan.pathTitle);
        const raw = plan.milestones as unknown;
        if (
          raw &&
          typeof raw === "object" &&
          !Array.isArray(raw) &&
          "vision" in (raw as object)
        ) {
          setPlanData(raw as ActionPlanData);
        } else {
          throw new Error(
            "This plan was saved in an older format and cannot be displayed.",
          );
        }
        setPlanId(id);
      } else {
        throw new Error("Plan not found");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message, [
        { text: "Go Back", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateActionPlan = async () => {
    setLoading(true);
    try {
      const title = params.title as string;
      const why = params.why as string;
      const steps = params.steps as string;
      const timeline = params.timeline as string;
      const tenYearVision = (params.tenYearVision as string) || "Not specified";
      const flowState = (params.flowState as string) || "Not specified";
      const problemCare = (params.problemCare as string) || "Not specified";
      const conformityScale = (params.conformityScale as string) || "50";

      setPathTitle(title);

      const systemInstructions = `You are the Dreamwright brass advisor creating a deeply personalised career blueprint.
This plan is for a specific individual. Use their personal context throughout — reference their vision, their energising work, and the problem they care about in the milestones, tasks, and reflection questions. Do not write generic advice.

USER PROFILE:
- 10-Year Vision: ${tenYearVision}
- What Energises Them: ${flowState}
- Problem They Care About: ${problemCare}
- Autonomy Preference: ${conformityScale}/100

CAREER PATH CHOSEN: ${title}
WHY THIS PATH FITS THEM: ${why}

CRITICAL INSTRUCTIONS:
1. Start with TOMORROW. The first thing the user sees must be immediate action.
2. Every TOMORROW action must reference their specific vision or flow state.
3. Every check-in reflection question must reference what they told you about themselves.
4. The REALITY_CHECK must be specific to this person's profile, not generic to the career path.
5. Scale the depth of the plan to the ambition of the vision. Bigger dream = more detailed milestones.
6. TOMORROW actions must be hyper-specific. Not "research the field" but "spend 45 minutes on LinkedIn searching [specific job title] and save 5 profiles of people doing this work."

Use EXACTLY this format. No extra text. No markdown headers. No bullets except where numbered:

VISION: [Restate the user's 10-year vision in one vivid, specific sentence]
DESTINATION: [What does success look like at Year 10 for this specific path? Concrete — title, income, lifestyle]
YEAR_5_MILESTONE: [The single most important milestone at Year 5 that proves they're on track — specific and measurable]
YEAR_1_GOAL: [Where they need to be in exactly 12 months — specific role, skill level, or achievement]
MONTH_6_CHECKPOINT: [Bi-monthly check-in at Month 6 — exactly 3 reflection questions, one per line, numbered 1-3, specific to this person's vision and flow state]
MONTH_4_CHECKPOINT: [Bi-monthly check-in at Month 4 — exactly 3 reflection questions, one per line, numbered 1-3, referencing their stated problem or vision]
MONTH_2_CHECKPOINT: [Bi-monthly check-in at Month 2 — exactly 3 reflection questions, one per line, numbered 1-3, grounded in their personal context]
WEEK_5_8: [Specific tasks for weeks 5-8 — concrete with deliverables, 3-5 sentences, tied to their energising work]
WEEK_2_4: [Specific tasks for weeks 2-4 — concrete with deliverables, 3-5 sentences]
TOMORROW: [Exactly 3 hyper-specific actions for the next 24 hours, numbered 1-3, one per line, referencing their vision or flow state]
FIRST_RESOURCE: [One specific free resource — name it exactly, give the URL, explain why it is the best first step in one sentence]
REALITY_CHECK: [One honest sentence about the hardest part of this path for THIS specific person given their profile — do not sugarcoat]`;

      const userData = `10-YEAR VISION: "${tenYearVision}"
WHAT ENERGISES THEM: "${flowState}"
PROBLEM THEY CARE ABOUT: "${problemCare}"
AUTONOMY PREFERENCE: ${conformityScale}/100
PATH CHOSEN: ${title}
WHY IT FITS: ${why}
INITIAL STEPS: ${steps}
TIMELINE: ${timeline}

Reverse-engineer from the 10-year vision above. Make every section feel written for this specific person, not a generic plan for this career. Generate the complete plan now.`;

      const response = await askTheOracle(userData, {
        useHaiku: false,
        systemPrompt: systemInstructions,
        maxTokens: 4096,
      });

      const parsed = parsePlan(response);
      if (!parsed) {
        throw new Error("Could not parse action plan — please try again.");
      }

      setPlanData(parsed);
    } catch (error: any) {
      const detail = error?.message || "Unknown error";
      Alert.alert(
        "⚙️ The Mechanisms Stalled",
        `The oracle struggled to forge your path.\n\n${detail}`,
        [
          { text: "Return to Paths", onPress: () => router.back() },
          { text: "Try Again", onPress: () => generateActionPlan() },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const parsePlan = (text: string): ActionPlanData | null => {
    const lookahead = PLAN_KEYS.join("|");

    const extract = (key: string): string => {
      const re = new RegExp(
        `${key}:\\s*([\\s\\S]*?)(?=\\n(?:${lookahead}):|$)`,
      );
      const match = text.match(re);
      return match ? match[1].trim() : "";
    };

    const extractLines = (key: string): string[] =>
      extract(key)
        .split("\n")
        .map((l) =>
          l
            .replace(/^\d+[\.\)]\s*/, "")
            .replace(/^[-•]\s*/, "")
            .trim(),
        )
        .filter((l) => l.length > 0);

    const vision = extract("VISION");
    if (!vision) return null;

    return {
      vision,
      destination: extract("DESTINATION"),
      year5Milestone: extract("YEAR_5_MILESTONE"),
      year1Goal: extract("YEAR_1_GOAL"),
      month2Checkpoint: extractLines("MONTH_2_CHECKPOINT"),
      month4Checkpoint: extractLines("MONTH_4_CHECKPOINT"),
      month6Checkpoint: extractLines("MONTH_6_CHECKPOINT"),
      week24: extract("WEEK_2_4"),
      week58: extract("WEEK_5_8"),
      tomorrow: extractLines("TOMORROW"),
      firstResource: extract("FIRST_RESOURCE"),
      realityCheck: extract("REALITY_CHECK"),
    };
  };

  const handleSaveProgress = async () => {
    if (!auth.currentUser) {
      Alert.alert("Sign In Required", "Please sign in to save your progress", [
        { text: "Cancel", style: "cancel" },
        { text: "Go to Profile", onPress: () => router.push("/profile") },
      ]);
      return;
    }

    setSaving(true);
    try {
      const cleanData = JSON.parse(JSON.stringify(planData));
      if (planId) {
        await updateActionPlan(planId, cleanData);
        Alert.alert("Saved!", "Your progress has been updated.");
      } else {
        const newPlanId = await saveActionPlan({
          pathTitle,
          pathWhy: params.why as string,
          pathTimeline: params.timeline as string,
          ...(params.fortuneId ? { fortuneId: params.fortuneId as string } : {}),
          milestones: cleanData as any,
        });
        setPlanId(newPlanId);
        Alert.alert(
          "Saved!",
          "Your action plan has been saved to your brass vault.",
        );
      }
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", "Could not save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openUrl = (text: string) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      Linking.openURL(urlMatch[0]).catch(() =>
        Alert.alert("Error", "Could not open link"),
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("@/assets/animations/gears-loading.json")}
          autoPlay
          loop
          style={styles.gearAnimation}
        />
        <Text style={styles.loadingText}>
          Forging your blueprint...{"\n"}
          Reverse engineering your path...{"\n"}
          Aligning the brass mechanisms...{"\n"}
          {"\n"}
          Your plan materializes...
        </Text>
      </View>
    );
  }

  if (!planData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          ⚙️ Could not generate your plan.{"\n"}
          Please go back and try again.
        </Text>
        <Pressable
          style={styles.backButtonTop}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Return to Paths"
        >
          <Text style={styles.backButtonText}>← Return to Paths</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Back button */}
      <Pressable
        style={styles.backButtonTop}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to Fortune"
      >
        <Text style={styles.backButtonText}>← Back to Fortune</Text>
      </Pressable>

      <Text style={styles.screenTitle}>{pathTitle}</Text>

      {/* 1. Vision Header */}
      <View style={styles.visionHeader}>
        <Text style={styles.visionHeaderLabel}>🔭 YOUR DESTINATION</Text>
        <Text style={styles.visionHeaderText}>{planData.vision}</Text>
      </View>

      {/* 2. Reverse Engineering Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineCardTitle}>⚙️ Your Reverse-Engineered Route</Text>

        <View style={styles.timelineRow}>
          <View style={styles.timelineMarker}>
            <Text style={styles.timelineMarkerText}>10</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineYear}>Year 10</Text>
            <Text style={styles.timelineText}>{planData.destination}</Text>
          </View>
        </View>

        <View style={styles.timelineConnectorLine} />

        <View style={styles.timelineRow}>
          <View style={styles.timelineMarker}>
            <Text style={styles.timelineMarkerText}>5</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineYear}>Year 5</Text>
            <Text style={styles.timelineText}>{planData.year5Milestone}</Text>
          </View>
        </View>

        <View style={styles.timelineConnectorLine} />

        <View style={styles.timelineRow}>
          <View style={styles.timelineMarker}>
            <Text style={styles.timelineMarkerText}>1</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineYear}>Year 1</Text>
            <Text style={styles.timelineText}>{planData.year1Goal}</Text>
          </View>
        </View>

        <View style={styles.timelineConnectorLine} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineMarker, styles.timelineMarkerToday]}>
            <Text style={styles.timelineMarkerTodayText}>▼</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineYear, styles.timelineYearToday]}>
              TODAY
            </Text>
          </View>
        </View>
      </View>

      {/* 3. TOMORROW — Start Here */}
      <View style={styles.tomorrowCard}>
        <Text style={styles.tomorrowLabel}>⚡ START HERE — NEXT 24 HOURS</Text>
        {planData.tomorrow.map((action, i) => (
          <View key={i} style={styles.tomorrowItem}>
            <View style={styles.tomorrowBadge}>
              <Text style={styles.tomorrowBadgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.tomorrowText}>{action}</Text>
          </View>
        ))}
      </View>

      {/* 4a. Weeks 2–4 */}
      <View style={styles.weekSection}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setWeek24Open((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={week24Open ? "Collapse Weeks 2-4" : "Expand Weeks 2-4"}
        >
          <Text style={styles.sectionHeaderText}>📅 Weeks 2–4</Text>
          <Text style={styles.sectionToggle}>{week24Open ? "▲" : "▼"}</Text>
        </Pressable>
        {week24Open && (
          <View style={styles.sectionBody}>
            <Text style={styles.weekText}>{planData.week24}</Text>
          </View>
        )}
      </View>

      {/* 4b. Weeks 5–8 */}
      <View style={styles.weekSection}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setWeek58Open((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={week58Open ? "Collapse Weeks 5-8" : "Expand Weeks 5-8"}
        >
          <Text style={styles.sectionHeaderText}>📅 Weeks 5–8</Text>
          <Text style={styles.sectionToggle}>{week58Open ? "▲" : "▼"}</Text>
        </Pressable>
        {week58Open && (
          <View style={styles.sectionBody}>
            <Text style={styles.weekText}>{planData.week58}</Text>
          </View>
        )}
      </View>

      {/* 5a. Month 2 Check-In */}
      <View style={styles.checkpointSection}>
        <Pressable
          style={styles.checkpointHeader}
          onPress={() => setMonth2Open((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={month2Open ? "Collapse Month 2 Check-In" : "Expand Month 2 Check-In"}
        >
          <Text style={styles.checkpointHeaderText}>🔮 Month 2 Check-In</Text>
          <Text style={styles.sectionToggle}>{month2Open ? "▲" : "▼"}</Text>
        </Pressable>
        {month2Open && (
          <View style={styles.checkpointBody}>
            <Text style={styles.checkpointIntro}>Ask yourself:</Text>
            {planData.month2Checkpoint.map((q, i) => (
              <Text key={i} style={styles.checkpointQuestion}>
                {i + 1}. {q}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 5b. Month 4 Check-In */}
      <View style={styles.checkpointSection}>
        <Pressable
          style={styles.checkpointHeader}
          onPress={() => setMonth4Open((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={month4Open ? "Collapse Month 4 Check-In" : "Expand Month 4 Check-In"}
        >
          <Text style={styles.checkpointHeaderText}>🔮 Month 4 Check-In</Text>
          <Text style={styles.sectionToggle}>{month4Open ? "▲" : "▼"}</Text>
        </Pressable>
        {month4Open && (
          <View style={styles.checkpointBody}>
            <Text style={styles.checkpointIntro}>Ask yourself:</Text>
            {planData.month4Checkpoint.map((q, i) => (
              <Text key={i} style={styles.checkpointQuestion}>
                {i + 1}. {q}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 5c. Month 6 Check-In */}
      <View style={styles.checkpointSection}>
        <Pressable
          style={styles.checkpointHeader}
          onPress={() => setMonth6Open((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={month6Open ? "Collapse Month 6 Check-In" : "Expand Month 6 Check-In"}
        >
          <Text style={styles.checkpointHeaderText}>🔮 Month 6 Check-In</Text>
          <Text style={styles.sectionToggle}>{month6Open ? "▲" : "▼"}</Text>
        </Pressable>
        {month6Open && (
          <View style={styles.checkpointBody}>
            <Text style={styles.checkpointIntro}>Ask yourself:</Text>
            {planData.month6Checkpoint.map((q, i) => (
              <Text key={i} style={styles.checkpointQuestion}>
                {i + 1}. {q}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 6. First Resource */}
      {planData.firstResource ? (
        <Pressable
          style={styles.resourceCard}
          onPress={() => openUrl(planData.firstResource)}
          accessibilityRole="link"
          accessibilityLabel="Open first resource"
        >
          <Text style={styles.resourceLabel}>📚 Your First Resource:</Text>
          <Text style={styles.resourceText}>{planData.firstResource}</Text>
          <Text style={styles.resourceArrow}>Open →</Text>
        </Pressable>
      ) : null}

      {/* 7. Reality Check */}
      {planData.realityCheck ? (
        <View style={styles.realityCheckCard}>
          <Text style={styles.realityCheckLabel}>
            A word from your brass advisor:
          </Text>
          <Text style={styles.realityCheckText}>{planData.realityCheck}</Text>
        </View>
      ) : null}

      {/* Save button */}
      <Pressable
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={handleSaveProgress}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={planId ? "Update Progress" : "Save Action Plan"}
      >
        <Text style={styles.saveButtonText}>
          {saving
            ? "⚙️ Saving..."
            : planId
              ? "💾 Update Progress"
              : "💾 Save Action Plan"}
        </Text>
      </Pressable>
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
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1B4D5C",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  gearAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 28,
  },
  backButtonTop: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#C0C0C0",
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  // Vision header
  visionHeader: {
    backgroundColor: "#0F3040",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
  },
  visionHeaderLabel: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
  },
  visionHeaderText: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay-Bold",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 26,
    fontStyle: "italic",
  },
  // Timeline
  timelineCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  timelineCardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1B4D5C",
    borderWidth: 2,
    borderColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  timelineMarkerText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#D4AF37",
    fontFamily: "Cinzel-Bold",
  },
  timelineMarkerToday: {
    backgroundColor: "#D4AF37",
    borderColor: "#B8860B",
  },
  timelineMarkerTodayText: {
    fontSize: 14,
    color: "#1B4D5C",
    fontWeight: "bold",
  },
  timelineConnectorLine: {
    width: 2,
    height: 16,
    backgroundColor: "#D4AF37",
    marginLeft: 17,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineYear: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  timelineYearToday: {
    color: "#D4AF37",
    fontSize: 13,
    marginTop: 8,
  },
  timelineText: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 20,
  },
  // Tomorrow section
  tomorrowCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tomorrowLabel: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: "center",
  },
  tomorrowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  tomorrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  tomorrowBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1B4D5C",
    fontFamily: "Cinzel-Bold",
  },
  tomorrowText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    flex: 1,
    lineHeight: 22,
  },
  // Week sections
  weekSection: {
    backgroundColor: "#FDF6E3",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#B8860B",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#2C6B7F",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#FDF6E3",
  },
  sectionToggle: {
    fontSize: 12,
    color: "#D4AF37",
    fontWeight: "bold",
  },
  sectionBody: {
    padding: 16,
  },
  weekText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 23,
  },
  // Checkpoint sections (copper tone)
  checkpointSection: {
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#8B5A3C",
    overflow: "hidden",
  },
  checkpointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#5C3317",
  },
  checkpointHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
  },
  checkpointBody: {
    padding: 16,
    backgroundColor: "#FDF6E3",
  },
  checkpointIntro: {
    fontSize: 12,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  checkpointQuestion: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#2C2C2C",
    lineHeight: 22,
    marginBottom: 10,
    fontStyle: "italic",
  },
  // Resource card
  resourceCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  resourceLabel: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  resourceText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    lineHeight: 22,
    marginBottom: 8,
  },
  resourceArrow: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    textAlign: "right",
  },
  // Reality check
  realityCheckCard: {
    backgroundColor: "rgba(253, 246, 227, 0.08)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  realityCheckLabel: {
    fontSize: 11,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  realityCheckText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    lineHeight: 22,
    fontStyle: "italic",
  },
  // Save button
  saveButton: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
