import React from "react";
import styled from "styled-components";
import { SCROLLBAR_WIDTH } from "../../../lib/constants";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { ChevronUp, ChevronDown } from "../Icons/Icons";
const THUMB_HEIGHT = 20;

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
  height: ${THUMB_HEIGHT}px;
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

const TOP_THRESHOLD = 200000n;

function Scrollbar({
  virtualPosition,
  MAX_POSITION,
  animateToPosition,
  setVirtualPosition,
  setIsAnimating,
}) {
  const thumbRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const atTop = virtualPosition < TOP_THRESHOLD;
  const bottomThreshold = React.useMemo(() => {
    return MAX_POSITION - TOP_THRESHOLD;
  }, [MAX_POSITION]);
  const atBottom = virtualPosition > bottomThreshold;

  const scrollPercentage = React.useMemo(() => {
    if (MAX_POSITION === 0n) return 0;
    return Number((virtualPosition * 100n) / MAX_POSITION);
  }, [virtualPosition, MAX_POSITION]);

  const thumbPosition = Math.min(
    100 - (THUMB_HEIGHT * 100) / (trackRef.current?.clientHeight || 100),
    Math.max(0, scrollPercentage)
  );

  const handleTrackClick = (e) => {
    // Prevent click handling if we're clicking the thumb itself
    if (e.target === thumbRef.current) return;

    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackHeight = rect.height - THUMB_HEIGHT;
    let clickPosition = (e.clientY - rect.top - THUMB_HEIGHT / 2) / trackHeight;
    clickPosition = Math.max(0, Math.min(1, clickPosition));
    const newPosition = percentOfMax(clickPosition, MAX_POSITION);

    animateToPosition(newPosition);
  };

  const handleDrag = React.useCallback(
    (e) => {
      if (!isDragging || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const trackHeight = rect.height - THUMB_HEIGHT;
      let percentage = (e.clientY - rect.top - THUMB_HEIGHT / 2) / trackHeight;
      percentage = Math.max(0, Math.min(1, percentage));
      const newPosition = percentOfMax(percentage, MAX_POSITION);
      setVirtualPosition(newPosition);
    },
    [isDragging, trackRef, MAX_POSITION, setVirtualPosition]
  );

  const handleDragStart = React.useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      setIsAnimating(false);
    },
    [setIsDragging, setIsAnimating]
  );

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleDragEnd);
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
          style={{ "--position": `${thumbPosition}%` }}
          onMouseDown={handleDragStart}
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
