import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
// Removido DateTimePicker - no compatible con Expo Go
import { useApp } from "../../src/shared/context/AppProvider";
import { formStyles } from "../../src/shared/styles/components";
import { addTransactionStyles } from "../../src/shared/styles/components/add-transaction";
import { singleDateCalendarStyles } from "../../src/shared/styles/components/single-date-calendar";
import { colors, spacing } from "../../src/shared/styles/tokens";
import {
  handleCalculatorBackspace as calcBackspace,
  handleClear as calcClear,
  handleCalculatorDecimal as calcDecimal,
  handleCalculatorInput as calcInput,
  handleParenthesis as calcParenthesis,
  evaluateExpression,
  MAX_AMOUNT,
} from "../../src/shared/utils/calculator-helpers";
import { TransactionType } from "../../types/transaction";

// Importar SVGs
import ArrowBackIcon from "../../assets/icons/arrow-back.svg";
import ArrowForwardIcon from "../../assets/icons/arrow-forward.svg";
import CalendarOutlineIcon from "../../assets/icons/calendar-outline.svg";
import CheckmarkCircleIcon from "../../assets/icons/checkmark-circle.svg";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg";
import CloseIcon from "../../assets/icons/close.svg";

// Componente para renderizar un mes del calendario
const CalendarMonth = React.memo(
  ({
    month,
    selectedDate,
    onDateSelection,
  }: {
    month: Date;
    selectedDate: Date;
    onDateSelection: (date: Date) => void;
  }) => {
    const getCalendarDaysFor = React.useCallback(
      (baseDate: Date) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayWeekday = firstDayOfMonth.getDay();

        const days = [];

        // Días del mes anterior
        const prevMonth = new Date(year, month, 0);
        const daysInPrevMonth = prevMonth.getDate();

        for (let i = firstDayWeekday - 1; i >= 0; i--) {
          const dayNumber = daysInPrevMonth - i;
          const date = new Date(year, month - 1, dayNumber);
          days.push({
            date,
            isCurrentMonth: false,
            isSelected:
              selectedDate && date.getTime() === selectedDate.getTime(),
          });
        }

        // Días del mes actual
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
          const date = new Date(year, month, day);
          days.push({
            date,
            isCurrentMonth: true,
            isSelected:
              selectedDate && date.getTime() === selectedDate.getTime(),
          });
        }

        // Días del mes siguiente para completar exactamente 42 días
        const totalDaysSoFar = days.length;
        const remainingDays = 42 - totalDaysSoFar;

        for (let day = 1; day <= remainingDays; day++) {
          const date = new Date(year, month + 1, day);
          days.push({
            date,
            isCurrentMonth: false,
            isSelected:
              selectedDate && date.getTime() === selectedDate.getTime(),
          });
        }

        // Asegurar que siempre tengamos exactamente 42 días
        while (days.length < 42) {
          const lastDate: Date = days[days.length - 1].date;
          const nextDate: Date = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + 1);
          days.push({
            date: nextDate,
            isCurrentMonth: false,
            isSelected:
              selectedDate && nextDate.getTime() === selectedDate.getTime(),
          });
        }

        return days;
      },
      [selectedDate],
    );

    return (
      <View style={singleDateCalendarStyles.calendarContainer}>
        <View style={singleDateCalendarStyles.calendarHeader}>
          <Text style={singleDateCalendarStyles.calendarMonthYear}>
            {month.toLocaleDateString("es-CO", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        <View style={singleDateCalendarStyles.calendarDaysHeader}>
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <Text key={day} style={singleDateCalendarStyles.calendarDayHeader}>
              {day}
            </Text>
          ))}
        </View>

        <View style={singleDateCalendarStyles.calendarGrid}>
          {getCalendarDaysFor(month).map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                singleDateCalendarStyles.calendarDay,
                day.isCurrentMonth &&
                  singleDateCalendarStyles.calendarDayCurrentMonth,
                day.isSelected && singleDateCalendarStyles.calendarDaySelected,
              ]}
              onPress={() => {
                if (day.isCurrentMonth) {
                  onDateSelection(day.date);
                }
              }}
              disabled={!day.isCurrentMonth}
            >
              <Text
                style={[
                  singleDateCalendarStyles.calendarDayText,
                  day.isCurrentMonth &&
                    singleDateCalendarStyles.calendarDayTextCurrentMonth,
                  day.isSelected &&
                    singleDateCalendarStyles.calendarDayTextSelected,
                ]}
              >
                {day.date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
);

