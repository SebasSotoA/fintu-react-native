/**
 * Punto de entrada para todos los componentes de estilo
 * Exporta todos los componentes de manera organizada
 */

// Estilos de pantallas principales
export { accountsStyles } from "./accounts";
export { addTransactionStyles } from "./add-transaction";
export { categoriesStyles } from "./categories";
export { categoryHistoryStyles } from "./category-history";
export { chartsStyles } from "./charts";
export { chooseCategoryStyles } from "./choose-category";
export { createCategoryStyles } from "./create-category";
export { dashboardStyles } from "./dashboard";
export { newAccountStyles } from "./new-account";
export { remindersStyles } from "./reminders";
export { settingsStyles } from "./settings";
export { transferStyles } from "./transfer";

// Estilos de componentes reutilizables
export { buttonStyles, buttonTextStyles } from "./buttons";
export { numericKeypadBottomSheetStyles } from "./numeric-keypad-bottom-sheet";
export { badgeStyles, badgeTextStyles, cardStyles } from "./cards";
export { drawerStyles, drawerTextStyles, drawerVariants } from "./drawer";
export { editAccountModalStyles } from "./edit-account-modal";
export { formStyles, iconStyles } from "./forms";
export { headerStyles } from "./headers";
export { layoutStyles, textStyles } from "./layout";
export { welcomeModalStyles } from "./welcome-modal";

// Estilos de calendarios
export { dateRangeCalendarStyles } from "./date-range-calendar";
export { singleDateCalendarStyles } from "./single-date-calendar";

// Re-exportar para compatibilidad
export { accountsStyles as accounts } from "./accounts";
export { buttonStyles as buttons } from "./buttons";
export { cardStyles as cards } from "./cards";
export { categoriesStyles as categories } from "./categories";
export { dashboardStyles as dashboard } from "./dashboard";
export {
  drawerStyles as drawer,
  drawerTextStyles as drawerText
} from "./drawer";
export { editAccountModalStyles as editAccountModal } from "./edit-account-modal";
export { formStyles as forms } from "./forms";
export { headerStyles as headers } from "./headers";
export { layoutStyles as layout } from "./layout";

