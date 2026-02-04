import { useFonts as useExpoFonts } from "expo-font";

export function useFonts() {
  const [fontsLoaded] = useExpoFonts({
    "PlayfairDisplay-Bold": require("../assets/fonts/PlayfairDisplay-Bold.ttf"),
    "PlayfairDisplay-Regular": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "Cinzel-Bold": require("../assets/fonts/Cinzel-Bold.ttf"),
    "Cinzel-Regular": require("../assets/fonts/Cinzel-Regular.ttf"),
    "CrimsonText-Regular": require("../assets/fonts/CrimsonText-Regular.ttf"),
    "CrimsonText-Italic": require("../assets/fonts/CrimsonText-Italic.ttf"),
  });

  return fontsLoaded;
}
