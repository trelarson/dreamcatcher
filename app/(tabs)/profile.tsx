import { auth } from "@/config/firebase";
import {
  getUserActionPlans,
  getUserFortunes,
  SavedActionPlan,
  SavedFortune,
} from "@/services/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [fortunes, setFortunes] = useState<SavedFortune[]>([]);
  const [loadingFortunes, setLoadingFortunes] = useState(false);
  const [actionPlans, setActionPlans] = useState<SavedActionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadFortunes();
      } else {
        setFortunes([]);
      }
    });

    return unsubscribe;
  }, []);
  // Reload fortunes when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadFortunes();
        loadActionPlans();
      }
    }, [user]),
  );

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created! You are now signed in.", [
          { text: "OK", onPress: () => router.push("/(tabs)/questionnaire") },
        ]);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Signed in successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Don't navigate - just dismiss alert
            },
          },
        ]);
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Signed out successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };
  const loadFortunes = async () => {
    setLoadingFortunes(true);
    try {
      const userFortunes = await getUserFortunes();
      setFortunes(userFortunes);
    } catch (error) {
      console.error("Error loading fortunes:", error);
    } finally {
      setLoadingFortunes(false);
    }
  };
  const loadActionPlans = async () => {
    setLoadingPlans(true);
    try {
      const plans = await getUserActionPlans();
      setActionPlans(plans);
    } catch (error) {
      console.error("Error loading action plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  if (user) {
    // User is signed in
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>⚙️ Your Brass Nameplate ⚙️</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Signed in as:</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Saved Fortunes</Text>

          {loadingFortunes ? (
            <Text style={styles.comingSoon}>Loading fortunes...</Text>
          ) : fortunes.length === 0 ? (
            <Text style={styles.comingSoon}>
              No fortunes saved yet.{"\n"}
              Complete a divination to save your first fortune!
            </Text>
          ) : (
            <View>
              <Text style={styles.fortuneCount}>
                {fortunes.length} fortune{fortunes.length !== 1 ? "s" : ""} in
                your vault
              </Text>
              {fortunes.map((fortune, index) => (
                <Pressable
                  key={fortune.id}
                  style={styles.fortuneItem}
                  onPress={() => {
                    // Check if we have parsed paths
                    if (
                      fortune.parsedFortune?.paths &&
                      fortune.parsedFortune.paths.length > 0
                    ) {
                      // Navigate to a new screen that shows the 3 paths
                      router.push({
                        pathname: "/fortune-paths",
                        params: {
                          fortuneId: fortune.id || "",
                          fortuneText: fortune.fortuneText,
                          paths: JSON.stringify(fortune.parsedFortune.paths),
                          greeting: fortune.parsedFortune.greeting || "",
                          closing: fortune.parsedFortune.closing || "",
                        },
                      });
                    } else {
                      // Fallback to text viewer if no paths
                      router.push({
                        pathname: "/fortune-viewer",
                        params: {
                          fortuneText: fortune.fortuneText,
                          date:
                            fortune.createdAt?.toDate().toLocaleDateString() ||
                            "Unknown date",
                        },
                      });
                    }
                  }}
                >
                  <Text style={styles.fortuneDate}>
                    {fortune.createdAt?.toDate().toLocaleDateString()}
                  </Text>
                  <Text style={styles.fortunePreview} numberOfLines={2}>
                    {fortune.fortuneText.substring(0, 100)}...
                  </Text>
                  <Text style={styles.tapToView}>Tap to view →</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Action Plans Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Action Plans</Text>

          {loadingPlans ? (
            <Text style={styles.comingSoon}>Loading plans...</Text>
          ) : actionPlans.length === 0 ? (
            <Text style={styles.comingSoon}>
              No action plans yet.{"\n"}
              Choose a path from your fortune to create one!
            </Text>
          ) : (
            <View>
              <Text style={styles.fortuneCount}>
                {actionPlans.length} plan{actionPlans.length !== 1 ? "s" : ""}{" "}
                in progress
              </Text>
              {actionPlans.map((plan) => {
                const totalTasks = plan.milestones.reduce(
                  (sum, m) => sum + m.tasks.length,
                  0,
                );
                const completedTasks = plan.milestones.reduce(
                  (sum, m) => sum + m.tasks.filter((t) => t.completed).length,
                  0,
                );
                const progress =
                  totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0;

                return (
                  <Pressable
                    key={plan.id}
                    style={styles.fortuneItem}
                    onPress={() => {
                      router.push({
                        pathname: "/action-plan",
                        params: {
                          planId: plan.id,
                          title: plan.pathTitle,
                        },
                      });
                    }}
                  >
                    <Text style={styles.fortuneDate}>
                      {plan.createdAt?.toDate().toLocaleDateString()}
                    </Text>
                    <Text style={styles.pathTitle}>{plan.pathTitle}</Text>
                    <View style={styles.progressIndicator}>
                      <View style={styles.progressBarSmall}>
                        <View
                          style={[
                            styles.progressFillSmall,
                            { width: `${progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {progress}% complete
                      </Text>
                    </View>
                    <Text style={styles.tapToView}>Tap to continue →</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <Pressable
          style={styles.backToQuestionnaire}
          onPress={() => router.push("/(tabs)/questionnaire")}
        >
          <Text style={styles.backToQuestionnaireText}>
            ← Back to Fortune Parlor
          </Text>
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // User is not signed in
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>
        {isSignUp ? "🎪 Join the Parlor 🎪" : "🎪 Enter the Parlor 🎪"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>
          {isSignUp
            ? "Create an account to save your fortunes"
            : "Sign in to access your saved fortunes"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8B5A3C"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8B5A3C"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "⚙️ Processing..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? "Already have an account? Sign In"
              : "Need an account? Sign Up"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.contextBox}>
        <Text style={styles.contextText}>
          Your fortunes are precious.{"\n"}
          The oracle keeps them safe for your return.
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#1B4D5C",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#8B5A3C",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    marginBottom: 10,
  },
  comingSoon: {
    fontSize: 15,
    color: "#6B4423",
    fontStyle: "italic",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#D4AF37",
    color: "#1B4D5C",
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B4D5C",
  },
  switchButton: {
    padding: 10,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: "#1B4D5C",
    textDecorationLine: "underline",
  },
  signInText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  signInButton: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  signOutButton: {
    backgroundColor: "#8B5A3C",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#6B4423",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#FFF",
  },
  contextBox: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  contextText: {
    fontSize: 14,
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  fortuneCount: {
    fontSize: 14,
    color: "#8B5A3C",
    marginBottom: 15,
    fontWeight: "bold",
  },
  fortuneItem: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  fortuneDate: {
    fontSize: 12,
    color: "#8B5A3C",
    marginBottom: 5,
    fontWeight: "bold",
  },
  fortunePreview: {
    fontSize: 14,
    color: "#1B4D5C",
    fontStyle: "italic",
  },
  tapToView: {
    fontSize: 12,
    color: "#D4AF37",
    marginTop: 4,
    fontStyle: "italic",
  },
  backToQuestionnaire: {
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  backToQuestionnaireText: {
    fontSize: 16,
    color: "#C0C0C0",
  },
  authButton: {
    backgroundColor: "#D4AF37",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  aauthButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
  progressIndicator: {
    marginTop: 8,
    marginBottom: 4,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: "#E8E8E8",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFillSmall: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "CrimsonText-Regular",
    color: "#8B5A3C",
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
    marginBottom: 4,
  },
});