CalendarMonth.displayName = "CalendarMonth";

// Componente para calendario de selección de fecha única
const SingleDateCalendar = React.memo(
  ({
    selectedDate,
    onDateSelection,
  }: {
    selectedDate: Date;
    onDateSelection: (date: Date) => void;
  }) => {
    const scrollViewRef = React.useRef<ScrollView>(null);

    // Generar lista de meses alrededor del mes actual para scroll continuo
    const monthsForScroll = React.useMemo(() => {
      const center = new Date();
      const list: Date[] = [];
      // 6 meses atrás, 6 meses adelante
      for (let i = -6; i <= 6; i++) {
        const d = new Date(center);
        d.setDate(1);
        d.setMonth(center.getMonth() + i);
        list.push(d);
      }
      return list;
    }, []);

    // Encontrar el índice del mes actual (centro de la lista)
    const currentMonthIndex = React.useMemo(() => {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      return monthsForScroll.findIndex(
        (month) =>
          month.getFullYear() === currentMonth.getFullYear() &&
          month.getMonth() === currentMonth.getMonth(),
      );
    }, [monthsForScroll]);

    // Scroll automático al mes actual cuando se monta el componente
    React.useEffect(() => {
      if (scrollViewRef.current && currentMonthIndex !== -1) {
        // Calcular la altura aproximada de un mes (header + grid de días)
        const monthHeight = 280; // Ajusta este valor según la altura real de tu calendario
        const scrollToY = currentMonthIndex * monthHeight;

        // Usar setTimeout para asegurar que el ScrollView esté renderizado
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollToY,
            animated: false, // Sin animación para que se abra directamente en el mes correcto
          });
        }, 100);
      }
    }, [currentMonthIndex]);

    return (
      <ScrollView
        ref={scrollViewRef}
        style={singleDateCalendarStyles.calendarScrollView}
        showsVerticalScrollIndicator={false}
      >
        {monthsForScroll.map((month, idx) => (
          <CalendarMonth
            key={`${month.getFullYear()}-${month.getMonth()}`}
            month={month}
            selectedDate={selectedDate}
            onDateSelection={onDateSelection}
          />
        ))}
      </ScrollView>
    );
  },
);

SingleDateCalendar.displayName = "SingleDateCalendar";

