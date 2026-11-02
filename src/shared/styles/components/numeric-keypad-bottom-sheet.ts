import { StyleSheet } from "react-native";
import { borders, colors, shadows, spacing, typography } from "../tokens";

export const numericKeypadBottomSheetStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: borders.radius["2xl"],
    borderTopRightRadius: borders.radius["2xl"],
    ...shadows.specific.modal,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral.gray[300],
    borderRadius: borders.radius.full,
  },
  displayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.layout.screenPadding,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[2],
  },
  displayValue: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  displayCurrency: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
  },
  keypadContainer: {
    flex: 1,
    paddingHorizontal: spacing.layout.screenPadding,
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  keypadRow: {
    flexDirection: "row",
    gap: spacing[2],
    flex: 1,
  },
  keypadButton: {
    flex: 1,
    backgroundColor: colors.neutral.gray[100],
    borderRadius: borders.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  keypadButtonText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  actionButton: {
    backgroundColor: colors.neutral.gray[200],
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.layout.screenPadding,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.neutral.gray[100],
    paddingVertical: spacing[3],
    borderRadius: borders.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    borderRadius: borders.radius.full,
    gap: spacing[2],
    ...shadows.specific.button,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral.white,
  },
});



