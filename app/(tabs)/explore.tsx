import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CareerPath, careerPaths } from "../../data/careerPaths";

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Tech",
    "Business",
    "Creative",
    "Healthcare",
    "Trades",
    "Service",
    "Education",
  ];

  const filteredPaths = careerPaths.filter((path) => {
    const matchesSearch =
      path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || path.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePathSelect = (path: CareerPath) => {
    console.log("=== PATH SELECTED ===");
    console.log("Path:", path.title);
    console.log("Steps:", path.initialSteps);

    router.push({
      pathname: "/action-plan",
      params: {
        title: path.title,
        why: path.description,
        steps: path.initialSteps.join("|||"),
        timeline: path.timeline,
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>⚙️ Career Path Library ⚙️</Text>
      <Text style={styles.subtitle}>
        Explore curated paths or get instant action plans
      </Text>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search careers..."
        placeholderTextColor="#8B8B8B"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Career Cards */}
      <View style={styles.pathsContainer}>
        {filteredPaths.map((path) => (
          <View key={path.id} style={styles.pathCard}>
            <View style={styles.pathHeader}>
              <Text style={styles.pathIcon}>{path.icon}</Text>
              <View style={styles.pathHeaderText}>
                <Text style={styles.pathTitle}>{path.title}</Text>
                <Text style={styles.pathCategory}>{path.category}</Text>
              </View>
            </View>

            <Text style={styles.pathDescription}>{path.description}</Text>

            <View style={styles.pathMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>💰 Income:</Text>
                <Text style={styles.metaValue}>
                  {path.incomeRange.split(",")[0]}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>⏱️ Timeline:</Text>
                <Text style={styles.metaValue}>{path.timeline}</Text>
              </View>
            </View>

            <View style={styles.conformityBadge}>
              <Text style={styles.conformityText}>{path.conformityLevel}</Text>
            </View>

            <Pressable
              style={styles.exploreButton}
              onPress={() => handlePathSelect(path)}
            >
              <Text style={styles.exploreButtonText}>Get Action Plan →</Text>
            </Pressable>
          </View>
        ))}
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
    marginBottom: 25,
  },
  searchInput: {
    backgroundColor: "#2C6B7F",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "CrimsonText-Regular",
    color: "#FDF6E3",
    borderWidth: 2,
    borderColor: "#8B5A3C",
    marginBottom: 20,
  },
  categoriesContainer: {
    marginBottom: 25,
    maxHeight: 50,
  },
  categoryChip: {
    backgroundColor: "#2C6B7F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#8B5A3C",
  },
  categoryChipActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#B8860B",
  },
  categoryText: {
    fontSize: 14,
    fontFamily: "Cinzel-Regular",
    color: "#FDF6E3",
  },
  categoryTextActive: {
    color: "#1B4D5C",
  },
  pathsContainer: {
    gap: 20,
  },
  pathCard: {
    backgroundColor: "#FDF6E3",
    borderRadius: 12,
    padding: 20,
    borderWidth: 3,
    borderColor: "#B8860B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  pathHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pathIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  pathHeaderText: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "PlayfairDisplay-Bold",
    color: "#1B4D5C",
  },
  pathCategory: {
    fontSize: 12,
    fontFamily: "Cinzel-Regular",
    color: "#8B5A3C",
    textTransform: "uppercase",
  },
  pathDescription: {
    fontSize: 14,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
    lineHeight: 20,
    marginBottom: 15,
  },
  pathMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: "Cinzel-Bold",
    color: "#8B5A3C",
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "CrimsonText-Regular",
    color: "#1B4D5C",
  },
  conformityBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2C6B7F",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 15,
  },
  conformityText: {
    fontSize: 11,
    fontFamily: "Cinzel-Bold",
    color: "#FDF6E3",
  },
  exploreButton: {
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#B8860B",
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Cinzel-Bold",
    color: "#1B4D5C",
  },
});
