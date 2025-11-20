import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Dashboard({ navigation }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const baseUrl = "http://localhost:5000"; // Update if using emulator/device
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.log("⚠️ No token found in storage");
        return;
      }

      const res = await fetch(`${baseUrl}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.log("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📦 Seller Dashboard</Text>

      {/* Navigation Buttons */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: "#007BFF" }]}
          onPress={() => navigation.navigate("ManageProducts")}
        >
          <Text style={styles.navText}>Manage Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: "#00B894" }]}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <Text style={styles.navText}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: "#0984E3" }]}
          onPress={() => navigation.navigate("SellerProfile")}
        >
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Orders Section */}
      <Text style={styles.subHeader}>Recent Orders</Text>

      <FlatList
        data={orders || []}
        keyExtractor={(item, index) =>
          (item?.order_id || item?.id || index).toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
              navigation.navigate("OrderDetails", { orderId: item.order_id })
            }
          >
            <Text style={styles.orderName}>👤 {item.customer_name}</Text>
            <Text style={styles.orderPrice}>💰 ${item.total_amount}</Text>
            <Text style={styles.orderStatus}>
              Status: <Text style={styles.statusText}>{item.status}</Text>
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recent orders found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 20,
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  navText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#007BFF",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  orderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  orderPrice: {
    fontSize: 15,
    color: "#007BFF",
    fontWeight: "600",
    marginBottom: 3,
  },
  orderStatus: {
    fontSize: 14,
    color: "#555",
  },
  statusText: {
    fontWeight: "700",
    color: "#00B894",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    fontStyle: "italic",
    marginTop: 40,
    fontSize: 16,
  },
});
