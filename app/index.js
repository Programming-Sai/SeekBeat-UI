import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎧 SeekBeat</Text>
      <Text style={styles.subtitle}>Your music, your vibe.</Text>

      <View style={styles.buttonContainer}>
        <Link href="/library" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to Library</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/settings" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#bbbbbb",
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    minWidth: 200,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
