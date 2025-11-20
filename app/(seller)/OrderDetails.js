import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderDetails({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = "http://localhost:5000";

  // 🔹 Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please log in again");

      const res = await fetch(`${BASE_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Order details fetched:", data);
        setOrder(data);
      } else {
        Alert.alert("Error", data.message || "Failed to load order");
      }
    } catch (err) {
      console.log("Fetch error:", err);
      Alert.alert("Error", "Something went wrong while loading order");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update order status
  const updateOrderStatus = async (newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please log in again");

      const res = await fetch(`${BASE_URL}/update-order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      Alert.alert("✅ Success", `Order marked as ${newStatus}`);
      fetchOrderDetails();
    } catch (err) {
      Alert.alert("❌ Error", err.message);
    }
  };

  // 🔹 Delete single order item
  const handleDeleteItem = async (orderItemId) => {
    console.log("🗑️ Attempting to delete order item ID:", orderItemId);
    
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from the order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return Alert.alert("Error", "Please log in again");

              console.log("🔄 Sending DELETE request for item ID:", orderItemId);
              
              const res = await fetch(`${BASE_URL}/order-item/${orderItemId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Failed to delete item");

              console.log("✅ Item deleted successfully");
              Alert.alert("✅ Success", "Item removed successfully");
              fetchOrderDetails();
            } catch (err) {
              console.error("❌ Delete error:", err);
              Alert.alert("❌ Error", err.message);
            }
          },
        },
      ]
    );
  };

  // 🔹 Delete entire order
  const deleteOrder = async () => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return Alert.alert("Error", "Please log in again");

            const res = await fetch(`${BASE_URL}/delete-order/${orderId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete order");

            Alert.alert("✅ Deleted", "Order has been removed");
            navigation.goBack();
          } catch (err) {
            Alert.alert("❌ Error", err.message);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (loading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10 }}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Header */}
      <Text style={styles.header}>📦 Order Details</Text>

      {/* 🔹 Order Info Card */}
      <View style={styles.card}>
        <Info label="Order ID" value={order.id} />
        <Info label="Customer" value={order.customer_name} />
        <Info label="Address" value={order.address || "N/A"} />
        <Info
          label="Total Amount"
          value={`$${Number(order.total_amount || 0).toFixed(2)}`}
        />
        <Info
          label="Status"
          value={order.status}
          color={
            order.status === "Delivered"
              ? "#00B894"
              : order.status === "Pending"
              ? "#FFA500"
              : "#FF3B30"
          }
        />
        {order.order_date && (
          <Info 
            label="Order Date" 
            value={new Date(order.order_date).toLocaleDateString()} 
          />
        )}
      </View>

      {/* 🔹 Ordered Items */}
      <Text style={styles.subHeader}>🛍️ Ordered Products</Text>
      {order.items && order.items.length > 0 ? (
        order.items.map((item, index) => {
          // Debug: Log each item to see its structure
          console.log("🛍️ Order item structure:", item);
          
          // Use the correct ID field - try different possible field names
          const itemId = item.id || item.order_item_id || item.orderItemId;
          
          return (
            <View key={`${item.product_id}-${index}-${itemId}`} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>📦 {item.product_name}</Text>
                <Text style={styles.itemSub}>Qty: {item.quantity}</Text>
                <Text style={styles.itemSub}>
                  Price: ${Number(item.price || 0).toFixed(2)}
                </Text>
                {/* Debug info - remove in production */}
                <Text style={[styles.itemSub, { fontSize: 10, color: '#999' }]}>
                  Item ID: {itemId}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteItem(itemId)}
              >
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No products found in this order.</Text>
      )}

      {/* 🔹 Action Buttons */}
      <View style={styles.buttonRow}>
        <ActionButton
          color="#00B894"
          label="Mark as Delivered"
          onPress={() => updateOrderStatus("Delivered")}
        />
        <ActionButton
          color="#FFA500"
          label="Mark as Pending"
          onPress={() => updateOrderStatus("Pending")}
        />
      </View>

      {/* 🔹 Delete Order Button */}
      <View style={{ marginTop: 25, alignItems: "center" }}>
        <ActionButton
          color="#FF3B30"
          label="🗑 Delete Order"
          onPress={deleteOrder}
          width="80%"
        />
      </View>
    </ScrollView>
  );
}

// 🔹 Reusable Info Row
const Info = ({ label, value, color }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, color && { color }]}>{value}</Text>
  </View>
);

// 🔹 Reusable Action Button
const ActionButton = ({ label, onPress, color, width = "45%" }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, { backgroundColor: color, width }]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F4F7FE", 
    padding: 20 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#555" 
  },
  value: { 
    fontSize: 16, 
    color: "#222", 
    fontWeight: "500" 
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },
  itemSub: { 
    fontSize: 14, 
    color: "#666",
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { 
    fontSize: 16, 
    color: "#FF3B30" 
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});