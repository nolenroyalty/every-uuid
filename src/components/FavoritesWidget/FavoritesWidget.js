import React from "react";
import styled from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { Star } from "../Icons";
import { querySmallScreen, SCROLLBAR_WIDTH } from "../../../lib/constants";

const FavoritesButton = styled(UnstyledButton)`
  background-color: var(--slate-50);
  border-radius: 0 0 8px 8px;
  font-size: 0.875rem;
  font-family: monospace;
  padding: .15rem 1rem;
  width: 3rem;
  display: flex;
  align-items: center;
  position: absolute;
  z-index: 999;
  right: 16rem;
  color: inherit;

  --fill-color: ${(props) =>
    props.$isShowingFavorites ? "var(--yellow-500)" : "transparent"};

  @media ${querySmallScreen} {
    right: 8rem;
    bottom: 0;
    border-radius: 8px 8px 0 0;
  }
  outline: none;
  &:focus {
    outline: none;
  }
  cursor: pointer;
  transition: background-color 0.1s ease-in-out;
  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
    }
  }
`;

function FavoritesWidget({ setShowFavorites, isShowingFavorites }) {
  return (
    <>
      <FavoritesButton
        onClick={() => {
          setShowFavorites((prev) => !prev);
        }}
        $isShowingFavorites={isShowingFavorites}
      >
        <Star
          fill="var(--fill-color)"
          style={{ height: "100%", aspectRatio: 1 }}
        />
      </FavoritesButton>
    </>
  );
}

export default FavoritesWidget;