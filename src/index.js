'use strict';

import React, {Component} from 'react';
import {Animated, PanResponder, Platform, StyleSheet, TouchableOpacity, View} from 'react-native';

import PropTypes from 'prop-types';

/**
 * react-native-swipeview
 * @author rishabhbhatia<rishabh.bhatia08@gmail.com>
 * SwipeView can be rendered individually or within a list by passing three child views.
 *
 * e.g.
  <SwipeView
		renderVisibleContent={() => <Text>Visible Row</Text>}
		renderLeftView={() => <Text>Left Row</Text>}
		renderRightView={() => <Text>Right Row</Text>}
 	/>
 */
export default class SwipeView extends Component {

	constructor(props) {
		super(props);
		this.horizontalSwipeGestureBegan = false;
		this.horizontalSwipeGestureEnded = false;
		this.rowItemJustSwiped = false;
		this.swipeInitialX = null;
		this.ranPreview = false;
		this.state = {
			dimensionsSet: false,
			hiddenHeight: 0,
			hiddenWidth: 0,
			swipingLeft: this.props.swipingLeft
		};
		this._translateX = new Animated.Value(0);
	}

	componentWillMount() {
		this._panResponder = PanResponder.create({
			onMoveShouldSetPanResponder: (e, gs) => this.handleOnMoveShouldSetPanResponder(e, gs),
			onPanResponderMove: (e, gs) => this.handlePanResponderMove(e, gs),
			onPanResponderRelease: (e, gs) => this.handlePanResponderEnd(e, gs),
			onPanResponderTerminate: (e, gs) => this.handlePanResponderEnd(e, gs),
			onShouldBlockNativeResponder: _ => false,
		});
	}

	getPreviewAnimation = (toValue, delay) => {
		return Animated.timing(
			this._translateX,
			{ duration: this.props.previewDuration, toValue, delay }
		);
	};

	onContentLayout = (e) => {
		this.setState({
			dimensionsSet: !this.props.recalculateHiddenLayout,
			hiddenHeight: e.nativeEvent.layout.height,
			hiddenWidth: e.nativeEvent.layout.width,
		});

		if (this.props.previewSwipeDemo && !this.ranPreview) {
			let {previewOpenValue} = this.props;
			this.ranPreview = true;

			this.getPreviewAnimation(previewOpenValue, this.props.previewOpenDelay)
			.start( _ => {
				this.getPreviewAnimation(0, this.props.previewCloseDelay).start();
			});
		};
	};

	handleOnMoveShouldSetPanResponder = (e, gs) => {
		const { dx } = gs;
		return Math.abs(dx) > this.props.directionalDistanceChangeThreshold;
	};

	handlePanResponderMove = (e, gestureState) => {
		const { dx, dy } = gestureState;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		if(this.horizontalSwipeGestureEnded)
			return;

		if (absDx > this.props.directionalDistanceChangeThreshold) {

			if (this.swipeInitialX === null) {
				this.swipeInitialX = this._translateX._value
			}
			if (!this.horizontalSwipeGestureBegan) {
				this.horizontalSwipeGestureBegan = true;
				this.props.swipeGestureBegan && this.props.swipeGestureBegan();
			}

			let newDX = this.swipeInitialX + dx;
			if (this.props.disableSwipeToLeft  && newDX < 0) { newDX = 0; }
			if (this.props.disableSwipeToRight && newDX > 0) { newDX = 0; }

			this._translateX.setValue(newDX);

			let toValue = 0;
			if (this._translateX._value >= 0) {
				this.setState({
					...this.state,
					swipingLeft: false
				});

				if (this._translateX._value > this.props.leftOpenValue * (this.props.swipeToOpenPercent/100)) {
					toValue = this.props.leftOpenValue;
					this.onSwipedRight(toValue);
				}
			} else {
				this.setState({
					...this.state,
					swipingLeft: true
				});

				if (this._translateX._value < this.props.rightOpenValue * (this.props.swipeToOpenPercent/100)) {
					toValue = this.props.rightOpenValue;
					this.onSwipedLeft(toValue);
				};
			};
		};
	};

	handlePanResponderEnd = (e, gestureState) => {
		if(!this.horizontalSwipeGestureEnded) this.closeRow();
	};

	closeRow = () => {
		if(this.rowItemJustSwiped) {
			this.forceCloseRow();
		}else {
			this.manuallySwipeView(0);
		};
	};

	forceCloseRow = () => {
		Animated.timing(
			this._translateX,
			{
				duration: 0,
				toValue: 0,
			}
		).start();
	};

	onSwipedLeft = (toValue) => {
		const {onSwipedLeft} = this.props;

		this.horizontalSwipeGestureEnded = true;
		this.rowItemJustSwiped = true;

		this.manuallySwipeView(toValue).then(() => {
			if(onSwipedLeft) onSwipedLeft();
			this.closeRow();
		});
	};

