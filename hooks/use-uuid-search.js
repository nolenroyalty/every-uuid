import React from "react";
import { findNextIndex } from "../lib/uuidTools";

export function useUUIDSearch({ currentIndex, setCurrentIndex }) {
  const [search, setSearch] = React.useState(null);

  const searchUUID = React.useCallback(
    (input) => {
      setSearch(input);

      const index = findNextIndex(input, currentIndex, 1n);
      if (index !== undefined) setCurrentIndex(index);
    },
    [currentIndex, setCurrentIndex],
  );

  const nextUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findNextIndex(search, currentIndex, 1n);
    if (index !== undefined) setCurrentIndex(index);
    return null;
  }, [search, currentIndex, setCurrentIndex]);

  const previousUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findNextIndex(search, currentIndex, -1n);
    if (index !== undefined) setCurrentIndex(index);
    return null;
  }, [search, currentIndex, setCurrentIndex]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
  };
}
