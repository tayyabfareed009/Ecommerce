import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderDetails({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:5000";

  const fetchOrderDetails = async () => {
    try {
      console.log("🟡 START fetchOrderDetails", { orderId });
      
      if (!orderId || orderId === "null" || orderId === "undefined") {
        console.log("❌ INVALID ORDER ID:", orderId);
        setError("Invalid order ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 API Response Status:", res.status);
      
      const data = await res.json();
      console.log("📦 RAW API RESPONSE DATA:", JSON.stringify(data, null, 2));
      
      if (res.ok) {
        console.log("✅ ORDER DATA VALIDATION:", {
          hasItems: !!data.items,
          itemsCount: data.items?.length || 0,
          itemsData: data.items ? data.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price
          })) : 'no items'
        });
        
        setOrder(data);
      } else {
        setError(data.message || "Failed to load order");
      }
    } catch (err) {
      console.error("❌ FETCH ORDER DETAILS ERROR:", err);
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      if (!orderId) {
        Alert.alert("Error", "Invalid order ID");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/update-order/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      
      if (res.ok) {
        Alert.alert("Success", `Order marked as ${newStatus}`);
        fetchOrderDetails();
      } else {
        Alert.alert("Failed", data.message || "Could not update status");
      }
    } catch (err) {
      console.error("❌ UPDATE ORDER STATUS ERROR:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleDeleteItem = async (orderItemId) => {
    if (!orderItemId) {
      Alert.alert("Error", "Invalid item ID");
      return;
    }

    Alert.alert("Remove Item", "Delete this product from the order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/order-item/${orderItemId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            
            if (res.ok) {
              Alert.alert("Success", "Item removed");
              fetchOrderDetails();
            } else {
              Alert.alert("Error", data.message || "Failed to delete item");
            }
          } catch (err) {
            console.error("❌ DELETE ITEM ERROR:", err);
            Alert.alert("Error", "Network error");
          }
        },
      },
    ]);
  };

  const deleteOrder = async () => {
    if (!orderId) {
      Alert.alert("Error", "Invalid order ID");
      return;
    }

    Alert.alert("Delete Order", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Order",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/delete-order/${orderId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            
            if (res.ok) {
              Alert.alert("Deleted", "Order removed successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", data.message || "Failed to delete order");
            }
          } catch (err) {
            console.error("❌ DELETE ORDER ERROR:", err);
            Alert.alert("Error", "Failed to delete order");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (orderId && orderId !== "null" && orderId !== "undefined") {
      fetchOrderDetails();
    } else {
      setError("No order ID provided");
      setLoading(false);
    }
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
        <Text style={styles.errorText}>{error || "Failed to load order details"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "#DCFCE7";
      case "shipped": return "#DBEAFE";
      case "processing": return "#FEF3C7";
      case "pending": return "#FEF3C7";
      default: return "#FEE2E2";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "#16A34A";
      case "shipped": return "#3B82F6";
      case "processing": return "#D97706";
      case "pending": return "#D97706";
      default: return "#DC2626";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>Order #{order.id || order._id}</Text>
        </View>

        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          {/* FIX: Use the correct field names from your backend response */}
          <InfoRow label="Customer" value={order.customer_name || "N/A"} />
          <InfoRow label="Email" value={order.email || "No email"} />
          <InfoRow label="Phone" value={order.phone || "No phone"} />
          <InfoRow label="Address" value={order.address || "Not provided"} />
          <InfoRow
            label="Total Amount"
            value={`$${Number(order.total_amount || 0).toFixed(2)}`}
            bold
          />
          <InfoRow
            label="Status"
            value={order.status || "Unknown"}
            badge
            bgColor={getStatusColor(order.status)}
            textColor={getStatusTextColor(order.status)}
          />
          <InfoRow
            label="Order Date"
            value={new Date(order.order_date || order.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </View>

        {/* Products Section */}
        <Text style={styles.sectionTitle}>
          Ordered Products {order.items ? `(${order.items.length})` : ''}
        </Text>

        {order.items && order.items.length > 0 ? (
          order.items.map((item, index) => {
            const itemId = item.id || item._id || `item-${index}`;
            const subtotal = (item.price || 0) * (item.quantity || 1);
            
            return (
              <View key={itemId} style={styles.productCard}>
                {/* Product Image */}
                {item.product_image ? (
                  <Image 
                    source={{ uri: item.product_image }} 
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.placeholderText}>📦</Text>
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {item.product_name || "Unnamed Product"}
                  </Text>
                  <Text style={styles.productDetail}>
                    Quantity: {item.quantity || 1}
                  </Text>
                  <Text style={styles.productDetail}>
                    Price: ${Number(item.price || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.productDetail}>
                    Subtotal: ${Number(subtotal).toFixed(2)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDeleteItem(itemId)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyText}>No items in this order</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <ActionButton
            title="Mark as Delivered"
            color="#16A34A"
            onPress={() => updateOrderStatus("Delivered")}
          />
          <ActionButton
            title="Mark as Processing"
            color="#D97706"
            onPress={() => updateOrderStatus("Processing")}
          />
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            title="Mark as Shipped"
            color="#3B82F6"
            onPress={() => updateOrderStatus("Shipped")}
          />
          <ActionButton
            title="Mark as Pending"
            color="#6B7280"
            onPress={() => updateOrderStatus("Pending")}
          />
        </View>

        {/* Delete Order */}
        <View style={styles.deleteSection}>
          <ActionButton
            title="Delete Entire Order"
            color="#DC2626"
            onPress={deleteOrder}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Reusable Components
const InfoRow = ({ label, value, bold, badge, bgColor, textColor }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {badge ? (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>{value}</Text>
      </View>
    ) : (
      <Text style={[styles.infoValue, bold && styles.boldValue]}>{value}</Text>
    )}
  </View>
);

const ActionButton = ({ title, color, onPress }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 28,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#E0F2F1",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.95,
  },
  summaryCard: {
    marginHorizontal: 32,
    marginTop: -40,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  boldValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0D9488",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginHorizontal: 32,
    marginTop: 32,
    marginBottom: 16,
  },
  productCard: {
    marginHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  placeholderText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  productDetail: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  removeText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 32,
    marginTop: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  deleteSection: {
    marginHorizontal: 32,
    marginTop: 32,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
  },
  errorText: {
    fontSize: 18,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#6B7280",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 20,
    fontStyle: "italic",
  },
  emptyProducts: {
    alignItems: "center",
    marginHorizontal: 32,
    padding: 20,
  },
});