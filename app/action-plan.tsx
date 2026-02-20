import { auth } from "@/config/firebase";
import { askTheOracle } from "@/services/claude";
import {
  getActionPlanById,
  saveActionPlan,
  updateActionPlan,
} from "@/services/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Resource {
  type: "course" | "article" | "tool" | "community" | "person";
  title: string;
  url: string;
  description: string;
  estimatedTime?: string;
  cost: "free" | "paid";
}

interface Task {
  id: string;
  description: string;
  completed: boolean;
  resources?: Resource[];
}

interface Milestone {
  id: string;
  title: string;
  timeline: string;
  tasks: Task[];
}

export default function ActionPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [pathTitle, setPathTitle] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.planId) {
      loadSavedPlan(params.planId as string);
    } else {
      generateActionPlan();
    }
  }, []);

  const loadSavedPlan = async (id: string) => {
    setLoading(true);
    try {
      const plan = await getActionPlanById(id);
      if (plan) {
        setPathTitle(plan.pathTitle);
        setMilestones(plan.milestones as Milestone[]);
        setPlanId(id);
      } else {
        throw new Error("Plan not found");
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not load your saved plan: " + error.message, [
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

      setPathTitle(title);

      // Split prompt into cacheable system instructions and user data
      const systemInstructions = `You are the Dreamwright oracle creating a detailed, actionable plan.

Create a detailed action plan with 5-7 milestones. For EACH task, include 2-3 REAL, SPECIFIC resources with clickable links.

CRITICAL FORMAT - Follow this EXACTLY:

## MILESTONE 1: [Clear milestone title]
TIMELINE: [Timeframe like "Months 1-2" or "Weeks 1-4"]
TASK 1: [Specific, actionable task description]
RESOURCES:
- TYPE: course | TITLE: "Actual Course Name" | URL: https://actual-url.com | DESC: Brief helpful description | TIME: X hours | COST: free
- TYPE: community | TITLE: Specific community name | URL: https://reddit.com/r/example | DESC: What they offer | COST: free
TASK 2: [Next specific task]
RESOURCES:
- TYPE: tool | TITLE: "Actual Tool Name" | URL: https://tool-website.com | DESC: What it does | COST: free
- TYPE: article | TITLE: "Article Title" | URL: https://site.com/article | DESC: Key takeaway | TIME: 15 min | COST: free

## MILESTONE 2: [Second milestone title]
TIMELINE: [Timeframe]
TASK 1: [Task description]
RESOURCES:
- TYPE: course | TITLE: "Course Name" | URL: https://coursera.org/course | DESC: What you'll learn | TIME: 20 hours | COST: paid
- TYPE: person | TITLE: Expert Name | URL: https://linkedin.com/in/person | DESC: Why follow them | COST: free

Continue this exact pattern for 5-7 total milestones.

RESOURCE TYPE OPTIONS:
- course: Online courses (Coursera, Udemy, YouTube, edX, Khan Academy, Skillshare)
- community: Reddit, Discord, LinkedIn groups, forums
- tool: Software, apps, platforms
- article: Blog posts, guides, documentation
- person: Influencers, mentors, thought leaders to follow

CRITICAL RULES:
1. Use REAL resources that actually exist
2. EVERY resource needs a working URL (no placeholders)
3. For courses: Name real courses on real platforms
4. For communities: Use specific subreddits like r/learnprogramming
5. For tools: Name specific software (VS Code, Figma, Notion, etc.)
6. Make resources progressively more advanced
7. Mix free and paid options (prefer free when available)
8. Include TIME estimates when relevant
9. Keep DESC concise (one sentence)
10. Use ## before MILESTONE for proper formatting

Make tasks concrete, actionable, and progressively building toward the goal.`;

      const userData = `PATH CHOSEN: ${title}
WHY IT FITS: ${why}
INITIAL STEPS: ${steps}
TIMELINE: ${timeline}

Generate the complete plan with 5-7 milestones now.`;

      const response = await askTheOracle(userData, {
        useHaiku: true,
        systemPrompt: systemInstructions,
        maxTokens: 4096,
      });

      const parsedMilestones = parseActionPlan(response);

      if (parsedMilestones.length === 0) {
        throw new Error("Could not parse action plan");
      }

      setMilestones(parsedMilestones);
    } catch (error: any) {
      Alert.alert(
        "⚙️ The Mechanisms Stalled",
        "The oracle struggled to forge your path. The brass gears need realignment.",
        [
          { text: "Return to Paths", onPress: () => router.back() },
          { text: "Try Again", onPress: () => generateActionPlan() },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const parseActionPlan = (text: string): Milestone[] => {
    const milestones: Milestone[] = [];

    // Split by ## MILESTONE (Claude is using markdown headers)
    const milestoneBlocks = text.split(/(?=## MILESTONE \d+:)/);

    milestoneBlocks.forEach((block) => {
      if (!block.trim() || !block.includes("MILESTONE")) return;

      // Extract milestone title (after ## MILESTONE X:)
      const titleMatch = block.match(/## MILESTONE \d+:\s*(.+?)(?:\n|\*\*)/);

      // Extract timeline (looking for **TIMELINE: or TIMELINE:)
      const timelineMatch = block.match(
        /\*?\*?TIMELINE:\*?\*?\s*(.+?)(?:\n|$)/,
      );

      if (!titleMatch || !timelineMatch) return;

      const milestoneTitle = titleMatch[1].trim();
      const timeline = timelineMatch[1].trim();

      // Extract tasks (looking for **TASK X:** or TASK X:)
      const tasks: Task[] = [];
      const taskRegex =
        /\*?\*?TASK \d+:\*?\*?\s*(.+?)(?=\*?\*?RESOURCES:|\*?\*?TASK \d+:|## MILESTONE|$)/gs;

      let taskMatch;
      while ((taskMatch = taskRegex.exec(block)) !== null) {
        const taskDescription = taskMatch[1].trim();

        // Find the position of this task
        const taskStart = taskMatch.index;
        const nextTaskMatch = /\*?\*?TASK \d+:|## MILESTONE/.exec(
          block.substring(taskStart + taskMatch[0].length),
        );
        const taskEnd = nextTaskMatch
          ? taskStart + taskMatch[0].length + nextTaskMatch.index
          : block.length;
        const taskBlock = block.substring(taskStart, taskEnd);

        // Extract resources from this task's block
        const resources: Resource[] = [];
        const resourceRegex =
          /- TYPE:\s*(\w+)\s*\|\s*TITLE:\s*"([^"]+)"\s*\|\s*URL:\s*(\S+)\s*\|\s*DESC:\s*([^|]+?)(?:\s*\|\s*TIME:\s*([^|]+?))?(?:\s*\|\s*COST:\s*(\w+))?(?=\n-|\n\n|\*?\*?TASK|## MILESTONE|$)/gs;

        let resourceMatch;
        while ((resourceMatch = resourceRegex.exec(taskBlock)) !== null) {
          resources.push({
            type: resourceMatch[1].trim() as Resource["type"],
            title: resourceMatch[2].trim(),
            url: resourceMatch[3].trim(),
            description: resourceMatch[4].trim(),
            estimatedTime: resourceMatch[5]?.trim(),
            cost: (resourceMatch[6]?.trim() || "free") as "free" | "paid",
          });
        }

        tasks.push({
          id: `task-${Date.now()}-${Math.random()}`,
          description: taskDescription,
          completed: false,
          resources: resources.length > 0 ? resources : undefined,
        });
      }

      if (tasks.length > 0) {
        milestones.push({
          id: `milestone-${Date.now()}-${Math.random()}`,
          title: milestoneTitle,
          timeline,
          tasks,
        });
      }
    });

    return milestones;
  };

  const toggleTask = async (milestoneId: string, taskId: string) => {
    const updatedMilestones = milestones.map((milestone) => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          tasks: milestone.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task,
          ),
        };
      }
      return milestone;
    });

    setMilestones(updatedMilestones);

    // Auto-save if plan is already saved
    if (planId && auth.currentUser) {
      try {
        // Clean milestones data before saving
        const cleanMilestones = JSON.parse(JSON.stringify(updatedMilestones));
        await updateActionPlan(planId, cleanMilestones);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  };

  const getMilestoneProgress = (milestone: Milestone) => {
    const completed = milestone.tasks.filter((t) => t.completed).length;
    const total = milestone.tasks.length;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
    };
  };

  const getTotalProgress = () => {
    const allTasks = milestones.flatMap((m) => m.tasks);
    const completed = allTasks.filter((t) => t.completed).length;
    const total = allTasks.length;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
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
      // Clean milestones data - convert to plain JSON
      const cleanMilestones = JSON.parse(JSON.stringify(milestones));

      if (planId) {
        // Update existing plan
        await updateActionPlan(planId, cleanMilestones);
        Alert.alert("Saved!", "Your progress has been updated.");
      } else {
        // Save new plan
        const newPlanId = await saveActionPlan({
          pathTitle,
          pathWhy: params.why as string,
          pathTimeline: params.timeline as string,
          fortuneId: (params.fortuneId as string) || undefined,
          milestones: cleanMilestones,
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
          The oracle crafts your journey...{"\n"}
          Brass mechanisms align the milestones...{"\n"}
          Resources are being gathered...{"\n"}
          {"\n"}
          Your path materializes...
        </Text>
      </View>
    );
  }

  const totalProgress = getTotalProgress();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push("/(tabs)/questionnaire");
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Back to Fortune"
      >
        <Text style={styles.backButtonText}>← Back to Fortune</Text>
      </Pressable>

      <Text style={styles.title}>{pathTitle}</Text>

      <View style={styles.overallProgressCard}>
        <Text style={styles.overallProgressLabel}>Overall Progress</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${totalProgress.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {totalProgress.completed} of {totalProgress.total} tasks complete
        </Text>
      </View>

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

      <View style={styles.motivationCard}>
        <Text style={styles.motivationText}>
          💧 The slow drip fills the bucket.{"\n"}
          Each task brings you closer.{"\n"}
          Someone less qualified is already doing this.
        </Text>
      </View>

      {milestones.map((milestone, index) => {
        const progress = getMilestoneProgress(milestone);

        return (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneNumber}>Milestone {index + 1}</Text>
              <Text style={styles.milestoneProgress}>
                {progress.completed}/{progress.total}
              </Text>
            </View>

            <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            <Text style={styles.milestoneTimeline}>
              ⏱️ {milestone.timeline}
            </Text>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percentage}%` },
                ]}
              />
            </View>

            <View style={styles.tasksContainer}>
              {milestone.tasks.map((task) => (
                <View key={task.id} style={styles.taskContainer}>
                  <Pressable
                    style={styles.taskRow}
                    onPress={() => toggleTask(milestone.id, task.id)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={task.description}
                    accessibilityState={{ checked: task.completed }}
                  >
                    <View style={styles.checkbox}>
                      {task.completed && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.taskText,
                        task.completed && styles.taskTextCompleted,
                      ]}
                    >
                      {task.description}
                    </Text>
                  </Pressable>

                  {/* Resources Section */}
                  {task.resources && task.resources.length > 0 && (
                    <View style={styles.resourcesContainer}>
                      <Text style={styles.resourcesLabel}>📚 Resources:</Text>
                      {task.resources.map((resource, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.resourceItem}
                          onPress={() => {
                            const url = resource.url.startsWith("http")
                              ? resource.url
                              : `https://${resource.url}`;
                            Linking.openURL(url).catch(() => {
                              Alert.alert("Error", "Could not open link");
                            });
                          }}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${resource.title}`}
                        >
                          <Text style={styles.resourceIcon}>
                            {resource.type === "course"
                              ? "🎓"
                              : resource.type === "article"
                                ? "📄"
                                : resource.type === "tool"
                                  ? "🛠️"
                                  : resource.type === "community"
                                    ? "👥"
                                    : "👤"}
                          </Text>
                          <View style={styles.resourceTextContainer}>
                            <Text style={styles.resourceTitle}>
                              {resource.title}
                            </Text>
                            <Text style={styles.resourceMeta}>
                              {resource.description}
                              {resource.estimatedTime &&
                                ` • ${resource.estimatedTime}`}
                              {resource.cost === "free" && " • Free"}
                            </Text>
                          </View>
                          <Text style={styles.resourceArrow}>→</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.footerCard}>
        <Text style={styles.footerText}>
          🎪 The oracle has spoken.{"\n"}
          Your path is clear.{"\n"}
          {"\n"}
          Now: Take the first step.
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
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#C0C0C0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  overallProgressCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#D4AF37",
  },
  overallProgressLabel: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#D4AF37",
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#2C6B7F",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#8B5A3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 4,
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    marginTop: 8,
  },
  motivationCard: {
    backgroundColor: "rgba(253, 246, 227, 0.1)",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  motivationText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Italic",
    color: "#FDF6E3",
    textAlign: "center",
    lineHeight: 22,
  },
  milestoneCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  milestoneNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B5A3C",
    textTransform: "uppercase",
  },
  milestoneProgress: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#D4AF37",
  },
  milestoneProgressBar: {
    height: 8,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  milestoneProgressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 3,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
    marginBottom: 5,
  },
  milestoneTimeline: {
    fontSize: 14,
    fontFamily: "CrimsonText-Italic",
    color: "#8B5A3C",
    marginBottom: 10,
  },
  tasksContainer: {
    marginTop: 15,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D4AF37",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#D4AF37",
  },
  checkmark: {
    color: "#1B4D5C",
    fontSize: 16,
    fontWeight: "bold",
  },
  taskText: {
    fontSize: 15,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    flex: 1,
    paddingLeft: 10,
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#8B5A3C",
  },
  footerCard: {
    backgroundColor: "#2C6B7F",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  footerText: {
    fontSize: 16,
    color: "#FDF6E3",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 24,
  },
  saveButton: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
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
  taskContainer: {
    marginBottom: 12,
  },
  resourcesContainer: {
    marginLeft: 30,
    marginTop: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#D4AF37",
  },
  resourcesLabel: {
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#D4AF37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resourceTextContainer: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    marginBottom: 2,
  },
  resourceMeta: {
    fontSize: 12,
    fontFamily: "CrimsonText-Regular",
    color: "#6B4423",
  },
  resourceArrow: {
    fontSize: 18,
    color: "#D4AF37",
    marginLeft: 8,
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
