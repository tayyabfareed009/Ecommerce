import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Signup({ navigation }) {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "customer",
  });

  const handleSignup = async () => {
    if (!user.name || !user.email || !user.password) {
      Alert.alert("Error", "Please fill name, email, and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", data.message || "Account created successfully!");
        navigation.navigate("LoginScreen");
      } else {
        Alert.alert("Signup Failed", data.message || "Please try again");
      }
    } catch (err) {
      console.log("Signup error:", err);
      Alert.alert("Network Error", "Check your connection or server");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Optional Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logo} />
      </View>

      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>Join us and start shopping today</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#94A3B8"
        value={user.name}
        onChangeText={(text) => setUser({ ...user, name: text })}
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={user.email}
        onChangeText={(text) => setUser({ ...user, email: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        value={user.password}
        onChangeText={(text) => setUser({ ...user, password: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
        value={user.phone}
        onChangeText={(text) => setUser({ ...user, phone: text })}
        style={styles.input}
      />

      <TextInput
        placeholder="Delivery Address"
        placeholderTextColor="#94A3B8"
        value={user.address}
        onChangeText={(text) => setUser({ ...user, address: text })}
        style={styles.input}
      />

      {/* Role Selection – Beautiful Pills */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, user.role === "customer" && styles.roleSelected]}
          onPress={() => setUser({ ...user, role: "customer" })}
        >
          <Text style={[styles.roleText, user.role === "customer" && styles.roleTextSelected]}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, user.role === "shopkeeper" && styles.roleSelected]}
          onPress={() => setUser({ ...user, role: "shopkeeper" })}
        >
          <Text style={[styles.roleText, user.role === "shopkeeper" && styles.roleTextSelected]}>
            Shopkeeper
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.loginLink}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 80,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    // Replace with your logo: <Image source={require('../assets/logo.png')} />
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

  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 24,
    gap: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  roleSelected: {
    backgroundColor: "#0D9488",
    borderColor: "#0D9488",
  },
  roleText: {
    fontSize: 16.5,
    fontWeight: "600",
    color: "#64748B",
  },
  roleTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  signupButton: {
    backgroundColor: "#0D9488",
    paddingVertical: 19,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 12,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  loginLink: {
    textAlign: "center",
    marginTop: 28,
    color: "#0D9488",
    fontSize: 16.5,
    fontWeight: "600",
  },
});