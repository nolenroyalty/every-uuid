import React from "react";
import { findNextIndex } from "../lib/uuidTools";

export function useUUIDSearch({ virtualPosition, displayedUUIDs }) {
  const [search, setSearch] = React.useState(null);
  const [index, setIndex] = React.useState(null);

  const searchUUID = React.useCallback(
    (input) => {
      setSearch(input);

      const index = findNextIndex(input, virtualPosition, 1n);
      if (index) setIndex(index);
    },
    [virtualPosition],
  );

  const nextUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findNextIndex(search, virtualPosition, 1n);
    if (index) setIndex(index);
    return null;
  }, [search, virtualPosition]);

  const previousUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findNextIndex(search, virtualPosition, -1n);
    if (index) setIndex(index);
    return null;
  }, [search, virtualPosition]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
    currentIndex: index,
  };
}
