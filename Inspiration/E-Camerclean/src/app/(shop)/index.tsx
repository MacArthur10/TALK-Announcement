import { FlatList, StyleSheet, Text, View } from 'react-native'

import { PRODUCTS } from '../../../assets/products';
import {ProductListItem} from "../../components/product-list-item";
import {listHeader} from "../../components/list-header";
import Auth from '../auth';

const Home = () => {
  return (
    // <Auth />
    <View>
      <FlatList 
      data={PRODUCTS} 
      renderItem={({ item }) => <ProductListItem product={item} />}
      keyExtractor={item => item.id.toString()}
      numColumns={2}
      ListHeaderComponent={listHeader}
      contentContainerStyle={styles.floatListContent}
      columnWrapperStyle={styles.floatlistcolumn}
      style={{ paddingHorizontal: 10, paddingVertical:5}}
      />
    </View>
  );
};

export default Home

const styles = StyleSheet.create({
  floatListContent: {
    paddingBottom: 30,
  },
  floatlistcolumn: {
    justifyContent: 'space-between',
  },

 
});