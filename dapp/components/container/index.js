import React from "react";
import styles from "./style.module.css";

const Container = ({ children, ...other }) => {
  return (
    <div className={styles.container} {...other}>
      {children}
    </div>
  );
};

export default Container;
