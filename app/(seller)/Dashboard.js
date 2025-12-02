import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function Dashboard({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchOrders);
    fetchOrders();
    return unsubscribe;
  }, [navigation]);

  const getStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    const pendingOrders = orders.filter(order => 
      order.status?.toLowerCase() === 'pending' || 
      order.status?.toLowerCase() === 'processing'
    ).length;
    
    return { totalOrders, totalRevenue, pendingOrders };
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your store & orders</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview - From New Version */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="bag-handle-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.statsValue}>{stats.totalOrders}</Text>
            <Text style={styles.statsLabel}>Total Orders</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="cash-outline" size={22} color="#16A34A" />
            </View>
            <Text style={styles.statsValue}>${stats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statsLabel}>Revenue</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="time-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.statsValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statsLabel}>Pending</Text>
          </View>
        </View>

        {/* Action Cards - From Previous Version but Enhanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.manageProducts]}
              onPress={() => navigation.navigate("ManageProducts")}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="cube-outline" size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionTitle}>Manage Products</Text>
              <Text style={styles.actionSubtitle}>View, edit, delete products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.addProduct]}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="add-circle-outline" size={24} color="#16A34A" />
              </View>
              <Text style={styles.actionTitle}>Add Product</Text>
              <Text style={styles.actionSubtitle}>Add new product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.profile]}
              onPress={() => navigation.navigate("SellerProfile")}
            >
              <View style={styles.actionIconContainer}>
                <Icon name="person-outline" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.actionTitle}>My Profile</Text>
              <Text style={styles.actionSubtitle}>Account settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders - Merged Best of Both */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.orderCountContainer}>
              <Text style={styles.orderCount}>{orders.length} order{orders.length !== 1 ? "s" : ""}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ManageProducts")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="document-text-outline" size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                When customers place orders, they'll appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={orders.slice(0, 5)}
              scrollEnabled={false}
              keyExtractor={(item) => item.order_id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => navigation.navigate("OrderDetails", { orderId: item.order_id })}
                >
                  <View style={styles.orderHeader}>
                    <View>
                      <Text style={styles.customerName}>{item.customer_name || "Customer"}</Text>
                      <Text style={styles.orderId}>Order #{item.order_id}</Text>
                    </View>
                    <Text style={styles.totalAmount}>${parseFloat(item.total_amount || 0).toFixed(2)}</Text>
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.orderDate}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {item.status || "Pending"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    backgroundColor: "#F8FAFC",
  },

  // Header Styles - From Previous Version
  header: {
    height: 140,
    backgroundColor: "#0D9488",
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Stats Section - From New Version
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },
  orderCountContainer: {
    alignItems: 'flex-end',
  },
  orderCount: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: "#0D9488",
    fontWeight: "600",
  },

  // Action Cards - Merged Design
  actionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  manageProducts: {
    backgroundColor: "#EFF6FF",
    borderTopWidth: 4,
    borderTopColor: "#2563EB",
  },
  addProduct: {
    backgroundColor: "#F0FDF4",
    borderTopWidth: 4,
    borderTopColor: "#16A34A",
  },
  profile: {
    backgroundColor: "#FDF4FF",
    borderTopWidth: 4,
    borderTopColor: "#7C3AED",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: 'center',
  },

  // Orders Section - Merged Design
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  orderId: {
    fontSize: 14,
    color: "#64748B",
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
  orderDate: {
    fontSize: 13,
    color: "#94A3B8",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },

  // Empty State - Merged Design
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomSpacer: {
    height: 20,
  },
});