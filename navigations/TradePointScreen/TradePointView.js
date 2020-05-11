import React, {Component} from "react";
import {Text, View, Image, Alert} from "react-native";
import {Icon, Button} from "react-native-elements";
import styles from "./styles";
import SafeAreaView from "react-native-safe-area-view";
import firebase from '../../config/firebase'
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

export default class TradePointlView extends Component {

  constructor(props) {
    super(props); 
      this.state = {
        user: {},
        rewards_code: {}
      };
      try {
        // const currentUser = firebase.auth().currentUser && firebase.auth().currentUser.displayName;
        // var db = firebase.firestore();
        // db.collection("users").where("displayName", "==", currentUser).get().then((querySnapshot) => {
        //   querySnapshot.forEach((doc) => {
        //     var userPoint = {
        //       point: doc.data().points
        //     };
        //     this.setState({ currentUserPoint: userPoint });
        //   });
        // });
        var db = firebase.firestore();
        var user = db.collection("users").doc(firebase.auth().currentUser.uid);
                user.get().then(u => {
                  if (u.exists) {
                     this.setState({user: u.data()});
                     console.log(this.state);
                    }
                });
      }
      catch (error) {
        console.log(error);
      }
    }

    updatePoint(userPoint, point, currentUser) {
        // This whole method is unbelievable messy, damn
        try {
            var db = firebase.firestore();
            const {navigation} = this.props;
            // console.log(navigation.state.params.Doc_name);
            var diff = userPoint - point;
            const newData = [];
            if (diff >= 0) {
                db.collection("rewards").doc(navigation.state.params.Doc_name).collection('codes').get().then(async (querySnapshot) => {

                    // I'm dying inside
                    const coupon_doc = await db.collection("rewards").doc(navigation.state.params.Doc_name).get();
                    const coupon = coupon_doc.data();

                    querySnapshot.forEach((doc) => {
                        const data =
                            {
                                "Name": doc._document.key.path.segments[doc._document.key.path.segments.length - 1],
                                "used": doc.data().used,
                                "url": coupon.img_url,
                                "brand": coupon.brand,
                                "redeemDate": new Date().toDateString()

                            };
                        newData.push(data);
                    });
                });

                setTimeout(() => {
                    for (let i = 0; i < newData.length; i++) {
                        if (newData[i].used === false) {
                            let reward = db.collection("rewards").doc(navigation.state.params.Doc_name).collection('codes').doc(newData[i].Name)
                            reward.get().then(
                                reward.update({
                                    used: true
                                }))

                            var user = db.collection("users").doc(firebase.auth().currentUser.uid);
                            user.get().then(
                                user.update({
                                    points: diff,
                                }))

                            var codes = db.collection("users").doc(firebase.auth().currentUser.uid).collection('codes').doc(newData[i].Name);
                            codes.get().then(
                                codes.set({
                                    code: newData[i].Name,
                                    brand: newData[i].brand,
                                    url: newData[i].url,
                                    redeemDate: newData[i].redeemDate
                                }))

                            // update point
                            db.collection("users").where("displayName", "==", currentUser).get().then((querySnapshot) => {
                                querySnapshot.forEach((doc) => {
                                    var userpoint = {
                                        point: doc.data().points
                                    };
                                    this.setState({currentUserPoint: userpoint});
                                });
                            });

                            Alert.alert(
                                'Reward code is ' + newData[i].Name
                            )
                            {
                                break;
                            }
                        } else {
                            if (newData.length === i + 1) {
                                Alert.alert(
                                    'All rewards are sold out')
                            }
                        }
                    }
                }, 2000)
            } else {
                Alert.alert(
                    'You need more points!'
                )
            }
        } catch (error) {
            console.log(error);
        }
    }

  render() {
    const { navigation } = this.props;
    const image = navigation.state.params.Img_url;
    const point = navigation.state.params.Cost;
    const currentUser = firebase.auth().currentUser && firebase.auth().currentUser.displayName;
    var userPoint = this.state.user.points;
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <TouchableWithoutFeedback onPress={() => this.props.navigation.goBack(null)}>
                <Icon
                  type="material"
                  name="keyboard-arrow-left"
                  size={30}
                  color="#fff"
                  containerStyle={styles.drawerIcon}
                />
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.textTitle}>Redeem Rewards</Text>
              </View>
            </View>
          </View>
          <View style={styles.welcomeWrapper}>
            <Text style={styles.welcomeTxt}>{this.state.user.displayName} : {this.state.user.points}</Text>
        </View>

        <View style={styles.rewardInfo}>
          <Image resizeMethod="resize" style={styles.img} source={{ uri: image }} />
        </View>

        <View style={styles.point}>
          <Button disabled={true} disabledStyle={{ backgroundColor: "white" }}
            disabledTitleStyle={{ color: "black", left: 10, fontSize: 20 }}
            title={point.toString()}
            icon={<Icon iconStyle={{ left: 10 }}
              type="font-awesome" name="star" color="#e1b225" />} />
        </View>

        <View style={styles.usePoint}>
          <Button disabled={point > userPoint} buttonStyle={{ backgroundColor: "#da272a" }}
            titleStyle={{ color: "white", fontSize: 25 }}
            title="Use your point" iconRight={true}
            onPress={() => this.updatePoint(userPoint, point, this.state.user.displayName)} />
        </View>
        </SafeAreaView>
    );
  }
}
