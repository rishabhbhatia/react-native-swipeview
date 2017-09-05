import React, {Component} from 'react';
import { StyleSheet, Text, View } from 'react-native';

import SwipeView from 'react-native-swipeview';

export default class App extends Component {

  render() {

    return (
      <View style={styles.container}>
        <SwipeView
          renderVisibleContent={() => <Text style={styles.text}>SwipeMe</Text>}
        />
      </View>
    );
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    backgroundColor: 'whitesmoke',
    padding: 20,
  }
});
