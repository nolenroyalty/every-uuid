import React from "react";
import styled from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { querySmallScreen } from "../../../lib/constants";

const FeelingLuckyButton = styled(UnstyledButton)`
    background-color: var(--slate-50);
    width: 8rem;
    display: flex;
    border-radius: 0 0 8px 8px;
    align-items: center;
    position: absolute;
    z-index: 999;
    right: 19.25rem;
    color: inherit;
    font-size: 0.875rem;
    font-family: monospace;
    padding: 0rem 0.25rem;
    --fill-color: var(--green-600);

    @media ${querySmallScreen} {
        right: 12rem;
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
            background-color: var(--green-900);
        }
    }
`;

function FeelingLuckyWidget({ onFeelingLuckyClicked }) {
  return (
    <>
      <FeelingLuckyButton
        onClick={onFeelingLuckyClicked}
      >
          Feeling lucky!
      </FeelingLuckyButton>
    </>
  );
}

export default FeelingLuckyWidget;