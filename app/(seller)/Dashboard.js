import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard({ navigation }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch("https://ecommerce-crxt.vercel.app/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.log("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchOrders);
    fetchOrders();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your store & orders</Text>
      </View>

      {/* Action Cards */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, styles.manageProducts]}
          onPress={() => navigation.navigate("ManageProducts")}
        >
          <Text style={styles.actionIcon}>Manage</Text>
          <Text style={styles.actionTitle}>Manage Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.addProduct]}
          onPress={() => navigation.navigate("AddProduct")}
        >
          <Text style={styles.actionIcon}>Add</Text>
          <Text style={styles.actionTitle}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.profile]}
          onPress={() => navigation.navigate("SellerProfile")}
        >
          <Text style={styles.actionIcon}>Profile</Text>
          <Text style={styles.actionTitle}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <Text style={styles.orderCount}>{orders.length} order{orders.length !== 1 ? "s" : ""}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>When customers place orders, they'll appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate("OrderDetails", { orderId: item.order_id })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.customerName}>{item.customer_name || "Customer"}</Text>
              <Text style={styles.totalAmount}>${item.total_amount}</Text>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderId}>Order #{item.order_id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status || "Pending"}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Dynamic status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered": return "#DCFCE7";
    case "shipped": return "#DBEAFE";
    case "processing": return "#FEF3C7";
    case "cancelled": return "#FEE2E2";
    default: return "#E0E7FF";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 24,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 17,
    color: "#E0F2F1",
    textAlign: "center",
    marginTop: 6,
    opacity: 0.9,
  },

  actionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: -20,
    marginBottom: 32,
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  manageProducts: { backgroundColor: "#EFF6FF" },
  addProduct: { backgroundColor: "#F0FDF4" },
  profile: { backgroundColor: "#FDF4FF" },

  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  orderCount: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },

  orderCard: {
    marginHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 14,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },
});