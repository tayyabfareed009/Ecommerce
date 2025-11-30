import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

// ===== Buyer Screens =====
import CartScreen from "../(buyer)/CartScreen";
import HomeScreen from "../(buyer)/HomeScreen";
import ProductDetails from "../(buyer)/ProductDetails";
import ProfileScreen from "../(buyer)/ProfileScreen";

// ===== Seller Screens =====
import AddProduct from "../(seller)/AddProduct";
import Dashboard from "../(seller)/Dashboard";
//import ImageSelectorScreen from "../(seller)/ImageSelectorScreen";
import ManageProducts from "../(seller)/ManageProducts";
import OrderDetails from "../(seller)/OrderDetails"; // adjust path if needed
import SellerProfile from "../(seller)/SellerProfile";

// ===== Auth Screens =====
import LoginScreen from "../(auth)/LoginScreen";
import SignupScreen from "../(auth)/SignupScreen";




const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


// ==========================
// 🛒 BUYER TABS
// ==========================
function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ==========================
// 🏪 SELLER STACK
// ==========================
function SellerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="ManageProducts" component={ManageProducts} />
      <Stack.Screen name="AddProduct" component={AddProduct} />


      <Stack.Screen name="SellerProfile" component={SellerProfile} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
    </Stack.Navigator>
  );
}

// ==========================
// 🔐 MAIN APP NAVIGATION
// ==========================
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      

      {/* Buyer & Seller Routes */}
      <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
      <Stack.Screen name="SellerStack" component={SellerStack} />

      {/* Buyer extra screen */}
      <Stack.Screen name="ProductDetails" component={ProductDetails} />
    </Stack.Navigator>
  );
}
