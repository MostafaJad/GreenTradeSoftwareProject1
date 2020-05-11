import React, { Component, useState } from "react";
import {AsyncStorage} from 'react-native';  
import { Text, Alert, TextInput, TouchableOpacity, View, Button, show, Platform, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { colors, Icon } from "react-native-elements";
import DateTimePicker from "react-native-modal-datetime-picker";
import { Keyboard } from 'react-native';
import styles from "./styles";
import SafeAreaView from "react-native-safe-area-view";
import moment from 'moment';
import firebase from '../../config/firebase';
const db = firebase.firestore();

export default class Scheduling extends Component {
  constructor(props) {
    super(props);
    // 10 days
    const maxDateOffsetinMilli = 10 * 24 * 60 * 60 * 1000;
    this.state = {
      userDisplayName: '',
      date: new Date(),
      maxDate: new Date(Date.now() + maxDateOffsetinMilli),
      message: "Lets Schedule It",
      user: '',
      isVisible: false,
      dateTimestamp: null,
      chosenDate: '',
      additionalInfo: '',
      collectPersonId: '',
      collectorperson: '',
      address: {},
      userprofilePicUrl: '',
    };
  }

  //for keyboard dismissing
  componentDidMount() {
    const { navigation } = this.props;
    // refresh screen after purchasing new containers
    navigation.addListener('willFocus', () => {
      this.setState({ chosenDate: '', dateTimestamp: null, additionalInfo: ''});
    });
    // Need to get actual display name saved in firestore and not with firebase auth
    this.getUserDisplayName();
  }

  getUserDisplayName = () => {
    db.collection('users')
      .doc(firebase.auth().currentUser.uid)
      .get()
      .then((doc) => {
        this.setState({ userDisplayName: doc.data().displayName });
      });
  }

  //for handling date and time
  handlePicker = (datetime) => {
    this.setState({
      isVisible: false,
      chosenDate: moment(datetime).format('MMMM, Do YYYY HH:mm'),
      dateTimestamp: datetime,
    });
    //setting up the pickup randomly
    this.assignPickup();
  }

  handleInfo = (text) => {
    this.setState({

      additionalInfo: text
    })
    
  }


  showPicker = () => {
    this.setState({
      isVisible: true
    })
  }

  hidePicker = () => {
    
    this.setState({
      isVisible: false

    })
  }


  //method for assigningpicker
  assignPickup(){
    //random collector
    let collectorreferenceurl= db.collection("users");
    var collectorsavailable=[];
    let queryref= collectorreferenceurl.where('type', '==', 'collector').get()
      .then( snapshot=> {
        if(snapshot.empty){
          console.log("No matching Collector");
          return;
        }
        
        snapshot.forEach( doc=> {
          collectorsavailable.push(doc.data());
          var randomcollector = collectorsavailable[Math.floor(Math.random() * collectorsavailable.length)];
          var randomcollectoruid= randomcollector.uid;
          this.setState({ collectorperson: randomcollector.displayName , collectPersonId: randomcollectoruid});
        })
      })
      .catch( err=> {
        console.log("Error getting collectors", err);
      })


      var user = firebase.auth().currentUser;

    var useraddressdetailsref= db.collection("users").doc(`${user.uid}`);
    var useraddressdetails= useraddressdetailsref.get()
      .then ( doc=> {
        if (!doc.exists){
          console.log("No users found");
        }
        else{
          this.setState({ address: doc.data().address, userprofilePicUrl: doc.data().profilePhoto});
        }
      })
      .catch( err => console.log("error getting users", err));
  }

   //storing the value and passing to db
   async handlePress() {
    if( this.state.chosenDate==="" ){
        Alert.alert('Please Choose a Date and Time '+this.state.userDisplayName);
    }
    else{
      

      var clientPickUpsRef = db.collection(`users/${firebase.auth().currentUser.uid}/pickups`).doc();
      var pickUpsRef = db.collection('pickups').doc(clientPickUpsRef.id);

      let batch = db.batch();

      // write to client's pickups collection
      batch.set(clientPickUpsRef, {
         scheduledTime: firebase.firestore.Timestamp.fromDate(this.state.dateTimestamp), 
         additionalInfo: this.state.additionalInfo, 
         collectorName: this.state.collectorperson,
         collectorId: this.state.collectPersonId,
         fulfilledTime: null,
      });

      // write to pickups collection
      batch.set(pickUpsRef, {
        memberId: firebase.auth().currentUser.uid, 
        memberName: this.state.userDisplayName, 
        address: {  
          street: this.state.address.street, 
          city: this.state.address.city, 
          province: this.state.address.province, 
          postalCode: this.state.address.postalCode }, 
        memberProfilePicURL: this.state.userprofilePicUrl, 
        scheduledTime: firebase.firestore.Timestamp.fromDate(this.state.dateTimestamp), 
        additionalInfo: this.state.additionalInfo,
        cancelled: false, 
        collectorId: this.state.collectPersonId, 
        collectorName: this.state.collectorperson,
        fulfilledTime: null,
      });

      await batch.commit();
    // var user = firebase.auth().currentUser;
    // var userRef = db.collection(`users/${user.unpmid}/pickups`);

    // var pickupRef= db.collection('pickups');

    // var realUser= firebase.auth().currentUser.uid;
    // var userName= firebase.auth().currentUser.displayName;

    // await Promise.all ( [pickupRef.add({ user: realUser, address: this.state.address, userProfilePicURL: this.state.userprofilePicUrl, scheduledtime: this.state.chosenDate , additionalInfo: this.state.additionalInfo,cancelled: false, collectorid: this.state.collectPersonId , collector: this.state.collectorperson ,customerName: userName, fulfilledAt: null})],
    //   [userRef.add({ scheduledtime: this.state.chosenDate, additionalInfo: this.state.additionalInfo, pickupby: this.state.collectorperson ,fulfilledtime: null})]);
    
   //await userRef.add({ scheduledtime: this.state.chosenDate, additionalInfo: this.state.additionalInfo, pickupby: this.state.collectorperson ,fulfilledtime: null}); 
    Alert.alert('Scheduling successful!', `Thank you ${this.state.userDisplayName}!\nWe will pick up your recycling on ${this.state.chosenDate}.`);
    this.props.navigation.goBack(null);
    }
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
            <TouchableWithoutFeedback onPress={() => this.props.navigation.openDrawer()}>
							<Icon
								type="material"
								name="menu"
								size={30}
								color="#fff"
								containerStyle={styles.drawerIcon}
							/>
							</TouchableWithoutFeedback>
            </View>
            <View style={styles.titleWrapper}>
              <Text style={styles.textTitle}>Scheduling Pickup</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, alignContent: "center" }}>
          <View style={{ flex: 1, backgroundColor: '#DAE0E2', alignContent: "center", alignItems: "center" }} >
            <Text style={{ height: 80, padding: 60, fontSize: 22 }} >Welcome Back {firebase.auth().currentUser && this.state.userDisplayName}</Text>

          </View>
          <View style={{ flex: 2, backgroundColor: '#DAE0E2', padding: 20, alignItems: "center", alignContent: "center" }} >

            <Text style={{ height: 80, padding: 10, fontSize: 20, alignItems: "center" }} >{this.state.message}</Text>
            <Button title="Choose your Date and Time" onPress={this.showPicker} />
            <DateTimePicker
              isVisible={this.state.isVisible}
              onConfirm={this.handlePicker}
              onCancel={this.hidePicker}
              minimumDate={this.state.date}
              maximumDate={this.state.maxDate}
              mode={"datetime"}

            />
            <Text style={{ color: 'red', fontSize: 20 }}>{this.state.chosenDate}</Text>
            <TextInput
              onSubmitEditing={Keyboard.dismiss}
              editable={true}
              maxLength={100}
              multiline={true}
              placeholder="Additional Info"
              margin="10%"
              numberOfLines={3}
              onEndEditing={this.clear}
              onChangeText={this.handleInfo}
              value={this.state.additionalInfo}
              returnKeyType={'default'}
              style={{ fontSize: 20 }}
            />

          </View>

          <View style={{ flex: 3, backgroundColor: '#DAE0E2' }} >
            <Button title="Confirm" onPress={() => this.handlePress()} styles={{ justifyContent: 'center' }} />
          </View>
            
        </View >
      </SafeAreaView>
    );
  }
}