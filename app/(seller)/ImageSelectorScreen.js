// ImageSelectorScreen.js
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const images = [
  { name: "Hoodie", uri: require("../../uploads/Hoodie.jpg") },
  { name: "hoodie2", uri: require("../../uploads/hoodie2.jpeg") },
  { name: "Nike_Shoes", uri: require("../../uploads/Nike_Shoes.jpeg") },
  { name: "Shirt1", uri: require("../../uploads/Shirt1.jpg") },
  { name: "Shirt2", uri: require("../../uploads/Shirt2.png") },
  { name: "SunGlasses", uri: require("../../uploads/SunGlasses.jpeg") },
  { name: "SunGlasses2", uri: require("../../uploads/SunGlasses2.png") },
  { name: "TransperentGlasses", uri: require("../../uploads/TransperentGlasses.png") },
];

export default function ImageSelectorScreen({ navigation, route }) {
  // ✅ REMOVED the duplicate images array inside the component

  const handleSelect = (img) => {
    // Call the callback function passed from AddProduct
    if (route.params?.onSelect) {
      route.params.onSelect(img.name);
    }

    // Go back to the previous screen
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📸 Select a Product Image</Text>
      <View style={styles.grid}>
        {images.map((img) => (
          <TouchableOpacity 
            key={img.name} 
            style={styles.card} 
            onPress={() => handleSelect(img)}
          >
            <Image source={img.uri} style={styles.image} />
            <Text style={styles.label}>{img.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc", 
    padding: 20 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "800", 
    marginBottom: 25, 
    textAlign: "center", 
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 30,
    fontWeight: "500",
  },
  grid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between",
    paddingHorizontal:5,
  },
  card: {
    height: "95%",
    width: "46%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { 
      width: 5, 
      height: 4 
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    transform: [{ scale: 1 }],
  },
  imageContainer: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  image: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 12,
  },
  label: { 
    textAlign: "center", 
    marginTop: 4, 
    fontWeight: "700", 
    color: "#1e293b",
    fontSize: 14,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  imageBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#007BFF",
  },
  // Optional: Add hover/press effect
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
  }
});