export default function AddTransaction() {
  const { currentAccount, accounts } = useApp();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactionType, setTransactionType] =
    useState<TransactionType>("GASTO");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(currentAccount);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [expression, setExpression] = useState("0");
  const deleteIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const deleteTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [lastValidAmount, setLastValidAmount] = useState("0");

  // Restaurar datos cuando se regrese desde choose-category (solo si hay parámetros)
  useEffect(() => {
    const { type, amount, date, note, accountId } = params;

    const hasTransactionParams = type || amount || date || note || accountId;

    if (hasTransactionParams) {
      if (type) setTransactionType(type as TransactionType);
      if (amount) setAmount(amount as string);
      if (date) setSelectedDate(new Date(date as string));
      if (note) setNote(note as string);
      if (accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) setSelectedAccount(account);
      }
    } else {
      // reset al venir del home
      setAmount("0");
      setNote("");
      setSelectedDate(new Date());
      setTransactionType("GASTO");
    }
  }, [params.type, params.amount, params.date, params.note, params.accountId, accounts]);

  // Actualizar cuenta seleccionada cuando cambie la cuenta actual
  useEffect(() => {
    if (selectedAccount?.id !== currentAccount?.id) {
      setSelectedAccount(currentAccount);
    }
  }, [currentAccount, selectedAccount?.id]);

  // Detectar cuando el teclado está visible
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const formatDate = (date: Date) => {
    const days = [
      "DOMINGO",
      "LUNES",
      "MARTES",
      "MIÉRCOLES",
      "JUEVES",
      "VIERNES",
      "SÁBADO",
    ];
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleContinue = () => {
    const amountValue = parseFloat(amount);
    
    if (amountValue <= 0 || isNaN(amountValue)) {
      return; // Silently prevent navigation
    }

    if (amountValue > MAX_AMOUNT) {
      return; // Silently prevent navigation
    }

    if (!selectedAccount) {
      Alert.alert("Error", "No hay cuenta seleccionada");
      return;
    }

    // Navegar a la pantalla de elegir categoría
    router.push({
      pathname: "/(drawer)/choose-category",
      params: {
        type: transactionType,
        amount: amount,
        date: selectedDate.toISOString(),
        note: note,
        accountId: selectedAccount.id,
      },
    });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(drawer)/");
    }
  };

  const handleNumberPress = (num: string) => {
    setAmount((prev) => {
      if (prev === "0") {
        return num;
      }
      return prev + num;
    });
  };

  const handleDecimalPress = () => {
    setAmount((prev) => {
      if (prev.includes(".")) {
        return prev;
      }
      return prev + ".";
    });
  };

  const handleBackspace = () => {
    setAmount((prev) => {
      if (prev.length <= 1) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    const result = calcClear();
    setAmount("0");
    setExpression(result.expression);
    setValidationError(result.validationError);
    setLastValidAmount(result.lastValidAmount);
  };

  const handleParenthesis = () => {
    setExpression((prev) => calcParenthesis(prev));
  };

  const handleCalculatorInput = (input: string) => {
    setExpression((prev) => calcInput(input, prev));
  };

  const handleCalculatorDecimal = () => {
    setExpression((prev) => calcDecimal(prev));
  };

  const handleCalculatorBackspace = () => {
    setExpression((prev) => calcBackspace(prev));
  };

  const handleBackspaceStart = () => {
    // Borrar una vez inmediatamente
    handleCalculatorBackspace();
    
    // Iniciar borrado continuo después de 500ms
    deleteTimeoutRef.current = setTimeout(() => {
      deleteIntervalRef.current = setInterval(() => {
        handleCalculatorBackspace();
      }, 100); // Borrar cada 100ms
    }, 400);
  };

  const handleBackspaceEnd = () => {
    // Limpiar timers
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current);
      deleteIntervalRef.current = null;
    }
  };

  // Limpiar timers cuando se desmonte el componente
  useEffect(() => {
    return () => {
      handleBackspaceEnd();
    };
  }, []);

  // Actualizar amount cuando cambie la expresión
  useEffect(() => {
    if (isAmountFocused) {
      const { value, error } = evaluateExpression(expression, lastValidAmount);
      
      if (error) {
        setValidationError(error);
        // No actualizar amount si hay error, mantener último valor válido
      } else {
        setValidationError('');
        setAmount(value.toString());
        setLastValidAmount(value.toString());
      }
    }
  }, [expression, isAmountFocused, lastValidAmount]);


  return (
    <View style={addTransactionStyles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background.dark}
      />

      {/* Área superior con color del header */}
      <View
        style={[addTransactionStyles.statusBarArea, { height: insets.top }]}
      />

      {/* Header */}
      <View style={addTransactionStyles.header}>
        <TouchableOpacity
          onPress={goBack}
          style={addTransactionStyles.backButton}
        >
          <ArrowBackIcon
            width={24}
            height={24}
            color={colors.neutral.white}
          />
        </TouchableOpacity>
        <View style={addTransactionStyles.headerCenter}>
          <Text style={addTransactionStyles.headerTitle}>
            Añadir Transacción
          </Text>
        </View>
        <View style={addTransactionStyles.placeholder} />
      </View>

      {/* Contenido principal */}
      <SafeAreaView
        style={addTransactionStyles.contentContainer}
        edges={["left", "right", "bottom"]}
      >
        {!isAmountFocused ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          >
            <ScrollView
              style={addTransactionStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 20 : 100 }}
            >
            {/* Toggle tipo de transacción */}
            <View style={[formStyles.fieldGroup, { marginTop: spacing[2] }]}>
              <Text style={formStyles.label}>Tipo</Text>
              <View style={addTransactionStyles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    addTransactionStyles.toggleButton,
                    transactionType === "GASTO" &&
                      addTransactionStyles.activeToggleButton,
                  ]}
                  onPress={() => setTransactionType("GASTO")}
                >
                  <Text
                    style={[
                      addTransactionStyles.toggleText,
                      transactionType === "GASTO" &&
                        addTransactionStyles.activeToggleText,
                    ]}
                  >
                    GASTO
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    addTransactionStyles.toggleButton,
                    transactionType === "INGRESO" &&
                      addTransactionStyles.activeToggleButton,
                  ]}
                  onPress={() => setTransactionType("INGRESO")}
                >
                  <Text
                    style={[
                      addTransactionStyles.toggleText,
                      transactionType === "INGRESO" &&
                        addTransactionStyles.activeToggleText,
                    ]}
                  >
                    INGRESO
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selector de fecha */}
            <View style={formStyles.fieldGroup}>
              <Text style={formStyles.label}>Fecha</Text>
              <TouchableOpacity
                style={addTransactionStyles.dateSelector}
                onPress={showDatepicker}
              >
                <Text style={addTransactionStyles.dateText}>
                  {formatDate(selectedDate)}
                </Text>
                <CalendarOutlineIcon
                  width={20}
                  height={20}
                  color={colors.primary[500]}
                />
              </TouchableOpacity>
            </View>

            {/* Selector de cuenta */}
            <View style={formStyles.fieldGroup}>
              <Text style={formStyles.label}>Cuenta</Text>
              <TouchableOpacity
                style={addTransactionStyles.accountSelector}
                onPress={() => setShowAccountSelector(true)}
              >
                <View style={addTransactionStyles.accountSelectorLeft}>
                  <Text style={addTransactionStyles.accountSelectorSymbol}>
                    {selectedAccount?.symbol || "💰"}
                  </Text>
                  <View style={addTransactionStyles.accountSelectorInfo}>
                    <Text style={addTransactionStyles.accountSelectorName}>
                      {selectedAccount?.name || "Seleccionar cuenta"}
                    </Text>
                    <Text style={addTransactionStyles.accountSelectorBalance}>
                      Balance:{" "}
                      {selectedAccount?.balance?.toLocaleString("es-CO") || "0"}{" "}
                      {selectedAccount?.currency || "COP"}
                    </Text>
                  </View>
                </View>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  color={colors.neutral.white}
                />
              </TouchableOpacity>
            </View>

            {/* Campo de monto */}
            <View style={formStyles.fieldGroup}>
              <Text style={formStyles.label}>Monto</Text>
              <TouchableOpacity
                style={addTransactionStyles.amountInputContainer}
                onPress={() => {
                  setIsAmountFocused(true);
                  setExpression(amount === "0" ? "0" : amount);
                  setValidationError("");
                  setLastValidAmount(amount);
                }}
                activeOpacity={0.7}
              >
                <Text style={addTransactionStyles.amountInputText}>
                  {parseFloat(amount).toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text style={addTransactionStyles.amountCurrency}>
                  {selectedAccount?.currency || "COP"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Campo de nota */}
            <View style={formStyles.fieldGroup}>
              <Text style={formStyles.label}>Nota (opcional)</Text>
              <TextInput
                style={addTransactionStyles.noteInput}
                placeholder="Agregar una nota..."
                placeholderTextColor="#ADADAD"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <View style={addTransactionStyles.keypadView}>
            {/* Botón cerrar */}
            <TouchableOpacity
              style={addTransactionStyles.keypadCloseButton}
              onPress={() => {
                setIsAmountFocused(false);
                setExpression(amount);
                setValidationError("");
              }}
            >
              <CloseIcon
                width={20}
                height={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>

            {/* Campo de monto con expresión y resultado */}
            <View style={addTransactionStyles.amountDisplayContainer}>
              {/* Display unificado */}
              <View style={addTransactionStyles.calculatorDisplay}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={addTransactionStyles.expressionScrollView}
                >
                  <TextInput
                    style={addTransactionStyles.calculatorExpression}
                    value={expression}
                    editable={false}
                    showSoftInputOnFocus={false}
                    caretHidden={true}
                    selectTextOnFocus={false}
                  />
                </ScrollView>
                <View style={addTransactionStyles.calculatorResultRow}>
                  <Text style={addTransactionStyles.calculatorResult} numberOfLines={1}>
                    = {parseFloat(amount).toLocaleString("es-CO", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text style={addTransactionStyles.calculatorCurrency}>
                    {selectedAccount?.currency || "COP"}
                  </Text>
                </View>
              </View>
              
              {validationError && (
                <View style={addTransactionStyles.validationErrorContainer}>
                  <Text style={addTransactionStyles.validationErrorText}>
                    {validationError}
                  </Text>
                </View>
              )}
            </View>

            {/* Teclado numérico con calculadora integrado */}
            <View style={addTransactionStyles.keypadContainer}>
              {/* Fila 1: C, (), %, + */}
              <View style={addTransactionStyles.keypadRow}>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.clearButton]}
                  onPress={handleClear}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.clearButtonText]}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={handleParenthesis}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>()</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("%")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("+")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Fila 2: 7, 8, 9, − */}
              <View style={addTransactionStyles.keypadRow}>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("7")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>7</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("8")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("9")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>9</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("−")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>−</Text>
                </TouchableOpacity>
              </View>

              {/* Fila 3: 4, 5, 6, × */}
              <View style={addTransactionStyles.keypadRow}>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("4")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("5")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("6")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>6</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("×")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Fila 4: 1, 2, 3, ÷ */}
              <View style={addTransactionStyles.keypadRow}>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("1")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("2")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("3")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("÷")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>÷</Text>
                </TouchableOpacity>
              </View>

              {/* Fila 5: 0, ., ⌫, ÷ */}
              <View style={addTransactionStyles.keypadRow}>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={() => handleCalculatorInput("0")}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPress={handleCalculatorDecimal}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={addTransactionStyles.keypadButton}
                  onPressIn={handleBackspaceStart}
                  onPressOut={handleBackspaceEnd}
                >
                  <Text style={addTransactionStyles.keypadButtonText}>⌫</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[addTransactionStyles.keypadButton, addTransactionStyles.operatorButton]}
                  onPress={() => handleCalculatorInput("÷")}
                >
                  <Text style={[addTransactionStyles.keypadButtonText, addTransactionStyles.operatorButtonText]}>÷</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Confirmar */}
            <View style={addTransactionStyles.keypadActions}>
              <TouchableOpacity
                style={[
                  addTransactionStyles.keypadConfirmButton,
                  (validationError || parseFloat(amount) <= 0) && addTransactionStyles.disabledButton
                ]}
                onPress={() => {
                  if (!validationError && parseFloat(amount) > 0) {
                    setIsAmountFocused(false);
                    setExpression(amount);
                    setValidationError("");
                  }
                }}
                disabled={validationError !== "" || parseFloat(amount) <= 0}
              >
                <Text style={[
                  addTransactionStyles.keypadConfirmButtonText,
                  (validationError || parseFloat(amount) <= 0) && addTransactionStyles.disabledButtonText
                ]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botón Continuar Flotante - solo visible cuando no está el teclado */}
        {!isAmountFocused && !isKeyboardVisible && (
          <View style={addTransactionStyles.floatingButtonContainer}>
            <TouchableOpacity
              style={[
                addTransactionStyles.floatingButton,
                (parseFloat(amount) <= 0 || parseFloat(amount) > MAX_AMOUNT) && addTransactionStyles.disabledButton,
              ]}
              onPress={handleContinue}
              disabled={parseFloat(amount) <= 0 || parseFloat(amount) > MAX_AMOUNT}
            >
              <Text
                style={[
                  addTransactionStyles.floatingButtonText,
                  (parseFloat(amount) <= 0 || parseFloat(amount) > MAX_AMOUNT) &&
                    addTransactionStyles.disabledButtonText,
                ]}
              >
                Continuar
              </Text>
              <ArrowForwardIcon
                width={20}
                height={20}
                color={colors.neutral.white}
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Date Picker Modal con Calendario */}
      {showDatePicker && (
        <View style={addTransactionStyles.datePickerOverlay}>
          <View style={addTransactionStyles.datePickerModal}>
            <View style={addTransactionStyles.datePickerHeader}>
              <Text style={addTransactionStyles.datePickerTitle}>
                Seleccionar Fecha
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={addTransactionStyles.closeButton}
              >
                <CloseIcon
                  width={24}
                  height={24}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            <SingleDateCalendar
              selectedDate={selectedDate}
              onDateSelection={setSelectedDate}
            />

            <View style={addTransactionStyles.datePickerActions}>
              <TouchableOpacity
                style={[
                  addTransactionStyles.datePickerActionButton,
                  addTransactionStyles.todayButton,
                ]}
                onPress={() => {
                  setSelectedDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={addTransactionStyles.todayButtonText}>Hoy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  addTransactionStyles.datePickerActionButton,
                  addTransactionStyles.confirmButton,
                ]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={addTransactionStyles.confirmButtonText}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal Selector de Cuenta */}
      {showAccountSelector && (
        <View style={addTransactionStyles.modalOverlay}>
          <View style={addTransactionStyles.accountSelectorModal}>
            <View style={addTransactionStyles.modalHeader}>
              <Text style={addTransactionStyles.modalTitle}>
                Seleccionar Cuenta
              </Text>
              <TouchableOpacity
                onPress={() => setShowAccountSelector(false)}
                style={addTransactionStyles.closeButton}
              >
                <CloseIcon
                  width={24}
                  height={24}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={addTransactionStyles.accountsList}
              showsVerticalScrollIndicator={false}
            >
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    addTransactionStyles.accountItem,
                    selectedAccount?.id === account.id &&
                      addTransactionStyles.selectedAccountItem,
                  ]}
                  onPress={() => {
                    setSelectedAccount(account);
                    setShowAccountSelector(false);
                  }}
                >
                  <View style={addTransactionStyles.accountItemLeft}>
                    <Text style={addTransactionStyles.accountItemSymbol}>
                      {account.symbol}
                    </Text>
                    <View style={addTransactionStyles.accountItemInfo}>
                      <Text style={addTransactionStyles.accountItemName}>
                        {account.name}
                      </Text>
                      <Text style={addTransactionStyles.accountItemBalance}>
                        Balance: {account.balance.toLocaleString("es-CO")}{" "}
                        {account.currency}
                      </Text>
                    </View>
                  </View>
                  {selectedAccount?.id === account.id && (
                    <CheckmarkCircleIcon
                      width={24}
                      height={24}
                      color={colors.primary[500]}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

    </View>
  );
}
