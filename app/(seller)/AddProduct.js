import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddProduct({ route, navigation }) {
  const editProduct = route?.params?.editProduct;
  const selectedImage = route?.params?.selectedImage;

  const [product, setProduct] = useState(
    editProduct || {
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      image_url: "",
    }
  );

  // ✅ Update image when returning from selector
  useEffect(() => {
    if (selectedImage) {
      setProduct((prev) => ({ ...prev, image_url: selectedImage }));
    }
  }, [selectedImage]);

  // ✅ Built-in local images mapping
  const localImages = {
    Hoodie: require("../../uploads/Hoodie.jpg"),
    hoodie2: require("../../uploads/hoodie2.jpeg"),
    Nike_Shoes: require("../../uploads/Nike_Shoes.jpeg"),
    Shirt1: require("../../uploads/Shirt1.jpg"),
    Shirt2: require("../../uploads/Shirt2.png"),
    SunGlasses: require("../../uploads/SunGlasses.jpeg"),
    SunGlasses2: require("../../uploads/SunGlasses2.png"),
    TransperentGlasses: require("../../uploads/TransperentGlasses.png"),
  };

  // 💾 Save product to backend
  const handleSubmit = async () => {
    if (!product.name || !product.price || !product.category) {
      Alert.alert("⚠️ Missing fields", "Please fill in all required fields.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Unauthorized", "Please log in first.");
        return;
      }

      const baseUrl = "http://localhost:5000";
      const endpoint = editProduct
        ? `${baseUrl}/update-product/${editProduct.id}`
        : `${baseUrl}/add-product`;
      const method = editProduct ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text || "Failed to save product");

      Alert.alert(
        "✅ Success",
        editProduct
          ? "Product updated successfully!"
          : "Product added successfully!"
      );
      navigation.goBack();
    } catch (error) {
      console.log("❌ Error adding product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    }
  };

  // 🖼️ Navigate to image selector
  const handleSelectImage = () => {
    navigation.navigate("ImageSelectorScreen", {
      onSelect: (selectedImageName) => {
        setProduct((prev) => ({ ...prev, image_url: selectedImageName }));
      },
    });
  };

  // 🖼️ Render image preview safely
  const renderImagePreview = () => {
    if (product.image_url && localImages[product.image_url]) {
      return (
        <Image
          source={localImages[product.image_url]}
          style={styles.imagePreview}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={styles.noImageContainer}>
        <Text style={styles.noImageIcon}>🖼️</Text>
        <Text style={styles.noImageText}>No image selected</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>
        {editProduct ? "✏️ Edit Product" : "➕ Add Product"}
      </Text>

      {/* 🔹 Image Preview and Select Button */}
      <View style={styles.imageSection}>
        <View style={styles.imagePreviewBox}>
          {renderImagePreview()}
        </View>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={handleSelectImage}
        >
          <Text style={styles.selectBtnText}>
            {product.image_url ? "Change Image" : "Select Image"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Input Fields */}
      {[
        { key: "name", placeholder: "Product Name", required: true },
        { key: "description", placeholder: "Description", required: false },
        { key: "price", placeholder: "Price", required: true, keyboardType: "numeric" },
        { key: "category", placeholder: "Category", required: true },
        { key: "stock", placeholder: "Stock Quantity", required: false, keyboardType: "numeric" },
      ].map((field) => (
        <View key={field.key}>
          <TextInput
            placeholder={field.placeholder + (field.required ? " *" : "")}
            value={String(product[field.key] || "")}
            onChangeText={(text) => setProduct({ ...product, [field.key]: text })}
            style={styles.input}
            keyboardType={field.keyboardType || "default"}
          />
        </View>
      ))}

      {/* 🔹 Submit Button */}
      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>
          {editProduct ? "Update Product" : "Add Product"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f9ff", 
  },
  contentContainer: {
    padding: 20,
  },
  header: { 
    fontSize: 24, 
    fontWeight: "800", 
    textAlign: "center", 
    marginBottom: 25, 
    color: "#007BFF" 
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreviewBox: {
    borderRadius: 15,
    width: 180,
    height: 180,
    backgroundColor: "#fff",
    borderColor: "#007BFF33",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 4,
    overflow: "hidden",
  },
  imagePreview: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 15 
  },
  noImageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  noImageIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  noImageText: { 
    color: "#007BFF", 
    fontWeight: "600",
    textAlign: "center",
  },
  selectBtn: { 
    backgroundColor: "#00BFFF", 
    paddingVertical: 12, 
    paddingHorizontal: 24,
    borderRadius: 10, 
    alignItems: "center",
    minWidth: 150,
  },
  selectBtnText: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 16,
  },
  input: { 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#E0E0E0", 
    padding: 12, 
    marginBottom: 12, 
    borderRadius: 10, 
    fontSize: 16 
  },
  btn: { 
    backgroundColor: "#007BFF", 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 10,
    marginBottom: 20,
  },
  btnText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "700" 
  },
});