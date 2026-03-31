function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  prevLabel = "Trước",
  nextLabel = "Sau",
}) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  return (
    <nav aria-label="Phân trang" className="mt-2">
      <ul className="pagination justify-content-center flex-wrap gap-1">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button className="page-link" type="button" onClick={handlePrev}>
            {prevLabel}
          </button>
        </li>
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <li
              key={pageNumber}
              className={`page-item ${
                currentPage === pageNumber ? "active" : ""
              }`}
            >
              <button
                className="page-link"
                type="button"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            </li>
          );
        })}
        <li
          className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
        >
          <button className="page-link" type="button" onClick={handleNext}>
            {nextLabel}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
