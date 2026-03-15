import { auth } from "@/config/firebase";
import { askTheAdvisor } from "@/services/claude";
import { signInAnonymously } from "firebase/auth";
import { saveFortune } from "@/services/firestore";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type LifeStage =
  | "student"
  | "early-career"
  | "career-changer"
  | "figuring-out"
  | "";

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fortune, setFortune] = useState("");
  const [parsedFortune, setParsedFortune] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [continueAnonymously, setContinueAnonymously] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Mapping your 10-year vision...",
    "Reverse engineering your path...",
    "Forging your blueprint...",
    "Almost ready...",
  ];

  useEffect(() => {
    if (!loading) return;
    setLoadingMessageIndex(0);
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  // Answer storage
  const [conformityScale, setConformityScale] = useState(50);
  const [lifeStage, setLifeStage] = useState<LifeStage>("");
  const [flowState, setFlowState] = useState("");
  const [problemCare, setProblemCare] = useState("");
  const [successDefinition, setSuccessDefinition] = useState("");
  const [tenYearVision, setTenYearVision] = useState("");

  const getScaleLabel = (value: number) => {
    if (value < 20) return "Stability & Structure";
    if (value < 40) return "Balanced with Safety Net";
    if (value < 60) return "Flexible & Adaptable";
    if (value < 80) return "Adventurous & Independent";
    return "Radically Autonomous";
  };

  const getScaleDescription = (value: number) => {
    if (value < 20) return "W-2 job • Benefits • Predictable • Suburban life";
    if (value < 40) return "Stable income • Some flexibility • Moderate risk";
    if (value < 60) return "Balance of security and freedom • Open to change";
    if (value < 80)
      return "Location independent • Unconventional • Self-directed";
    return "Complete autonomy • Adventure • Radical simplicity";
  };

  const parseFortune = (fortuneText: string) => {
    const sections = {
      greeting: "",
      paths: [] as any[],
      closing: "",
    };

    // Extract greeting
    const greetingMatch = fortuneText.match(
      /GREETING:\s*([\s\S]*?)(?=PATH 1:|$)/,
    );
    if (greetingMatch) {
      sections.greeting = greetingMatch[1].trim();
    }

    // Extract paths
    const pathPattern =
      /PATH (\d+):\s*(.*?)\s*WHY:\s*([\s\S]*?)\s*STEPS:\s*([\s\S]*?)\s*TIMELINE:\s*(.*?)\s*INCOME:\s*(.*?)\s*REAL_JOBS:\s*(.*?)\s*TOP_SKILL:\s*(.*?)\s*EYEBROW_FACTOR:\s*(.*?)(?=\s*(?:PATH \d+:|CLOSING:|$))/gi;

    let match;
    while ((match = pathPattern.exec(fortuneText)) !== null) {
      const title = match[2].trim();
      const why = match[3].trim();
      const stepsText = match[4].trim();
      const timeline = match[5].trim();
      const income = match[6].trim();
      const realJobs = match[7]
        .trim()
        .split(",")
        .map((j) => j.trim())
        .filter((j) => j.length > 0);
      const topSkill = match[8].trim();
      const eyebrowFactor = match[9].trim();

      const steps = stepsText
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((step) => step.length > 0);

      sections.paths.push({
        title,
        why,
        steps,
        timeline,
        income,
        realJobs,
        topSkill,
        eyebrowFactor,
      });
    }

    // Extract closing
    const closingMatch = fortuneText.match(/CLOSING:\s*([\s\S]*?)$/);
    if (closingMatch) {
      sections.closing = closingMatch[1].trim();
    }

    return sections;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return flowState.trim().length > 20;
      case 2:
        return problemCare.trim().length > 20;
      case 3:
        return tenYearVision.trim().length > 20;
      default:
        return false;
    }
  };

  const generateFortune = async () => {
    setLoading(true);
    try {
      // Ensure a Firebase auth session exists before calling the Cloud Function.
      // Anonymous sign-in gives the user a temporary session without requiring
      // account creation. If they later sign up, the account can be linked.
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      // Separate cacheable format instructions from user data
      const systemInstructions = `You are the Dreamwright oracle. You MUST use EXACTLY this format. No preamble. No extra text. Start immediately with "GREETING:"

Copy this structure EXACTLY:

GREETING:
[2 sentences acknowledging their 10-year vision and framing the 3 paths as reverse-engineered routes to reach it]

PATH 1: [Job title here]
WHY: [2 sentences connecting this path directly back to their 10-year vision — show how this path is the reverse-engineered route to get there]
STEPS:
1. [Concrete action with timeframe, e.g. "Week 1-2: ..."]
2. [Concrete action with timeframe]
3. [Concrete action with timeframe]
TIMELINE: [Overall time to first income]
INCOME: Year 1: $X, Year 2: $Y, Year 3+: $Z
REAL_JOBS: [Specific job title], [Specific job title], [Specific job title]
TOP_SKILL: [Single most important skill to develop first]
EYEBROW_FACTOR: Low

PATH 2: [Job title here]
WHY: [2 sentences connecting this path directly back to their 10-year vision — show how this path is the reverse-engineered route to get there]
STEPS:
1. [Concrete action with timeframe]
2. [Concrete action with timeframe]
3. [Concrete action with timeframe]
TIMELINE: [Overall time to first income]
INCOME: Year 1: $X, Year 2: $Y, Year 3+: $Z
REAL_JOBS: [Specific job title], [Specific job title], [Specific job title]
TOP_SKILL: [Single most important skill to develop first]
EYEBROW_FACTOR: Medium

PATH 3: [Job title here]
WHY: [2 sentences connecting this path directly back to their 10-year vision — show how this path is the reverse-engineered route to get there]
STEPS:
1. [Concrete action with timeframe]
2. [Concrete action with timeframe]
3. [Concrete action with timeframe]
TIMELINE: [Overall time to first income]
INCOME: Year 1: $X, Year 2: $Y, Year 3+: $Z
REAL_JOBS: [Specific job title], [Specific job title], [Specific job title]
TOP_SKILL: [Single most important skill to develop first]
EYEBROW_FACTOR: High

CLOSING:
[1 sentence with "someone less qualified"]

USE THE EXACT FORMAT ABOVE. Start with "GREETING:" - no other text before it.`;

      const userData = `===USER DATA===
Conformity: ${Math.round(conformityScale)}/100 (${getScaleLabel(conformityScale)})
Flow: "${flowState}"
Problem: "${problemCare}"
10-Year Vision: "${tenYearVision}"

The user wants to reverse engineer from their 10-year vision to today. Generate three career paths that work backwards from that vision.`;

      // Use Sonnet with cached system prompt for quality + cost savings
      const response = await askTheAdvisor(userData, {
        useHaiku: false, // Keep Sonnet for creative fortune generation
        systemPrompt: systemInstructions,
        maxTokens: 3000,
      });

      setFortune(response);
      const parsed = parseFortune(response);
      setParsedFortune(parsed);
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Fortune generation error:", error);
      // Build a human-readable message so we can diagnose what went wrong
      let detail = "Unknown error";
      if (error?.code) {
        detail = `Code: ${error.code}`;
        if (error.message) detail += `\n${error.message}`;
      } else if (error?.message) {
        detail = error.message;
      }
      Alert.alert(
        "⚙️ The Gears Have Jammed",
        `The oracle's mechanisms encountered a hiccup.\n\n${detail}\n\nPlease try again.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: generateFortune },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFortune = async () => {
    if (!auth.currentUser) {
      Alert.alert("Sign In Required", "Please sign in to save your fortune", [
        { text: "Cancel", style: "cancel" },
        { text: "Go to Profile", onPress: () => router.push("/profile") },
      ]);
      return;
    }

    setSaving(true);
    try {
      await saveFortune({
        conformityScale,
        lifeStage,
        flowState,
        problemCare,
        successDefinition,
        tenYearVision,
        fortuneText: fortune,
        parsedFortune,
      });
      Alert.alert(
        "Success!",
        "Your fortune has been saved to your brass vault.",
      );
    } catch (error: any) {
      console.error("Save fortune error:", error);
      Alert.alert("Error", "Could not save fortune: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    // STEP 0: Conformity Scale
    if (currentStep === 0) {
      return (
        <View>
          <Text style={styles.title}>The Conformity Compass</Text>
          <Text style={styles.question}>
            Where do you fall on the lifestyle spectrum?
          </Text>

          <View style={styles.scaleContainer}>
            <View style={styles.scaleHeader}>
              <Text style={styles.scaleEnd}>⚓ The Anchor</Text>
              <Text style={styles.scaleEnd}>⛰️ Into the Wild</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={conformityScale}
                onValueChange={setConformityScale}
                minimumTrackTintColor="#D4AF37"
                maximumTrackTintColor="#8B5A3C"
                thumbTintColor="#D4AF37"
              />
            </View>

            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>
                {getScaleLabel(conformityScale)}
              </Text>
              <Text style={styles.resultDescription}>
                {getScaleDescription(conformityScale)}
              </Text>
              <Text style={styles.resultValue}>
                Position: {Math.round(conformityScale)}/100
              </Text>
            </View>
          </View>

          <View style={styles.contextBox}>
            <Text style={styles.contextText}>
              This isn&apos;t about right or wrong.{"\n"}
              It&apos;s about honest self-assessment.{"\n"}
              {"\n"}
              Move the brass dial to your truth.
            </Text>
          </View>
        </View>
      );
    }

    // STEP 1: Flow State
    if (currentStep === 1) {
      return (
        <View>
          <Text style={styles.title}>What Energizes You?</Text>
          <Text style={styles.question}>
            Tell me about the last time you lost track of time doing something.
          </Text>
          <Text style={styles.subquestion}>
            (Work, hobby, side project, whatever - what were you doing?)
          </Text>

          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={8}
            value={flowState}
            onChangeText={setFlowState}
            placeholder="I was..."
            placeholderTextColor="#8B5A3C"
            textAlignVertical="top"
          />

          <View style={styles.contextBox}>
            <Text style={styles.contextText}>
              This reveals your natural talents.{"\n"}
              When do you feel most alive and capable?
            </Text>
          </View>
        </View>
      );
    }

    // STEP 2: Problem They Care About
    if (currentStep === 2) {
      return (
        <View>
          <Text style={styles.title}>What Bothers You?</Text>
          <Text style={styles.question}>
            What issue, injustice, or problem makes you think &quot;someone
            should fix this&quot;?
          </Text>

          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={8}
            value={problemCare}
            onChangeText={setProblemCare}
            placeholder="The thing that bothers me is..."
            placeholderTextColor="#8B5A3C"
            textAlignVertical="top"
          />

          <View style={styles.contextBox}>
            <Text style={styles.contextText}>
              Your impact should align with what you care about.{"\n"}
              What deserves your energy?
            </Text>
          </View>
        </View>
      );
    }

    // STEP 3: 10-Year Vision
    if (currentStep === 3) {
      return (
        <View>
          <Text style={styles.title}>Your 10-Year Vision</Text>
          <Text style={styles.question}>
            Describe your ideal life in 10 years if everything goes right.
          </Text>
          <Text style={styles.subquestion}>
            (Career, lifestyle, impact — paint the full picture. Be bold.)
          </Text>

          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={8}
            value={tenYearVision}
            onChangeText={setTenYearVision}
            placeholder="In 10 years, I am..."
            placeholderTextColor="#8B5A3C"
            textAlignVertical="top"
          />

          <View style={styles.contextBox}>
            <Text style={styles.contextText}>
              The brass mechanisms work backwards from your dream.{"\n"}
              The clearer your vision, the more precise your path.
            </Text>
          </View>
        </View>
      );
    }

    // STEP 4: Results
    if (currentStep === 4 && fortune) {
      const hasParsedPaths =
        parsedFortune && parsedFortune.paths && parsedFortune.paths.length > 0;

      if (hasParsedPaths) {
        return (
          <View>
            <Text style={styles.title}>⚙️ Your Path ⚙️</Text>

            {parsedFortune.greeting && (
              <View style={styles.greetingCard}>
                <Text style={styles.greetingText}>
                  {parsedFortune.greeting}
                </Text>
              </View>
            )}

            {parsedFortune.paths.map((path: any, index: number) => (
              <View key={index} style={styles.pathCard}>
                <View style={styles.cornerTopLeft}>
                  <Text style={styles.cornerText}>╔═</Text>
                </View>
                <View style={styles.cornerTopRight}>
                  <Text style={styles.cornerText}>═╗</Text>
                </View>
                <View style={styles.cornerBottomLeft}>
                  <Text style={styles.cornerText}>╚═</Text>
                </View>
                <View style={styles.cornerBottomRight}>
                  <Text style={styles.cornerText}>═╝</Text>
                </View>

                {tenYearVision.trim().length > 0 && (
                  <View style={styles.visionBanner}>
                    <Text style={styles.visionBannerLabel}>🔭 YOUR 10-YEAR VISION</Text>
                    <Text style={styles.visionBannerText} numberOfLines={1}>
                      &ldquo;{tenYearVision.trim().slice(0, 60)}{tenYearVision.trim().length > 60 ? "..." : ""}&rdquo;
                    </Text>
                  </View>
                )}

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

                {path.realJobs && path.realJobs.length > 0 && (
                  <View style={styles.realJobsContainer}>
                    {path.realJobs.map((job: string, jobIndex: number) => (
                      <View key={jobIndex} style={styles.realJobPill}>
                        <Text style={styles.realJobPillText}>{job}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {path.topSkill ? (
                  <View style={styles.topSkillCallout}>
                    <Text style={styles.topSkillLabel}>⚙️ Master This First:</Text>
                    <Text style={styles.topSkillText}>{path.topSkill}</Text>
                  </View>
                ) : null}

                <View style={styles.pathSection}>
                  <Text style={styles.pathSectionTitle}>Why This Works:</Text>
                  <Text style={styles.pathText}>{path.why}</Text>
                </View>

                <View style={styles.pathSection}>
                  <Text style={styles.pathSectionTitle}>Your First Steps:</Text>
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
                  onPress={() => {
                    router.push({
                      pathname: "/action-plan",
                      params: {
                        title: path.title,
                        why: path.why,
                        steps: path.steps.join("|||"),
                        timeline: path.timeline,
                        tenYearVision,
                        flowState,
                        problemCare,
                        conformityScale: String(Math.round(conformityScale)),
                      },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose path: ${path.title}`}
                >
                  <Text style={styles.choosePathText}>Reverse Engineer This Path →</Text>
                </Pressable>
              </View>
            ))}

            {parsedFortune.closing && (
              <View style={styles.closingCard}>
                <Text style={styles.closingText}>{parsedFortune.closing}</Text>
              </View>
            )}

            <Pressable
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveFortune}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save This Fortune"
            >
              <Text style={styles.saveButtonText}>
                {saving ? "⚙️ Saving..." : "💾 Save This Fortune"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.button}
              onPress={() => {
                setCurrentStep(0);
                setFortune("");
                setParsedFortune(null);
                setConformityScale(50);
                setLifeStage("");
                setFlowState("");
                setProblemCare("");
                setSuccessDefinition("");
                setTenYearVision("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Start New Discovery"
            >
              <Text style={styles.buttonText}>Start New Discovery</Text>
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to Parlor"
            >
              <Text style={styles.backButtonText}>← Back to Parlor</Text>
            </Pressable>
          </View>
        );
      } else {
        return (
          <View>
            <Text style={styles.title}>⚙️ Your Path ⚙️</Text>

            <View style={styles.fortuneCard}>
              <Text style={styles.fortuneText}>{fortune}</Text>
            </View>

            <View style={styles.contextBox}>
              <Text style={styles.contextText}>
                The oracle speaks in mysterious ways.{"\n"}
                Your paths are woven within this prophecy.
              </Text>
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveFortune}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save This Fortune"
            >
              <Text style={styles.saveButtonText}>
                {saving ? "⚙️ Saving..." : "💾 Save This Fortune"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => {
                setCurrentStep(0);
                setFortune("");
                setParsedFortune(null);
                setConformityScale(50);
                setLifeStage("");
                setFlowState("");
                setProblemCare("");
                setSuccessDefinition("");
                setTenYearVision("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Start New Discovery"
            >
              <Text style={styles.buttonText}>Start New Discovery</Text>
            </Pressable>

            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to Parlor"
            >
              <Text style={styles.backButtonText}>← Back to Parlor</Text>
            </Pressable>
          </View>
        );
      }
    }

    return null;
  };
  // Check if user is signed in
  if (!auth.currentUser && currentStep === 0 && !continueAnonymously) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>⚙️ The Advisor Awaits ⚙️</Text>
          <Text style={styles.subtitle}>
            Sign in to save your fortunes and track your progress
          </Text>

          <View style={styles.authPrompt}>
            <Pressable
              style={styles.authButton}
              onPress={() => router.push("/(tabs)/profile")}
              accessibilityRole="button"
              accessibilityLabel="Sign In or Sign Up"
            >
              <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
            </Pressable>

            <Pressable
              style={styles.continueAnonymousButton}
              onPress={() => setContinueAnonymously(true)}
              accessibilityRole="button"
              accessibilityLabel="Continue without signing in — fortunes won't be saved"
            >
              <Text style={styles.continueAnonymousText}>
                Continue without signing in{"\n"}
                (fortunes won&apos;t be saved)
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

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
          {loadingMessages[loadingMessageIndex]}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentStep < 4
            ? `Question ${currentStep + 1} of 4`
            : "Your Path"}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / 4) * 100}%` },
            ]}
          />
        </View>
      </View>

      {renderStep()}

      {currentStep < 4 && (
        <View style={styles.navigationButtons}>
          {currentStep > 0 && (
            <Pressable
              style={styles.navButton}
              onPress={() => setCurrentStep(currentStep - 1)}
              accessibilityRole="button"
              accessibilityLabel="Previous question"
            >
              <Text style={styles.navButtonText}>← Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.button, !canProceed() && styles.buttonDisabled]}
            onPress={() => {
              if (currentStep === 3) {
                generateFortune();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            disabled={!canProceed()}
            accessibilityRole="button"
            accessibilityLabel={currentStep === 3 ? "Reveal My Fortune" : "Next question"}
          >
            <Text style={styles.buttonText}>
              {currentStep === 3 ? "Reveal My Fortune" : "Next →"}
            </Text>
          </Pressable>
        </View>
      )}

      {currentStep === 0 && (
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Parlor"
        >
          <Text style={styles.backButtonText}>← Back to Parlor</Text>
        </Pressable>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#1B4D5C",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: "#C0C0C0",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#2C6B7F",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#8B5A3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 2,
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 10,
  },
  question: {
    fontSize: 18,
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    textAlign: "center",
    marginBottom: 10,
  },
  subquestion: {
    fontSize: 14,
    fontFamily: "CrimsonText-Italic",
    color: "#C0C0C0",
    textAlign: "center",
    marginBottom: 20,
  },
  scaleContainer: {
    backgroundColor: "#2C6B7F",
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
  scaleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  scaleEnd: {
    fontSize: 16,
    color: "#FDF6E3",
    fontWeight: "bold",
  },
  sliderWrapper: {
    marginBottom: 20,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  resultBox: {
    backgroundColor: "#FDF6E3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B4D5C",
    marginBottom: 5,
  },
  resultDescription: {
    fontSize: 14,
    color: "#6B4423",
    textAlign: "center",
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 12,
    color: "#8B5A3C",
    fontStyle: "italic",
  },
  contextBox: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8B5A3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  contextText: {
    fontSize: 14,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#2C6B7F",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#8B5A3C",
  },
  optionButtonSelected: {
    backgroundColor: "#D4AF37",
    borderColor: "#B8860B",
  },
  optionText: {
    fontSize: 16,
    color: "#FDF6E3",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#1B4D5C",
    fontWeight: "bold",
  },
  textArea: {
    backgroundColor: "#FDF6E3",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#B8860B",
    color: "#1B4D5C",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#2C6B7F",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5A3C",
  },
  navButtonText: {
    fontSize: 16,
    color: "#FDF6E3",
    fontWeight: "bold",
  },
  button: {
    flex: 1,
    backgroundColor: "#D4AF37",
    padding: 15,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  backButton: {
    padding: 10,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#C0C0C0",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1B4D5C",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 40,
    color: "#D4AF37",
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 28,
  },
  greetingCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  greetingText: {
    fontSize: 16,
    color: "#FDF6E3",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
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
    fontWeight: "bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
  },
  eyebrowBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#C0C0C0",
  },
  eyebrowLow: {
    backgroundColor: "#50C878",
  },
  eyebrowMedium: {
    backgroundColor: "#FFA500",
  },
  eyebrowHigh: {
    backgroundColor: "#FF6347",
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFF",
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B4D5C",
    marginBottom: 10,
  },
  realJobsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  realJobPill: {
    backgroundColor: "#1B4D5C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  realJobPillText: {
    fontSize: 12,
    color: "#D4AF37",
    fontFamily: "CrimsonText-Regular",
  },
  topSkillCallout: {
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderLeftWidth: 3,
    borderLeftColor: "#D4AF37",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  topSkillLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
    marginBottom: 3,
    fontFamily: "Cinzel-Bold",
  },
  topSkillText: {
    fontSize: 15,
    color: "#1B4D5C",
    fontFamily: "CrimsonText-Regular",
    fontWeight: "bold",
  },
  visionBanner: {
    backgroundColor: "#1B4D5C",
    borderBottomWidth: 1,
    borderBottomColor: "#D4AF37",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
    marginHorizontal: -16,
    marginTop: -16,
  },
  visionBannerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#D4AF37",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
    fontFamily: "Cinzel-Bold",
  },
  visionBannerText: {
    fontSize: 13,
    color: "#E6F4FE",
    fontFamily: "CrimsonText-Regular",
    fontStyle: "italic",
  },
  pathSection: {
    marginBottom: 15,
  },
  pathSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5A3C",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  pathText: {
    fontSize: 15,
    color: "#1B4D5C",
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#D4AF37",
    marginRight: 8,
    width: 20,
  },
  stepText: {
    fontSize: 15,
    color: "#1B4D5C",
    lineHeight: 22,
    flex: 1,
  },
  pathMeta: {
    backgroundColor: "rgba(27, 77, 92, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  metaItem: {
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#6B4423",
  },
  metaValue: {
    fontSize: 14,
    color: "#1B4D5C",
    marginTop: 2,
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
    color: "#1B4D5C",
  },
  closingCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  closingText: {
    fontSize: 15,
    color: "#FDF6E3",
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  fortuneCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
  },
  fortuneText: {
    fontSize: 15,
    color: "#1B4D5C",
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: "#50C878",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#3DA35D",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  authPrompt: {
    marginTop: 40,
  },
  authButton: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B4D5C",
  },
  continueAnonymousButton: {
    padding: 15,
    alignItems: "center",
  },
  continueAnonymousText: {
    fontSize: 14,
    color: "#C0C0C0",
    textAlign: "center",
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 16,
    color: "#FDF6E3",
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
    lineHeight: 24,
  },
  gearAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  cornerTopRight: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  cornerText: {
    fontSize: 20,
    color: "#B8860B",
    fontWeight: "bold",
  },
});
