import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    role: "Customer",
  });

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem("name");
      const email = await AsyncStorage.getItem("email");
      const address = await AsyncStorage.getItem("address");
      const phone = await AsyncStorage.getItem("phone");
      const role = (await AsyncStorage.getItem("role")) || "Customer";
      setUser({ name, email, address, phone, role });
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("LoginScreen");
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  return (
    <View style={styles.container}>
      {/* Logout Icon */}
      <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
        <Icon name="logout" size={28} color="#007bff" />
      </TouchableOpacity>

      <Text style={styles.header}>👤 Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>

          {/* Edit Icon */}
          <TouchableOpacity style={styles.editIcon} onPress={handleEditProfile}>
            <Icon name="edit" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user.name || "Guest User"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#007bff" />
            <Text style={styles.infoValue}>{user.email || "Not available"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#007bff" />
            <Text style={styles.infoValue}>{user.phone || "Not provided"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-on" size={20} color="#007bff" />
            <Text style={styles.infoValue}>{user.address || "Not provided"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8ff",
    padding: 20,
    alignItems: "center",
  },
  logoutIcon: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007bff",
    marginVertical: 25,
    textShadowColor: "#cce0ff",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  profileCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eaf2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#007bff",
  },
  avatarText: {
    fontSize: 46,
    fontWeight: "bold",
    color: "#007bff",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007bff",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#007bff",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#e8f0ff",
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  roleText: {
    color: "#007bff",
    fontWeight: "600",
    fontSize: 14,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#f7faff",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#007bff",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e2e6f0",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
});
