import { API_URL } from "..config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      console.log("Sending login request to backend...");
      const response = await fetch(`${API_URL}}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Response from server:", data);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Invalid credentials");
        return;
      }

      const { token, id, role, name, address, email: userEmail } = data;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("id", id);
      await AsyncStorage.setItem("role", role);
      await AsyncStorage.setItem("name", name);
      await AsyncStorage.setItem("address", address);
      await AsyncStorage.setItem("email", userEmail);

      Alert.alert("Welcome", `Logged in as ${role}`);
      if (role === "customer") {
        navigation.navigate("BuyerTabs");
      } else if (role === "shopkeeper") {
        navigation.navigate("SellerStack");
      } else {
        Alert.alert("Error", "Unknown role. Please contact support.");
      }
    } catch (err) {
      console.log("Login error:", err);
      Alert.alert("Error", "Unable to connect to server");
    }
  };

  return (
    <View style={styles.container}>
      {/* Optional Logo – replace with your real logo later */}
      <View style={styles.logoContainer}>
        <View style={styles.logo} />
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue shopping</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignupScreen")}>
        <Text style={styles.link}>Don’t have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    // Replace with: <Image source={require('./assets/logo.png')} style={styles.logo} />
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: "#1E293B",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 40,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 17,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },

  button: {
    backgroundColor: "#0D9488",     // Premium teal – modern & trustworthy
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.3,
  },

  link: {
    textAlign: "center",
    marginTop: 28,
    color: "#0D9488",
    fontWeight: "600",
    fontSize: 16.5,
  },
});