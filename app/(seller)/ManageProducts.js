import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ManageProducts({ navigation }) {
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const baseUrl = "http://localhost:5000";

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  const openDeleteModal = (id) => {
    setProductToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${baseUrl}/delete-product/${productToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Simple success feedback can be added here if you want
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
      }
    } catch (err) {
      console.log("Delete error:", err);
    } finally {
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchProducts);
    fetchProducts();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate("AddProduct", { editProduct: item })}
        activeOpacity={0.85}
      >
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
          <View style={styles.imagePlaceholder}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.category}>{item.category || "Uncategorized"}</Text>
        <Text style={styles.stock}>
          Stock: <Text style={styles.stockBold}>{item.stock || 0}</Text>
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("AddProduct", { editProduct: item })}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => openDeleteModal(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Products</Text>
        <Text style={styles.headerSubtitle}>
          {products.length} product{products.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0D9488"]}
            tintColor="#0D9488"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptyText}>
              Start selling by adding your first product
            </Text>
            <TouchableOpacity
              style={styles.addFirstBtn}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <Text style={styles.addFirstText}>+ Add Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Custom Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Product</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone. Are you sure you want to delete this product?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={cancelDelete}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------- Existing styles + new modal styles ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 17,
    color: "#E0F2F1",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.95,
  },

  row: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    margin: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },

  image: {
    width: "100%",
    height: 140,
    backgroundColor: "#F8FAFC",
  },
  imagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },

  info: {
    padding: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
    marginTop: 4,
  },
  category: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textTransform: "capitalize",
  },
  stock: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },
  stockBold: {
    fontWeight: "700",
    color: "#1E293B",
  },

  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#0D9488",
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    alignItems: "center",
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstBtn: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  addFirstText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  /* ---------- Custom Modal Styles ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
  },
  modalDeleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});