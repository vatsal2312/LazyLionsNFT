import React from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import styles from "./style.module.css";

const MyTooltip = ({ children, title }) => {
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Tooltip>
          <span className={styles.tooltip}>{title}</span>
        </Tooltip>
      }
    >
      <span>{children}</span>
    </OverlayTrigger>
  );
};

export default MyTooltip;
