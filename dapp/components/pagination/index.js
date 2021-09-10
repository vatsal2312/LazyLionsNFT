import React from "react";
import ReactPaginate from "react-paginate";
import styles from "./style.module.css";

const MyPagination = ({ totalItems, pageSize, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  return (
    <ReactPaginate
      pageCount={totalPages}
      pageRangeDisplayed={2}
      marginPagesDisplayed={1}
      containerClassName={styles.pagination}
      previousLabel={"<"}
      nextLabel={">"}
      pageClassName={styles.pageItem}
      breakClassName={styles.pageItem}
      activeClassName={styles.activeItem}
      previousClassName={styles.pageItem}
      nextClassName={styles.pageItem}
      disabledClassName={styles.disabledButton}
      onPageChange={(obj) => onPageChange(obj.selected)}
    />
  );
};

export default MyPagination;
