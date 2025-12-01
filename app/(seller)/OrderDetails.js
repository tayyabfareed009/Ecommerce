import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ Custom Alert (Works on Android + iOS + Web)
const showAlert = (title, message) => {
  console.log(`Alert -> ${title}: ${message}`); // Debug log
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title, message, onConfirm) => {
  console.log(`Confirm -> ${title}: ${message}`); // Debug log
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: onConfirm },
    ]);
  }
};

export default function OrderDetails({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:5000";

  const fetchOrderDetails = async () => {
    console.log("Fetching order details for:", orderId); // Debug log
    try {
      if (!orderId) {
        setError("Invalid order ID");
        setLoading(false);
        console.error("Order ID is missing!"); // Debug log
        return;
      }

      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      console.log("Token retrieved:", token); // Debug log

      if (!token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("Order fetch response:", data); // Debug log

      if (res.ok) {
        setOrder(data);
      } else {
        setError(data.message || "Failed to load order");
        console.error("Error fetching order:", data); // Debug log
      }
    } catch (err) {
      console.error("Network or fetch error:", err);
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    console.log("Updating order status to:", newStatus); // Debug log
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Token retrieved:", token); // Debug log

      const res = await fetch(`${BASE_URL}/update-order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      console.log("Update status response:", data); // Debug log

      if (res.ok) {
        showAlert("Success", `Order marked as ${newStatus}`);
        fetchOrderDetails();
      } else {
        showAlert("Failed", data.message || "Could not update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      showAlert("Error", "Something went wrong");
    }
  };

  const handleDeleteItem = async (orderItemId) => {
    console.log("Deleting order item:", orderItemId); // Debug log
    if (!orderItemId) {
      showAlert("Error", "Invalid item ID");
      console.error("Order item ID is undefined!"); // Debug log
      return;
    }

    showConfirm("Remove Item", "Delete this product from the order?", async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token for delete request:", token); // Debug log

        const res = await fetch(`${BASE_URL}/order-item/${orderItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Delete item response:", data); // Debug log

        if (res.ok) {
          showAlert("Success", "Item removed");
          fetchOrderDetails();
        } else {
          showAlert("Error", data.message || "Failed to delete item");
        }
      } catch (err) {
        console.error("Network error deleting item:", err);
        showAlert("Error", "Network error");
      }
    });
  };

  const deleteOrder = async () => {
    console.log("Deleting order:", orderId); // Debug log
    if (!orderId) {
      showAlert("Error", "Invalid order ID");
      return;
    }

    showConfirm("Delete Order", "This action cannot be undone.", async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("Token for delete order:", token); // Debug log

        const res = await fetch(`${BASE_URL}/delete-order/${orderId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Delete order response:", data); // Debug log

        if (res.ok) {
          showAlert("Deleted", "Order removed successfully");
          navigation.goBack();
        } else {
          showAlert("Error", data.message || "Failed to delete order");
        }
      } catch (err) {
        console.error("Error deleting order:", err);
        showAlert("Error", "Failed to delete order");
      }
    });
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>Order #{order._id}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <InfoRow label="Customer" value={order.customer_name || "N/A"} />
          <InfoRow label="Email" value={order.email || "No email"} />
          <InfoRow label="Phone" value={order.phone || "No phone"} />
          <InfoRow label="Address" value={order.address || "Not provided"} />
          <InfoRow label="Total" value={`$${order.total_amount}`} bold />
          <InfoRow label="Status" value={order.status} />
        </View>

        {/* Products */}
        <Text style={styles.sectionTitle}>
          Products ({order.items?.length || 0})
        </Text>

        {order.items?.map((item, index) => (
          <View key={index} style={styles.productCard}>
            <Image source={{ uri: item.product_image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text>Qty: {item.quantity}</Text>
              <Text>Price: ${item.price}</Text>
              <Text style={{ fontSize: 12, color: "#999" }}>Item ID: {item.id}</Text>
            </View>
            {/* <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleDeleteItem(item._id)}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity> */}
          </View>
        ))}

        {/* Status Actions */}
        <View style={styles.actionsRow}>
          <ActionButton title="Delivered" color="#16A34A" onPress={() => updateOrderStatus("Delivered")} />
          <ActionButton title="Processing" color="#D97706" onPress={() => updateOrderStatus("Processing")} />
        </View>

        <View style={styles.actionsRow}>
          <ActionButton title="Shipped" color="#3B82F6" onPress={() => updateOrderStatus("Shipped")} />
          <ActionButton title="Pending" color="#6B7280" onPress={() => updateOrderStatus("Pending")} />
        </View>

        {/* Delete Order */}
        <View style={styles.deleteSection}>
          <ActionButton title="Delete Order" color="#DC2626" onPress={deleteOrder} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Small components
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ActionButton = ({ title, color, onPress }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 32, paddingBottom: 28, backgroundColor: "#0D9488", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  title: { fontSize: 34, fontWeight: "800", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 17, color: "#E0F2F1", textAlign: "center", marginTop: 8 },
  summaryCard: { marginHorizontal: 32, marginTop: -40, backgroundColor: "#fff", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#F1F5F9" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  infoLabel: { fontSize: 16, color: "#64748B" },
  infoValue: { fontSize: 16, color: "#1E293B", fontWeight: "600" },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginHorizontal: 32, marginTop: 32 },
  productCard: { marginHorizontal: 32, backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" },
  productImage: { width: 60, height: 60, borderRadius: 12, marginRight: 16 },
  productInfo: { flex: 1 },
  productName: { fontSize: 17, fontWeight: "700" },
  removeBtn: { backgroundColor: "#FEE2E2", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  removeText: { color: "#DC2626", fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 16, marginHorizontal: 32, marginTop: 20 },
  actionButton: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: "center" },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteSection: { marginHorizontal: 32, marginTop: 32 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, color: "#64748B" },
  errorText: { color: "#DC2626", textAlign: "center", fontSize: 18 },
  retryButton: { marginTop: 16, backgroundColor: "#0D9488", padding: 12, borderRadius: 12 },
  retryText: { color: "#fff", fontWeight: "700" },
});
