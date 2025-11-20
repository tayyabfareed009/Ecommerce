import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManageProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const baseUrl = "http://localhost:5000"; // 👈 change to your backend if needed (e.g., your LAN IP)

  // ==================== FETCH PRODUCTS ====================
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("token"); // get JWT token

      const res = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: `Bearer ${token}`, // attach token
        },
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  // ==================== DELETE PRODUCT ====================
  const deleteProduct = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${baseUrl}/delete-product/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      Alert.alert("Deleted", "🗑️ Product deleted successfully!");
      fetchProducts(); // refresh list
    } catch (err) {
      console.log("Error deleting product:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==================== RENDER PRODUCT CARD ====================
  const renderItem = ({ item }) => {
  console.log("Image URL:", item.image_url); // 🪄 Add this line here

  return (
    <View style={styles.card}>
      {item.image_url ? (
        <Image
          source={{
            uri: item.image_url.startsWith("http")
              ? item.image_url
              : `${baseUrl}/${item.image_url}`,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ color: "#aaa" }}>No Image</Text>
        </View>
      )}

      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text style={styles.category}>{item.category || "Uncategorized"}</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("AddProduct", { editProduct: item })}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.delBtn}
          onPress={() => deleteProduct(item.id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  // ==================== MAIN UI ====================
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧾 Manage Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30, color: "#666" }}>
            No products available.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  name: { fontSize: 18, fontWeight: "600", marginTop: 6 },
  price: { fontSize: 16, color: "#28a745", fontWeight: "bold" },
  category: { fontSize: 14, color: "#555", marginBottom: 5 },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  editBtn: { backgroundColor: "#17A2B8", padding: 8, borderRadius: 6, flex: 1, marginRight: 5 },
  delBtn: { backgroundColor: "#DC3545", padding: 8, borderRadius: 6, flex: 1, marginLeft: 5 },
  btnText: { color: "white", fontWeight: "bold", textAlign: "center" },
});