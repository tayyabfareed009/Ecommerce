import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CartScreen() {
  const [userId, setUserId] = useState(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("id");
      setUserId(id);
      fetchCart(id);
    };
    loadUser();
  }, []);

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

const fetchCart = async (id) => {
  try {
    const baseUrl =
      Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
    const res = await fetch(`${baseUrl}/cart/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 🔥 Convert price to number
    const parsedData = data.map((item) => ({
      ...item,
      price: Number(item.price),
    }));

    setCart(parsedData);
    setTotal(calculateTotal(parsedData));
  } catch (err) {
    console.log("❌ Error fetching cart:", err);
    Alert.alert("Error fetching cart");
  }
};


  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return;
    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    setTotal(calculateTotal(updatedCart));
  };

  const removeItem = async (cartId) => {
    try {
      const baseUrl =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
      const res = await fetch(`${baseUrl}/cart/${cartId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchCart(userId);
    } catch (err) {
      console.log("❌ Error removing item:", err);
      Alert.alert("Failed to remove item");
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) return Alert.alert("⚠️ Cart is empty");
    try {
      setLoading(true);
      const baseUrl =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
      const res = await fetch(`${baseUrl}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          total_amount: total,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      Alert.alert("✅ Order placed successfully!");
      setCart([]);
      setTotal(0);
    } catch (err) {
      console.log("❌ Error placing order:", err);
      Alert.alert("❌ Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Text style={styles.removeText}>✖</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qtyRow}>
        <Text style={styles.label}>Qty:</Text>
        <TextInput
          style={styles.qtyInput}
          value={item.quantity.toString()}
          keyboardType="numeric"
          onChangeText={(text) => updateQuantity(item.id, parseInt(text) || 1)}
        />
      </View>

      <Text style={styles.priceText}>Price: ${item.price.toFixed(2)}</Text>
      <Text style={styles.subtotal}>Subtotal: ${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛒 Your Cart</Text>

      {cart.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.8 }]}
          onPress={placeOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7faff", paddingHorizontal: 15, paddingTop: 20 },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#007bff",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: { fontSize: 18, fontWeight: "600", color: "#333" },
  removeText: { color: "red", fontSize: 18, fontWeight: "bold" },
  qtyRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  label: { fontSize: 16, color: "#444" },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: "#007bff",
    width: 70,
    height: 35,
    marginLeft: 8,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    color: "#007bff",
    backgroundColor: "#f0f6ff",
  },
  priceText: { fontSize: 16, color: "#444", marginBottom: 3 },
  subtotal: { fontSize: 16, fontWeight: "600", color: "#007bff" },
  footer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 15,
    marginTop: 5,
  },
  total: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#777", fontSize: 16, marginTop: 40 },
});
