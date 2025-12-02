// app/(buyer)/ProductDetails.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ProductDetails({ route }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const addToCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please login to add items to cart", [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)/LoginScreen") },
        ]);
        return;
      }

      const baseUrl ="https://ecommerce-crxt.vercel.app";
      const res = await fetch(`${baseUrl}/add-to-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id || product._id,
          quantity: quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to add to cart");

      Alert.alert(
        "Added to Cart!",
        `${quantity} × ${product.name} added successfully`,
        [
          { text: "Continue Shopping", style: "cancel" },
          { text: "View Cart", onPress: () => router.push("/(buyer)/CartScreen") },
        ]
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = product.image_url || product.image || "https://via.placeholder.com/500";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        {/* Floating Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.productName}>{product.name || "Product Name"}</Text>
          <Text style={styles.productPrice}>
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </Text>

          {product.category && (
            <Text style={styles.category}>Category: {product.category}</Text>
          )}

          <Text style={styles.description}>
            {product.description || "No description available for this product."}
          </Text>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityPicker}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>

              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyText}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[styles.addToCartButton, loading && styles.disabledButton]}
            onPress={addToCart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.addToCartText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  imageContainer: {
    height: 420,
    backgroundColor: "#F8FAFC",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  detailsCard: {
    marginTop: -60,
    marginHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 32,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
  },

  productName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 36,
  },
  productPrice: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0D9488",
    textAlign: "center",
    marginBottom: 16,
  },
  category: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 32,
  },

  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  quantityPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0D9488",
  },
  qtyBtn: {
    width: 56,
    height: 56,
    backgroundColor: "#0D9488",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -4,
  },
  qtyDisplay: {
    width: 80,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  qtyText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
  },

  addToCartButton: {
    backgroundColor: "#0D9488",
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});