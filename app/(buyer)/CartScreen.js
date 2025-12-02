import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function CartScreen() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // MODAL STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  const baseUrl ="https://ecommerce-crxt.vercel.app";

  // CUSTOM MODAL (Works on Web too!)
  const showModal = (title, message, buttons = []) => {
    setModalConfig({ title, message, buttons });
    setModalVisible(true);
  };

  const CustomModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{modalConfig.title}</Text>
          <Text style={styles.modalMessage}>{modalConfig.message}</Text>

          <View style={styles.modalButtons}>
            {modalConfig.buttons?.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalBtn,
                  btn.style === "destructive" && styles.destructiveBtn,
                  btn.style === "cancel" && styles.cancelBtn,
                  (!btn.style || btn.style === "default") && styles.primaryBtn,
                ]}
                onPress={() => {
                  setModalVisible(false);
                  btn.onPress?.();
                }}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    (!btn.style || btn.style === "default") && { color: "#fff" },
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const calculateTotal = useCallback((items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, []);

  const fetchCart = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showModal("Session Expired", "Please login again", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
        return;
      }

      const res = await fetch(`${baseUrl}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load cart");

      const data = await res.json();
      setCart(data || []);
      setTotal(calculateTotal(data || []));
    } catch (err) {
      showModal("Error", "Cannot load cart. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh cart when screen comes into focus (e.g. after adding item)
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) {
      removeItem(itemId);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${baseUrl}/cart/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });

      if (res.ok) {
        setCart((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity: newQty } : item
          )
        );
        setTotal(calculateTotal(cart));
      } else {
        showModal("Error", "Failed to update quantity");
        fetchCart();
      }
    } catch (err) {
      showModal("Network Error", "Check your connection");
      fetchCart();
    }
  };

  const removeItem = (itemId) => {
    showModal("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${baseUrl}/cart/item`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ itemId }),
            });

            if (res.ok) {
              const newCart = cart.filter((i) => i.id !== itemId);
              setCart(newCart);
              setTotal(calculateTotal(newCart));
            } else {
              showModal("Error", "Could not remove item");
            }
          } catch (err) {
            showModal("Error", "Network error");
          }
        },
      },
    ]);
  };

  const placeOrder = () => {
    if (!cart.length) {
      showModal("Empty Cart", "Add items to place an order");
      return;
    }

    showModal(
      "Confirm Order",
      `Total: ₹${total.toFixed(2)}\n\nProceed to checkout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Place Order",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const itemsToSend = cart.map((i) => ({
                product_id: i.product_id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image_url: i.image_url,
              }));

              const res = await fetch(`${baseUrl}/place-order`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  total_amount: total,
                  items: itemsToSend,
                }),
              });

              const result = await res.json();

              if (result.success) {
                showModal("Success!", "Order placed successfully!", [
                  { text: "Go Back", onPress: () => router.back() },
                ]);
                setCart([]);
                setTotal(0);
              } else {
                showModal("Failed", result.message || "Order failed");
              }
            } catch (err) {
              showModal("Error", "Check your internet connection");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>
          {cart.length} item{cart.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="cart-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Looks like you haven't added anything yet
          </Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()}>
            <Text style={styles.shopText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchCart(true);
                }}
                colors={["#0D9488"]}
              />
            }
            contentContainerStyle={{ paddingBottom: 180 }}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Image
                  source={{
                    uri: item.image_url || "https://via.placeholder.com/100",
                  }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name || "No name"}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₹{Number(item.price || 0).toFixed(2)}
                  </Text>

                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.subtotal}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.id)}
                >
                  <Icon name="trash-outline" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.checkoutBar}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={placeOrder}>
              <Text style={styles.checkoutText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <CustomModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 28,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: { fontSize: 34, fontWeight: "800", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 18, color: "#E0F2F1", textAlign: "center", marginTop: 8 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 17, color: "#64748B" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B", marginTop: 20 },
  emptyText: { fontSize: 16, color: "#64748B", textAlign: "center", marginTop: 12 },
  shopBtn: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 32,
  },
  shopText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 24,
    marginVertical: 8,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  itemImage: { width: 90, height: 90, borderRadius: 16, backgroundColor: "#F8FAFC" },
  itemInfo: { flex: 1, marginLeft: 16, justifyContent: "space-between" },
  itemName: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  itemPrice: { fontSize: 18, fontWeight: "800", color: "#0D9488" },
  quantityRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  qtyBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#0D9488",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  qtyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
  },
  subtotal: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  removeBtn: { justifyContent: "center", paddingLeft: 12 },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingBottom: 34,
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  totalLabel: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  totalAmount: { fontSize: 28, fontWeight: "800", color: "#0D9488" },
  checkoutBtn: {
    backgroundColor: "#0D9488",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 20, fontWeight: "800" },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-around" },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 100,
  },
  modalBtnText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  cancelBtn: { backgroundColor: "#94a3b8" },
  destructiveBtn: { backgroundColor: "#dc2626" },
  primaryBtn: { backgroundColor: "#0D9488" },
});