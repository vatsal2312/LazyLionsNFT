import { Spinner, Button as BSButton } from "react-bootstrap";
import clsx from "clsx";
import styles from "./style.module.css";

export function Button({
  loading = false,
  color = "dark",
  size = "lg",
  children,
  onClick,
  disabled,
}) {
  let body;
  if (loading) {
    body = (
      <>
        <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        />
        Loading...
      </>
    );
  } else {
    body = children;
  }

  return (
    <BSButton
      onClick={onClick}
      variant="primary"
      className={clsx(styles.btn, styles.btn_rounded, {
        [styles.btn_large]: size === "lg",
        [styles.btn_small]: size === "sm",
        [styles.btn_dark]: color === "dark",
        [styles.btn_gold]: color === "gold",
      })}
      disabled={loading || disabled}
    >
      {body}
    </BSButton>
  );
}
