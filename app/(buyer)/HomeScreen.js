import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log("📤 Fetching products...");

      const baseURL =
        Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

      const response = await fetch(`${baseURL}/products`);
      const data = await response.json();
      console.log("📥 Raw products data:", data);

      // Normalize response to an array
      const productsArray = Array.isArray(data) ? data : data?.products || [];
      
      // Log each product to see the exact structure
      productsArray.forEach((product, index) => {
        console.log(`📦 Product ${index}:`, {
          name: product.name,
          image: product.image,
          imageFieldNames: Object.keys(product).filter(key => 
            key.toLowerCase().includes('image') || 
            key.toLowerCase().includes('img') ||
            key.toLowerCase().includes('photo')
          )
        });
      });
      
      // Normalize image URLs - handle different field names
      const normalizedProducts = productsArray.map(product => {
        // Try to find the image field - could be 'image', 'img', 'imageUrl', etc.
        const imageField = Object.keys(product).find(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('img')
        );
        
        const imageValue = imageField ? product[imageField] : product.image;
        const normalizedImage = normalizeImageUrl(imageValue, baseURL);
        
        console.log(`🖼️ Normalized "${product.name}":`, {
          originalField: imageField,
          originalValue: imageValue,
          normalized: normalizedImage
        });
        
        return {
          ...product,
          image: normalizedImage
        };
      });
      
      setProducts(normalizedProducts);
    } catch (err) {
      console.log("❌ Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize image URLs
  const normalizeImageUrl = (imagePath, baseURL) => {
    // If no image path or it's null/undefined, return null (will show placeholder)
    if (!imagePath) {
      return null;
    }
  
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path starting with /, construct full URL
    if (imagePath.startsWith('/')) {
      return `${baseURL}${imagePath}`;
    }
    
    // If it's just a filename, try the most common path
    return `${baseURL}/images/${imagePath}`;
  };

  const handleImageError = (productId, imageUrl) => {
    console.log(`❌ Image failed to load for product ${productId}: ${imageUrl}`);
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛍️ Our Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => {
          const key = item?.id ?? item?._id ?? item?.productId ?? Math.random().toString();
          return key.toString();
        }}
        renderItem={({ item }) => {
          const productId = item?.id ?? item?._id ?? item?.productId ?? Math.random().toString();
          const hasImageError = imageErrors[productId];
          const hasImage = item?.image && !hasImageError;
          
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ProductDetails", { product: item })}
            >
              {hasImage ? (
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.productImage} 
                  resizeMode="cover"
                  onError={() => handleImageError(productId, item.image)}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>📷 No Image</Text>
                </View>
              )}
              <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {item?.name ?? "Unnamed Product"}
                </Text>
                <Text style={styles.price}>
                  {typeof item?.price === "number" ? `$${item.price.toFixed(2)}` : item?.price ?? "—"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available.</Text>
            <TouchableOpacity onPress={fetchProducts} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007bff",
    marginBottom: 15,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7faff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#5a6c8f",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    marginVertical: 8,
    padding: 12,
    shadowColor: "#007bff",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  productImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },
  placeholderImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "500",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  price: {
    fontSize: 17,
    fontWeight: "700",
    color: "#007bff",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#6B6F76",
    fontSize: 16,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});