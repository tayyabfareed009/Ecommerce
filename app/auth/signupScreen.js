import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", address: "", role: "buyer"
  });

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleSignup = async () => {
    try {
      await api.post("/signup", form);
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("LoginScreen");
    } catch (err) {
      Alert.alert("Error", "Signup failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {["name", "email", "password", "phone", "address"].map((f) => (
        <TextInput
          key={f}
          style={styles.input}
          placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
          secureTextEntry={f === "password"}
          value={form[f]}
          onChangeText={(v) => handleChange(f, v)}
        />
      ))}

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, form.role === "buyer" && styles.selected]}
          onPress={() => handleChange("role", "buyer")}
        >
          <Text>Buyer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, form.role === "seller" && styles.selected]}
          onPress={() => handleChange("role", "seller")}
        >
          <Text>Seller</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15 },
  roleContainer: { flexDirection: "row", justifyContent: "space-around", marginVertical: 15 },
  roleButton: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  selected: { backgroundColor: "#d1e7ff" },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
