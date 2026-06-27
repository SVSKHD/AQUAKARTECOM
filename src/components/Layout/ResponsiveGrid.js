const ResponsiveGrid = ({
  children,
  minItemWidth = "260px",
  gapClassName = "gap-4 sm:gap-5 lg:gap-6",
  className = "",
}) => {
  const columns = `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`;

  return (
    <div
      className={`grid ${gapClassName} ${className}`}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
