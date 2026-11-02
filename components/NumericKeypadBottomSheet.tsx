import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { numericKeypadBottomSheetStyles } from "../src/shared/styles/components/numeric-keypad-bottom-sheet";
import { colors } from "../src/shared/styles/tokens";
import BackspaceOutlineIcon from "../assets/icons/backspace-outline.svg";
import CheckmarkCircleIcon from "../assets/icons/checkmark-circle.svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% de la pantalla
const SWIPE_THRESHOLD = 50;

interface NumericKeypadBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  initialValue?: string;
  currency?: string;
}

export default function NumericKeypadBottomSheet({
  visible,
  onClose,
  onConfirm,
  initialValue = "0",
  currency = "COP",
}: NumericKeypadBottomSheetProps) {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // PanResponder para el gesto de deslizar hacia abajo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    }),
  ).current;

  // Animación de entrada/salida
  useEffect(() => {
    if (visible) {
      setDisplayValue(initialValue);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      translateY.setValue(BOTTOM_SHEET_HEIGHT);
      opacity.setValue(0);
    }
  }, [visible, initialValue]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: BOTTOM_SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleConfirm = () => {
    onConfirm(displayValue);
    handleClose();
  };

  const handleNumberPress = (num: string) => {
    setDisplayValue((prev) => {
      if (prev === "0") {
        return num;
      }
      return prev + num;
    });
  };

  const handleDecimalPress = () => {
    setDisplayValue((prev) => {
      if (prev.includes(".")) {
        return prev;
      }
      return prev + ".";
    });
  };

  const handleBackspace = () => {
    setDisplayValue((prev) => {
      if (prev.length <= 1) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setDisplayValue("0");
  };

  const KeypadButton = ({
    onPress,
    children,
    style,
  }: {
    onPress: () => void;
    children: React.ReactNode;
    style?: any;
  }) => (
    <TouchableOpacity
      style={[numericKeypadBottomSheetStyles.keypadButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[numericKeypadBottomSheetStyles.overlay, { opacity }]}
        />
      </TouchableWithoutFeedback>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          numericKeypadBottomSheetStyles.bottomSheet,
          {
            height: BOTTOM_SHEET_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle */}
        <View
          style={numericKeypadBottomSheetStyles.handleContainer}
          {...panResponder.panHandlers}
        >
          <View style={numericKeypadBottomSheetStyles.handle} />
        </View>

        {/* Display */}
        <View style={numericKeypadBottomSheetStyles.displayContainer}>
          <Text
            style={numericKeypadBottomSheetStyles.displayValue}
            numberOfLines={1}
            ellipsizeMode="head"
          >
            {parseFloat(displayValue).toLocaleString("es-CO", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={numericKeypadBottomSheetStyles.displayCurrency}>
            {currency}
          </Text>
        </View>

        {/* Keypad */}
        <View style={numericKeypadBottomSheetStyles.keypadContainer}>
          {/* Fila 1 */}
          <View style={numericKeypadBottomSheetStyles.keypadRow}>
            <KeypadButton onPress={() => handleNumberPress("1")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                1
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("2")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                2
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("3")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                3
              </Text>
            </KeypadButton>
          </View>

          {/* Fila 2 */}
          <View style={numericKeypadBottomSheetStyles.keypadRow}>
            <KeypadButton onPress={() => handleNumberPress("4")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                4
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("5")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                5
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("6")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                6
              </Text>
            </KeypadButton>
          </View>

          {/* Fila 3 */}
          <View style={numericKeypadBottomSheetStyles.keypadRow}>
            <KeypadButton onPress={() => handleNumberPress("7")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                7
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("8")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                8
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("9")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                9
              </Text>
            </KeypadButton>
          </View>

          {/* Fila 4 */}
          <View style={numericKeypadBottomSheetStyles.keypadRow}>
            <KeypadButton onPress={handleDecimalPress}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                .
              </Text>
            </KeypadButton>
            <KeypadButton onPress={() => handleNumberPress("0")}>
              <Text style={numericKeypadBottomSheetStyles.keypadButtonText}>
                0
              </Text>
            </KeypadButton>
            <KeypadButton
              onPress={handleBackspace}
              style={numericKeypadBottomSheetStyles.actionButton}
            >
              <BackspaceOutlineIcon
                width={24}
                height={24}
                fill={colors.text.secondary}
              />
            </KeypadButton>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={numericKeypadBottomSheetStyles.actionButtonsContainer}>
          <TouchableOpacity
            style={numericKeypadBottomSheetStyles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={numericKeypadBottomSheetStyles.clearButtonText}>
              Limpiar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={numericKeypadBottomSheetStyles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <CheckmarkCircleIcon
              width={20}
              height={20}
              color={colors.neutral.white}
            />
            <Text style={numericKeypadBottomSheetStyles.confirmButtonText}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}



