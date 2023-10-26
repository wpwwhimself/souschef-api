import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import Recipes from "./Recipes";
import ModRecipe from "./ModRecipe";
import { ACCENT_COLOR } from "../../assets/constants";
import Icon from "react-native-vector-icons/FontAwesome5";

const Tab = createMaterialBottomTabNavigator();

export default function RecipesHub(){
  const items = [
    {
      route: "Recipes",
      component: Recipes,
      title: "Lista",
      icon: "list",
    },
    {
      route: "ModRecipe",
      component: ModRecipe,
      title: "Dodaj",
      icon: "plus",
    },
  ]

  return <Tab.Navigator barStyle={{ backgroundColor: ACCENT_COLOR }}>
    {items.map((item, key) => <Tab.Screen key={key}
      name={item.route}
      component={item.component}
      options={{
        title: item.title,
        tabBarIcon: ({color}) => <Icon name={item.icon} color={color} size={26} solid />
      }}
      />)}
  </Tab.Navigator>
}
