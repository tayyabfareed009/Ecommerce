import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProductDetails({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const addToCart = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("id");

      if (!token || !userId) {
        Alert.alert("⚠️ Unauthorized", "Please log in first.");
        return;
      }

      const baseUrl =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

      const res = await fetch(`${baseUrl}/add-to-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          product_id: product.id,
          quantity: parseInt(quantity),
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      Alert.alert("✅ Success", "Product added to cart!");
      navigation.goBack();
    } catch (err) {
      console.log("❌ Error adding to cart:", err);
      Alert.alert("❌ Failed", "Could not add product to cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price}</Text>
        <Text style={styles.desc}>{product.description}</Text>

        <View style={styles.qtyContainer}>
          <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyBtn}>−</Text>
          </TouchableOpacity>
          <TextInput
            value={quantity.toString()}
            keyboardType="numeric"
            onChangeText={(text) => setQuantity(Math.max(1, parseInt(text) || 1))}
            style={styles.qtyInput}
          />
          <TouchableOpacity onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.qtyBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.8 }]}
          onPress={addToCart}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Adding..." : "Add to Cart"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7faff" },
  image: {
    width: "100%",
    height: 320,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  qtyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },
  qtyBtn: {
    fontSize: 28,
    color: "#007bff",
    paddingHorizontal: 20,
    fontWeight: "bold",
  },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: "#007bff",
    borderRadius: 10,
    padding: 6,
    width: 70,
    textAlign: "center",
    fontSize: 18,
    color: "#333",
    backgroundColor: "#f9fbff",
  },
  btn: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#007bff",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 6,
    elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
