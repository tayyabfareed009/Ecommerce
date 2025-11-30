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

export default function SellerProfile({ navigation }) {
  const [seller, setSeller] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    storeName: "",
    totalProducts: 0,
    rating: 0,
  });

  useEffect(() => {
    const loadSeller = async () => {
      const name = await AsyncStorage.getItem("name");
      const email = await AsyncStorage.getItem("email");
      const address = await AsyncStorage.getItem("address");
      const phone = await AsyncStorage.getItem("phone");
      const storeName = await AsyncStorage.getItem("storeName") || "My Store";
      const totalProducts = await AsyncStorage.getItem("totalProducts") || "0";
      const rating = await AsyncStorage.getItem("rating") || "4.8";

      setSeller({
        name: name || "Seller Name",
        email: email || "seller@example.com",
        address: address || "Not provided",
        phone: phone || "Not provided",
        storeName,
        totalProducts: parseInt(totalProducts),
        rating: parseFloat(rating).toFixed(1),
      });
    };
    loadSeller();
  }, []);

  const handleLogout = async () => {
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

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {seller.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Name & Role */}
        <Text style={styles.name}>{seller.name}</Text>
        <Text style={styles.role}>Professional Seller</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{seller.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{seller.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Info List */}
        <View style={styles.infoContainer}>
          <InfoRow icon="person" label="Store Name" value={seller.storeName} />
          <InfoRow icon="email" label="Email" value={seller.email} />
          <InfoRow icon="phone" label="Phone" value={seller.phone} />
          <InfoRow icon="location-on" label="Address" value={seller.address} />
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton}>
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
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoutBtn: {
    position: "absolute",
    right: 32,
    top: 64,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
  },

  profileCard: {
    marginHorizontal: 32,
    marginTop: -50,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 32,
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

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#FFFFFF",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: "800",
    color: "#0D9488",
  },

  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  role: {
    fontSize: 17,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 24,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginBottom: 28,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0D9488",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#BBF7D0",
  },

  infoContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
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
    marginLeft: 12,
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