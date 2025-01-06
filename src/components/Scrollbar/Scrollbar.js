import React from "react";
import styled from "styled-components";
import { SCROLLBAR_WIDTH } from "../../../lib/constants";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { ChevronUp, ChevronDown } from "../Icons/Icons";

const MIN_THUMB_HEIGHT = 20;


const Wrapper = styled.div`
  width: ${SCROLLBAR_WIDTH}px;
  background-color: var(--slate-200);
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
`;

const Track = styled.div`
  height: 100%;
  margin: 0 0.5rem;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
`;

const Thumb = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  background-color: var(--slate-400);
  top: var(--position);
  height: var(--height);
  cursor: grab;
  transition: background-color 0.1s ease-in-out;
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-500);
    }
  }

  &:active {
    cursor: grabbing;
  }
`;

const NavigationArrow = styled(UnstyledButton)`
  width: ${SCROLLBAR_WIDTH}px;
  margin: 0 0 0 auto;
  height: 1.5rem;
  background-color: var(--slate-200);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.1s ease-in-out,
    border-color 0.5s ease-in-out;

  --border-color: ${(props) =>
    props.$noBorder ? "transparent" : "var(--slate-300)"};

  border-bottom: ${(props) =>
    props.$top ? "2px solid var(--border-color)" : "none"};

  border-top: ${(props) =>
    props.$top
      ? "none"
      : props.$noBorder
        ? "2px solid transparent"
        : "2px solid var(--border-color)"};

  color: var(--slate-500);
  cursor: pointer;
  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
      border-color: var(--slate-400);
    }
  }
`;

function percentOfMax(percentage, max) {
  percentage = BigInt(Math.floor(Number(percentage) * 1000));
  return (max * percentage) / 1000n;
}

function bound(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function Scrollbar({
  virtualPosition,
  MAX_POSITION,
  itemsToShow,
  animateToPosition,
  setVirtualPosition,
  setIsAnimating,
}) {
  const thumbRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);

  const atTop = virtualPosition === 0n;
  const atBottom = virtualPosition === MAX_POSITION;

  const scrollbarHeight = trackRef.current?.clientHeight || 100;
  const thumbHeight = Math.round(
    bound(
      MIN_THUMB_HEIGHT,
      scrollbarHeight,
      scrollbarHeight * itemsToShow / (Number(MAX_POSITION) + itemsToShow),
    ),
  );

  const scrollPercentage = React.useMemo(() => {
    if (MAX_POSITION === 0n) return 0;
    return Number(virtualPosition) / Number(MAX_POSITION);
  }, [virtualPosition, MAX_POSITION]);

  const thumbPosition = bound(
    0,
    scrollbarHeight - thumbHeight,
    (scrollbarHeight - thumbHeight) * scrollPercentage,
  );

  const handleTrackClick = (e) => {
    // Prevent click handling if we're clicking the thumb itself
    if (e.target === thumbRef.current) return;

    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackHeight = rect.height - thumbHeight;
    const targetPercentage = bound(0, 1, (e.clientY - rect.top - thumbHeight / 2) / trackHeight);
    const newPosition = percentOfMax(targetPercentage, MAX_POSITION);

    animateToPosition(newPosition);
  };

  const handleDrag = React.useCallback(
    (e) => {
      if (!isDragging || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height - thumbHeight;
      const percentage = bound(0, 1, (e.clientY - dragOffset - rect.top - thumbHeight / 2) / trackHeight);
      const newPosition = percentOfMax(percentage, MAX_POSITION);
      setVirtualPosition(newPosition);
    },
    [isDragging, dragOffset, trackRef, MAX_POSITION, setVirtualPosition, thumbHeight],
  );

  const handleDragStart = React.useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset(e.clientY - thumbRef.current.getBoundingClientRect().top - thumbHeight / 2);
      setIsAnimating(false);
    },
    [thumbRef, thumbHeight, setIsDragging, setIsAnimating],
  );

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handleDrag);
      window.addEventListener("pointerup", handleDragEnd);
      return () => {
        window.removeEventListener("pointermove", handleDrag);
        window.removeEventListener("pointerup", handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  return (
    <Wrapper>
      <NavigationArrow
        $top
        $noBorder={atTop}
        onClick={() => animateToPosition(0n)}
      >
        <ChevronUp />
      </NavigationArrow>
      <Track ref={trackRef} onClick={handleTrackClick}>
        <Thumb
          ref={thumbRef}
          style={{ "--position": `${thumbPosition}px`, "--height": `${thumbHeight}px` }}
          onPointerDown={handleDragStart}
        />
      </Track>
      <NavigationArrow
        $bottom
        $noBorder={atBottom}
        onClick={() => animateToPosition(MAX_POSITION)}
      >
        <ChevronDown />
      </NavigationArrow>
    </Wrapper>
  );
}

export default Scrollbar;
