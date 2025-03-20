import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

const CategoricalDataBlock = ({ filteredData, selectedColumns, filters }) => {
  const theme = useTheme();
  if (!filteredData || filteredData.length === 0) return null;

  const allCategoricalColumns = Object.keys(filteredData[0]).filter(
    (col) => typeof filteredData[0][col] === "string"
  );
  const otherCategoricalColumns = allCategoricalColumns.filter(
    (col) => !selectedColumns.includes(col)
  );

  if (otherCategoricalColumns.length === 0) return null;

  const catCustom = theme.custom?.categorical || {};

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        gap: 2,
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      {otherCategoricalColumns.map((col) => (
        <Box
          key={col}
          sx={{
            p: 1,
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderColor: filters[col]
              ? catCustom.activeBorder || alpha(theme.palette.red.main, 0.8)
              : catCustom.border || alpha(theme.palette.primary.main, 0.25),
            borderRadius: "12px",
            minWidth: "150px",
            backgroundColor: catCustom.background || alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mb: 1,
              textAlign: "center",
              color: filters[col]
                ? catCustom.activeText || alpha(theme.palette.red.main, 0.8)
                : catCustom.text || theme.palette.primary.main,
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
                        ? catCustom.activeBorder || alpha(theme.palette.red.main, 0.7)
                        : catCustom.chipBackground || alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.common.white,
                    fontWeight: "bold",
                    transition: "transform 0.2s, background-color 0.2s",
                    "&:hover": {
                      backgroundColor:
                        filters[col]
                          ? catCustom.activeBorder || alpha(theme.palette.error.main, 0.6)
                          : catCustom.chipHover || alpha(theme.palette.primary.main, 0.25),
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
