import React from "react";
import { findNextIndex, uuidToIndex } from "../lib/uuidTools";

const FORWARD = 1;
const BACKWARD = -1;

/** Searches for a favorite UUID matching query from startIndex in direction */
function findFavoriteIndex(query, startIndex, direction, favorites) {
  let favoriteIndex = favorites.findIndex((favorite) => favorite.index >= startIndex);
  if (favoriteIndex === -1) favoriteIndex = 0;
  const orderedFavorites = favorites
    .slice(favoriteIndex + direction)
    .concat(favorites.slice(0, favoriteIndex + direction));

  if (direction === BACKWARD) orderedFavorites.reverse();

  const favorite = orderedFavorites.find((favorite) => favorite.uuid.includes(query));
  return favorite ? favorite.index : undefined;
}

/** Searches for a UUID matching query from startIndex in direction */
function findIndex(query, startIndex, direction, showFavorites, favorites) {
  if (showFavorites) return findFavoriteIndex(query, startIndex, direction, favorites);
  return findNextIndex(query, startIndex, BigInt(direction));
}

export function useUUIDSearch({
  currentIndex,
  setCurrentIndex,
  showFavorites,
  favorites,
}) {
  const [search, setSearch] = React.useState(null);

  const searchUUID = React.useCallback(
    (input) => {
      setSearch(input);
      const index = findIndex(input, currentIndex, FORWARD, showFavorites, favorites);
      if (index !== undefined) setCurrentIndex(index);
    },
    [currentIndex, setCurrentIndex, showFavorites, favorites],
  );

  const nextUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findIndex(search, currentIndex, FORWARD, showFavorites, favorites);
    if (index !== undefined) setCurrentIndex(index);
    return null;
  }, [search, currentIndex, setCurrentIndex, showFavorites, favorites]);

  const previousUUID = React.useCallback(() => {
    if (!search) return null;

    const index = findIndex(search, currentIndex, BACKWARD, showFavorites, favorites);
    if (index !== undefined) setCurrentIndex(index);
    return null;
  }, [search, currentIndex, setCurrentIndex, showFavorites, favorites]);

  return {
    searchUUID,
    nextUUID,
    previousUUID,
  };
}
