import React, {Component} from "react";
import {
    View, Text, Image, Modal, TouchableHighlight, Alert, Button,
    ScrollView,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {List, ListItem, Left, Body, Right} from 'native-base';
import {connect} from 'react-redux';
import {sortRewards} from '../actions/Rewards/actionCreators';
import {withNavigation, FlatList} from 'react-navigation';
import styles from '../navigations/RewardScreen/styles';
import firebase from "../config/firebase";
const db = firebase.firestore();

class RewardHistory extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            modalVisible: false,
            selectedReward: {},
            currentUser: {}
        };
    }

    async componentDidMount(){
        // Current user inside props - not sure if this is necessary though
        this.setState({ currentUser:  await firebase.auth().currentUser});

        // Load the list
        await this.loadRewards();
    }

    async loadRewards() {
        let querySnapshot = await db.collection(`users`).doc(this.state.currentUser.uid).collection(`codes`).get(), data = [];

        querySnapshot.forEach(docSnap => {
            data.push(docSnap.data());
        });

        this.setState({data});
    }

    renderStaticReward = ({item}) => (
        <ListItem style={styles.itemContainer} onPress={() => this.setModalVisible(true, item)}>
            <Left>
                <Image resizeMethod="resize" style={styles.img} source={{uri: item.url}}/>
            </Left>
            <Body style={styles.body}>
                <Text style={styles.rewardNameTxt}>{item.brand}</Text>
                <Text style={styles.dateTxt}>{item.redeemDate}</Text>
                <Icon name="keyboard-arrow-right"
                      type='material'
                      iconStyle={styles.iconAfterDate}
                      color="#c3c3c3"
                />
            </Body>
        </ListItem>
    );

    render() {
        return (
            <View style={styles.scene}>
                <ScrollView>
                    <FlatList
                        data={this.state.data}
                        renderItem={this.renderStaticReward}
                        keyExtractor={item => item.id}
                        style={styles.listContainer}
                    />
                </ScrollView>
                <Modal
                    animationType="slide"
                    visible={this.state.modalVisible}
                    onRequestClose={() => {
                        // apparently I need this for hardware back button on android
                        this.setModalVisible(false)
                    }}>

                    <View style={{margin: 50}}>
                        <Image
                            style={{height: 250, margin: 10}}
                            resizeMode='contain'
                            source={{uri: this.state.selectedReward.url}}
                        />
                        <View style={{margin: 10}}>
                            <Text style={{fontSize: 17, textAlign: 'center'}}>
                                Code to redeem at store: <Text style={{fontWeight: 'bold'}}>{this.state.selectedReward.code}</Text>
                            </Text>
                        </View>
                        <Button
                            title="Got it"
                            onPress={() => this.setModalVisible(false)}
                        />
                    </View>
                </Modal>
            </View>
        );
    }

    setModalVisible(visible, selectedReward = {}) {
        this.setState({modalVisible: visible, selectedReward});
    }
}

function mapStateToProps (state){
    return{
        navigationState: state.sortRewardsReducer,
    }; 
  }
  
  function mapDispatchToProps (dispatch)  {
    return {
        sortRewards: (index) => dispatch(sortRewards(index)),
    };
}

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(RewardHistory));
