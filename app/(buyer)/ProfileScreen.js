import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
      const name = await AsyncStorage.getItem("name") || "Guest User";
      const email = await AsyncStorage.getItem("email") || "Not available";
      const address = await AsyncStorage.getItem("address") || "Not provided";
      const phone = await AsyncStorage.getItem("phone") || "Not provided";
      const role = (await AsyncStorage.getItem("role")) || "Customer";

      setUser({ name, email, address, phone, role });
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace("LoginScreen");
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Floating Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar with Edit Button */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEditProfile}>
            <Icon name="edit" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Name & Role */}
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>

        {/* Info List */}
        <View style={styles.infoContainer}>
          <InfoRow icon="email" label="Email" value={user.email} />
          <InfoRow icon="phone" label="Phone" value={user.phone} />
          <InfoRow icon="location-on" label="Address" value={user.address} />
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Reusable Info Row
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Icon name={icon} size={22} color="#0D9488" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: "relative",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoutBtn: {
    position: "absolute",
    right: 32,
    top: 64,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
  },

  profileCard: {
    marginHorizontal: 32,
    marginTop: -60,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 24,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#FFFFFF",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  avatarText: {
    fontSize: 60,
    fontWeight: "800",
    color: "#0D9488",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 8,
    right: 0,
    backgroundColor: "#0D9488",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  name: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
  },
  roleText: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "700",
  },

  infoContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
    marginLeft: 14,
  },
  infoValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },

  editButton: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});