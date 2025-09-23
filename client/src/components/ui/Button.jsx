
import classNames from "classnames";
import { useOnlineStatus } from "../../hooks";

function Button({ children, onClick, style, className, disabled, type = "button" }) {
  const isSecondary = style === "secondary";
  const isOnline = useOnlineStatus();

  // If offline, disable the button
  if (!isOnline) {
    disabled = true;
  }

  // Base variants
  const primaryBase = "bg-[#312895] text-white font-bold py-2 px-4 rounded-md text-center transition duration-200 ease-in-out";
  const primaryHover = "hover:brightness-90";

  const secondaryBase = "px-4 py-2 rounded border font-semibold border-gray-400 text-off-black transition duration-200 ease-in-out";
  const secondaryHover = "hover:bg-gray-100";

  // Disabled styling
  const disabledCommon = "disabled:opacity-60 disabled:cursor-not-allowed";
  const secondaryDisabledColors = disabled ? "text-gray-400 border-gray-300 bg-gray-100" : undefined;

  const classes = classNames(
    "inline-flex items-center justify-center select-none",
    isSecondary
      ? classNames(secondaryBase, !disabled && secondaryHover, secondaryDisabledColors)
      : classNames(primaryBase, !disabled && primaryHover),
    disabledCommon,
    className
  );

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      onClick={onClick}
      aria-disabled={disabled || undefined}
    >
      {children}
    </button>
  );
}

export default Button;