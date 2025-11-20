import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen({ navigation }) {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {
if (!email || !password) {
Alert.alert("Error", "Please fill in all fields");
return;
}

try {
  console.log("📤 Sending login request to backend...");
  const response = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  console.log("📥 Response from server:", data);

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
  console.log("❌ Login error:", err);
  Alert.alert("Error", "Unable to connect to server");
}


};

return (
<View style={styles.container}>
<Text style={styles.title}>Welcome Back</Text>
<Text style={styles.subtitle}>Login to your account</Text>

  <TextInput
    style={styles.input}
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
  />

  <TextInput
    style={styles.input}
    placeholder="Password"
    secureTextEntry
    value={password}
    onChangeText={setPassword}
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
justifyContent: "center",
paddingHorizontal: 25,
backgroundColor: "#f7faff",
},
title: {
fontSize: 30,
fontWeight: "800",
textAlign: "center",
color: "#007bff",
marginBottom: 5,
},
subtitle: {
fontSize: 16,
textAlign: "center",
color: "#5a6c8f",
marginBottom: 30,
},
input: {
backgroundColor: "#fff",
borderRadius: 12,
paddingVertical: 14,
paddingHorizontal: 15,
marginBottom: 18,
fontSize: 16,
borderWidth: 1,
borderColor: "#e0e6ed",
shadowColor: "#000",
shadowOpacity: 0.05,
shadowOffset: { width: 0, height: 2 },
shadowRadius: 3,
elevation: 2,
},
button: {
backgroundColor: "#007bff",
paddingVertical: 16,
borderRadius: 12,
alignItems: "center",
marginTop: 5,
shadowColor: "#007bff",
shadowOpacity: 0.4,
shadowOffset: { width: 0, height: 5 },
shadowRadius: 10,
elevation: 6,
},
buttonText: {
color: "#fff",
fontWeight: "bold",
fontSize: 18,
letterSpacing: 0.5,
},
link: {
textAlign: "center",
marginTop: 20,
color: "#007bff",
fontWeight: "600",
fontSize: 16,
},
});