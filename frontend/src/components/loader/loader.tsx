// Loader.js
import React from "react";
import styles from "./loader.module.css"; // Подключение CSS-модуля

const Loader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export default Loader;
