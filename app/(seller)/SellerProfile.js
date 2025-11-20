import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
      const storeName = await AsyncStorage.getItem("storeName");
      const totalProducts = await AsyncStorage.getItem("totalProducts");
      const rating = await AsyncStorage.getItem("rating");

      setSeller({
        name,
        email,
        address,
        phone,
        storeName,
        totalProducts: totalProducts || 0,
        rating: rating || 0,
      });
    };
    loadSeller();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("LoginScreen");
  };

  return (
    <View style={styles.container}>
      {/* Logout icon */}
      <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
        <Icon name="logout" size={28} color="#007BFF" />
      </TouchableOpacity>

      <Text style={styles.header}>👤 Seller Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {seller.name ? seller.name.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
        </View>

        <Text style={styles.name}>{seller.name || "Seller Name"}</Text>
        <Text style={styles.roleText}>Professional Seller</Text>

        <View style={styles.infoBox}>
          <Text style={styles.labelTitle}>Email</Text>
          <Text style={styles.labelValue}>{seller.email || "Not available"}</Text>

          <Text style={styles.labelTitle}>Phone</Text>
          <Text style={styles.labelValue}>{seller.phone || "Not provided"}</Text>

          <Text style={styles.labelTitle}>Address</Text>
          <Text style={styles.labelValue}>{seller.address || "Not provided"}</Text>

          <Text style={styles.labelTitle}>Store Name</Text>
          <Text style={styles.labelValue}>{seller.storeName || "N/A"}</Text>

          <Text style={styles.labelTitle}>Total Products</Text>
          <Text style={styles.labelValue}>{seller.totalProducts}</Text>

          <Text style={styles.labelTitle}>Rating</Text>
          <Text style={styles.labelValue}>
            {seller.rating} <Text style={{ color: "#FFD700" }}>⭐</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    padding: 20,
    alignItems: "center",
  },
  logoutIcon: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#007BFF",
    marginVertical: 25,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    shadowColor: "#007BFF",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#007BFF20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007BFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  roleText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 15,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#EEF3FB",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  labelTitle: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "600",
    marginTop: 10,
  },
  labelValue: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  editText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
