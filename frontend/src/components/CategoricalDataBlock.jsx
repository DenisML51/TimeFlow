// CategoricalDataBlock.jsx
import React from "react";
import { Box, Typography, Chip } from "@mui/material";

const CategoricalDataBlock = ({ filteredData, selectedColumns, filters }) => {
  if (!filteredData || filteredData.length === 0) return null;

  const allCategoricalColumns = Object.keys(filteredData[0]).filter(
    (col) => typeof filteredData[0][col] === "string"
  );
  const otherCategoricalColumns = allCategoricalColumns.filter(
    (col) => !selectedColumns.includes(col)
  );

  if (otherCategoricalColumns.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        gap: 2,
        // flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {otherCategoricalColumns.map((col) => (
        <Box
          key={col}
          sx={{
            p: 1,
            border: "1px solid",
            borderColor: filters[col]
              ? "rgba(255, 99, 132, 0.6)"
              : "#10A37F",
            borderRadius: "12px",
            minWidth: "150px",
            backgroundColor: "#18181a",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mb: 1,
              textAlign: "center",
              color: filters[col]
                ? "rgba(255, 99, 133, 0.84)"
                : "#10A37F",
            }}
          >
            {col.replace("_", " ")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[...new Set(filteredData.map((row) => row[col]))]
              .slice(0, 5)
              .map((value, idx) => (
                <Chip
                  key={idx}
                  label={value}
                  sx={{
                    backgroundColor:
                      filters[col] && filters[col] === value
                        ? "rgba(255, 99, 132, 0.6)"
                        : "#10A37F",
                    color: "#fff",
                    fontWeight: "bold",
                    transition: "transform 0.2s, background-color 0.2s",
                    "&:hover": {
                      backgroundColor: filters[col]
                        ? "rgba(255, 99, 132, 0.6)"
                        : "#10A37F",
                      transform: "scale(1.02)",
                    },
                  }}
                />
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default CategoricalDataBlock;
