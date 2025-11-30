// app/(seller)/AddProduct.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dkwxr9ege/image/upload";

export default function AddProduct({ route, navigation }) {
  const editProduct = route?.params?.editProduct;

  const [product, setProduct] = useState({
    name: editProduct?.name || "",
    description: editProduct?.description || "",
    price: editProduct?.price?.toString() || "",
    category: editProduct?.category || "",
    stock: editProduct?.stock?.toString() || "",
    image_url: editProduct?.image_url || "",
  });

  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setUploading(true);

    const formData = new FormData();
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append("file", blob);
    } else {
      formData.append("file", {
        uri,
        name: "product.jpg",
        type: "image/jpeg",
      });
    }
    formData.append("upload_preset", "expo_uploads");

    try {
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();

      if (data.secure_url) {
        setProduct({ ...product, image_url: data.secure_url });
        Alert.alert("Success", "Image uploaded!");
      } else {
        Alert.alert("Error", data.error?.message || "Upload failed");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!product.name || !product.price || !product.category || !product.image_url) {
      Alert.alert("Required", "Please fill all fields and upload an image");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const url = editProduct
        ? `http://localhost:5000/update-product/${editProduct.id}`
        : "http://localhost:5000/add-product";

      const payload = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock || "0", 10),
      };

      const res = await fetch(url, {
        method: editProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert("Success", editProduct ? "Product updated!" : "Product added!");
        navigation.goBack();
      } else {
        const err = await res.text();
        Alert.alert("Error", err || "Failed to save");
      }
    } catch (err) {
      Alert.alert("Error", "Check your connection");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {editProduct ? "Edit Product" : "Add New Product"}
        </Text>
        <Text style={styles.subtitle}>
          {editProduct ? "Update product details" : "Fill in the details below"}
        </Text>
      </View>

      {/* Image Upload Section */}
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading}>
          <View style={styles.imageBox}>
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#0D9488" />
                <Text style={styles.uploadingText}>Uploading image...</Text>
              </View>
            ) : product.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.cameraIcon}>Camera</Text>
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton} onPress={pickAndUploadImage} disabled={uploading}>
          <Text style={styles.uploadButtonText}>
            {uploading ? "Uploading..." : product.image_url ? "Change Photo" : "Choose from Gallery"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        {[
          { label: "Product Name", key: "name", required: true },
          { label: "Description", key: "description", multiline: true },
          { label: "Price (₹)", key: "price", keyboardType: "numeric", required: true },
          { label: "Category", key: "category", required: true },
          { label: "Stock Quantity", key: "stock", keyboardType: "numeric" },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.input, field.multiline && styles.multilineInput]}
              value={product[field.key]}
              onChangeText={(text) => setProduct({ ...product, [field.key]: text })}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor="#94A3B8"
              keyboardType={field.keyboardType || "default"}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : 1}
            />
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>
          {editProduct ? "Update Product" : "Add Product"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    paddingBottom: 32,
    backgroundColor: "#0D9488",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: "#E0F2F1",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.95,
  },

  imageSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: -50,
    marginBottom: 32,
  },
  imageBox: {
    width: 180,
    height: 180,
    borderRadius: 28,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#0D9488",
  },

  uploadButton: {
    marginTop: 20,
    backgroundColor: "#0D9488",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  form: {
    paddingHorizontal: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 17,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    color: "#1E293B",
  },
  multilineInput: {
    height: 110,
    textAlignVertical: "top",
  },

  submitButton: {
    marginHorizontal: 32,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#0D9488",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 14,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});