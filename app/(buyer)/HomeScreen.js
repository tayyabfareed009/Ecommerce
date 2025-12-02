import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] =  useState([]);
  const [filteredProducts, setFilteredProducts] =  useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");

  const baseURL = "https://ecommerce-crxt.vercel.app";

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseURL}/products`);
      const data = await response.json();
      const productsArray = Array.isArray(data) ? data : data?.products || [];

      const normalized = productsArray.map((p) => {
        const imageField = Object.keys(p).find((k) =>
          /image|img|photo/i.test(k)
        );
        const img = imageField ? p[imageField] : p.image;
        const imageUrl = img
          ? img.startsWith("http")
            ? img
            : img.startsWith("/")
            ? `${baseURL}${img}`
            : `${baseURL}/images/${img}`
          : null;

        return { ...p, image: imageUrl };
      });

      setProducts(normalized);
      setFilteredProducts(normalized);
    } catch (err) {
      console.log("Fetch error:", err);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedTag === "All") {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)) &&
          (p.name?.toLowerCase().includes(selectedTag.toLowerCase()) ||
            p.category?.toLowerCase().includes(selectedTag.toLowerCase()) ||
            p.tags?.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase())))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products, selectedTag]);

  const onRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    setSelectedTag("All");
    fetchProducts();
  };

  const searchTags = [
    "All",
    "Wallet",
    "Shirt",
    "Jeans",
    "Glasses",
    "Shoes",
    "Watch",
    "Bag",
    "T-Shirt",
    "Jacket",
    "Electronics",
    "Accessories"
  ];

  const handleTagPress = (tag) => {
    setSelectedTag(tag);
    if (tag === "All") {
      setSearchQuery("");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Discover amazing products...</Text>
      </View>
    );
  }

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate("ProductDetails", { product: item })}
      activeOpacity={0.9}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name || "Unnamed Product"}
        </Text>
        <Text style={styles.productPrice}>
          ${typeof item.price === "number" ? item.price.toFixed(2) : item.price || "0.00"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTag = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.tag,
        selectedTag === item && styles.tagSelected
      ]}
      onPress={() => handleTagPress(item)}
    >
      <Text
        style={[
          styles.tagText,
          selectedTag === item && styles.tagTextSelected
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shop Now</Text>
        <Text style={styles.subtitle}>Find your perfect style</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={22} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close-circle" size={22} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Tags */}
      <View style={styles.tagsSection}>
        <Text style={styles.tagsTitle}>Categories</Text>
        <FlatList
          data={searchTags}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tagsContainer}
          renderItem={renderTag}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0D9488"]} />
        }
        ListHeaderComponent={
          <Text style={styles.resultsText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            {selectedTag !== "All" && ` in "${selectedTag}"`}
            {searchQuery && ` for "${searchQuery}"`}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedTag !== "All" ? "No products found" : "No products available"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `Try searching for "${searchTags[1]}" or "${searchTags[2]}"`
                : selectedTag !== "All"
                ? `Try selecting "All" categories`
                : "Check back later for new arrivals!"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.productsContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: "#E0F2F1",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.95,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 32,
    marginTop: -20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#1E293B",
  },

  tagsSection: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 10,
  },
  tagsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  tagsContainer: {
    paddingVertical: 4,
  },
  tag: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 40,
    justifyContent: 'center',
  },
  tagSelected: {
    backgroundColor: "#0D9488",
    borderColor: "#0D9488",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  tagText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 14,
    textAlign: 'center',
  },
  tagTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  row: {
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },

  resultsText: {
    fontSize: 14,
    color: "#64748B",
    paddingHorizontal: 32,
    paddingVertical: 16,
    paddingBottom: 8,
  },

  productsContainer: {
    paddingBottom: 30,
  },

  productCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    margin: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  productImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#F8FAFC",
  },
  placeholderImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0D9488",
    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: "#64748B",
    fontWeight: "600",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
});