	onSwipedRight = (toValue) => {
		const {onSwipedRight} = this.props;

		this.horizontalSwipeGestureEnded = true;
		this.rowItemJustSwiped = true;

		this.manuallySwipeView(toValue).then(() => {
			if(onSwipedRight) onSwipedRight();
			this.closeRow();
		});
	};

	manuallySwipeView = (toValue) => {

		return new Promise((resolve,reject) => {

			Animated.timing(
				this._translateX,
				{
					duration: this.props.swipeDuration,
				 	toValue,
			 	}
			).start( _ => {
				this.swipeInitialX = null;
				this.horizontalSwipeGestureBegan = false;
				this.horizontalSwipeGestureEnded = false;

				resolve();
			});
		});
	};

	renderVisibleContent = () => {
		return (
				this.props.renderVisibleContent()
		);
	};

	renderRowContent = () => {

		if (this.state.dimensionsSet) {
			return (
				<Animated.View
					{...this._panResponder.panHandlers}
					style={{
						transform: [
							{translateX: this._translateX}
						]
					}}
				>
					{this.renderVisibleContent()}
				</Animated.View>
			);
		} else {
			return (
				<Animated.View
					{...this._panResponder.panHandlers}
					onLayout={ (e) => this.onContentLayout(e) }
					style={{
						transform: [
							{translateX: this._translateX}
						]
					}}
				>
					{this.renderVisibleContent()}
				</Animated.View>
			);
		};
	};

	render() {
		return (
			<View>
				<View style={[
					styles.hidden,
					{
						height: this.state.hiddenHeight,
						width: this.state.hiddenWidth,
					}
				]}>
					{this.state.swipingLeft ?
						((this.props.renderRightView && this.props.renderRightView()) || null) :
					 	((this.props.renderLeftView && this.props.renderLeftView()) || null)}
				</View>
				{this.renderRowContent()}
			</View>
		);
	};

};

const styles = StyleSheet.create({
	hidden: {
		bottom: 0,
		left: 0,
		overflow: 'hidden',
		position: 'absolute',
		right: 0,
		top: 0,
	},
});

SwipeView.propTypes = {
	/**
	 * TranslateX: How much view opens from the left
	 * when swiping left-to-right (positive number)
	 */
	leftOpenValue: PropTypes.number,
	/**
	 * TranslateX: How much view opens from the right
	 * when swiping right-to-left (negative number)
	 */
	rightOpenValue: PropTypes.number,
	/**
	 * Duration of the slide out swipe animation
	 */
	swipeDuration: PropTypes.number,
	/**
	 * What % of the left/right openValue does the user need to swipe
	 * past to trigger onSwipedLeft/onSwipedRight actions.
	 */
	swipeToOpenPercent: PropTypes.number,
	/**
	 * Disable ability to swipe view to left
	 */
	disableSwipeToLeft: PropTypes.bool,
	/**
	 * Disable ability to swipe view to right
	 */
	disableSwipeToRight: PropTypes.bool,
	/**
	 * Called when left swipe is compelted
	 */
	onSwipedLeft: PropTypes.func,
	/**
	 * Called when right swipe is compelted
	 */
	onSwipedRight: PropTypes.func,
	/**
	 * Should the view do a slide out preview to show that it is swipeable
	 */
	previewSwipeDemo: PropTypes.bool,
	/**
	 * Duration of the slide out preview animation
	 */
	previewDuration: PropTypes.number,
	/**
	 * TranslateX value for the slide out preview animation
	 */
	previewOpenValue: PropTypes.number,
	/**
	 * Delay before starting preview animation
	 */
	previewOpenDelay: PropTypes.number,
	/**
	 * Delay before closing preview animation
	 */
	previewCloseDelay: PropTypes.number,
	/**
	 * Should swiping initialize with right-to-left
	 * This should be useful for swipe previews
	 * ex: +ve previewOpenValue swipingLeft: false | -ve previewOpenValue swipingLeft: true
	 */
	swipingLeft: PropTypes.bool,
	/**
	 * Enable hidden row onLayout calculations to run always
	 */
	recalculateHiddenLayout: PropTypes.bool,
	/**
	 * Change the sensitivity of the row
	 */
	directionalDistanceChangeThreshold: PropTypes.number,
	/**
	 * Main Content view.
	 */
	renderVisibleContent: PropTypes.func.isRequired,
	/**
	 * Left view to render behind the right view.
	 */
	renderLeftView: PropTypes.func,
	/**
	 * Right view to render behind the item view.
	 */
	renderRightView: PropTypes.func,
};

SwipeView.defaultProps = {
	leftOpenValue: 0,
	rightOpenValue: 0,
	swipeDuration: 250,
	swipeToOpenPercent: 35,
	disableSwipeToLeft: false,
	disableSwipeToRight: false,
	previewSwipeDemo: false,
	previewDuration: 300,
	previewOpenValue: -60,
	previewOpenDelay: 350,
	previewCloseDelay: 300,
	swipingLeft: true,
	recalculateHiddenLayout: false,
	directionalDistanceChangeThreshold: 2,
};
