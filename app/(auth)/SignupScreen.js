import { useState } from "react";
import {
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
try {
const baseUrl = "http://localhost:5000";
const res = await fetch({baseUrl}/signup, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(user),
});

  if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
  const data = await res.json();
  alert(data.message);
  navigation.navigate("LoginScreen");
} catch (err) {
  console.log("Signup error:", err);
  alert("Signup failed! Check console for details.");
}


};

return (
<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
<Text style={styles.header}>Create Your Account</Text>

  <TextInput
    placeholder="Full Name"
    value={user.name}
    onChangeText={(text) => setUser({ ...user, name: text })}
    style={styles.input}
  />

  <TextInput
    placeholder="Email Address"
    keyboardType="email-address"
    value={user.email}
    onChangeText={(text) => setUser({ ...user, email: text })}
    style={styles.input}
  />

  <TextInput
    placeholder="Password"
    secureTextEntry
    value={user.password}
    onChangeText={(text) => setUser({ ...user, password: text })}
    style={styles.input}
  />

  <TextInput
    placeholder="Phone Number"
    keyboardType="phone-pad"
    value={user.phone}
    onChangeText={(text) => setUser({ ...user, phone: text })}
    style={styles.input}
  />

  <TextInput
    placeholder="Address"
    value={user.address}
    onChangeText={(text) => setUser({ ...user, address: text })}
    style={styles.input}
  />

  {/* Role Selection */}
  <View style={styles.roleContainer}>
    <TouchableOpacity
      style={[styles.roleBtn, user.role === "customer" && styles.selectedRole]}
      onPress={() => setUser({ ...user, role: "customer" })}
    >
      <Text style={[styles.roleText, user.role === "customer" && styles.selectedRoleText]}>
        Customer
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.roleBtn, user.role === "shopkeeper" && styles.selectedRole]}
      onPress={() => setUser({ ...user, role: "shopkeeper" })}
    >
      <Text style={[styles.roleText, user.role === "shopkeeper" && styles.selectedRoleText]}>
        Shopkeeper
      </Text>
    </TouchableOpacity>
  </View>

  <TouchableOpacity style={styles.btn} onPress={handleSignup}>
    <Text style={styles.btnText}>Sign Up</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")} style={{ marginTop: 25 }}>
    <Text style={styles.loginText}>Already have an account? Login</Text>
  </TouchableOpacity>
</ScrollView>


);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: "#f7faff",
paddingHorizontal: 20,
},
scrollContent: {
paddingBottom: 60,
},
header: {
fontSize: 30,
fontWeight: "800",
color: "#007bff",
marginTop: 40,
marginBottom: 25,
textAlign: "center",
letterSpacing: 0.5,
},
input: {
backgroundColor: "#fff",
padding: 14,
borderRadius: 12,
fontSize: 16,
marginBottom: 15,
borderWidth: 1,
borderColor: "#e0e6ed",
shadowColor: "#000",
shadowOpacity: 0.05,
shadowOffset: { width: 0, height: 2 },
shadowRadius: 3,
elevation: 2,
},
roleContainer: {
flexDirection: "row",
justifyContent: "space-between",
marginVertical: 18,
},
roleBtn: {
flex: 0.48,
borderWidth: 1.5,
borderColor: "#007bff",
borderRadius: 12,
paddingVertical: 14,
alignItems: "center",
backgroundColor: "#fff",
shadowColor: "#007bff",
shadowOpacity: 0.1,
shadowOffset: { width: 0, height: 3 },
shadowRadius: 6,
elevation: 3,
},
selectedRole: {
backgroundColor: "#007bff",
borderColor: "#007bff",
},
roleText: {
fontSize: 16,
color: "#007bff",
fontWeight: "600",
},
selectedRoleText: {
color: "#fff",
},
btn: {
backgroundColor: "#007bff",
paddingVertical: 16,
borderRadius: 12,
alignItems: "center",
marginTop: 15,
shadowColor: "#007bff",
shadowOpacity: 0.4,
shadowOffset: { width: 0, height: 5 },
shadowRadius: 10,
elevation: 6,
},
btnText: {
color: "#fff",
fontWeight: "bold",
fontSize: 18,
letterSpacing: 0.5,
},
loginText: {
color: "#007bff",
textAlign: "center",
fontWeight: "600",
fontSize: 16,
},
});