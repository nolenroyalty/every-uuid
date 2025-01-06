import React from "react";
import styled from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { X, ChevronUp, ChevronDown } from "../Icons/Icons";
import { useUUIDSearch } from "../../../hooks/use-uuid-search";
import { querySmallScreen, SCROLLBAR_WIDTH } from "../../../lib/constants";

const Button = styled(UnstyledButton)`
  font-size: 0.875rem;
  aspect-ratio: 1;
  max-height: 80%;
  padding: 4px;
  color: var(--neutral-700);
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-200);
    }
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  height: 2rem;
  position: fixed;
  top: 0;
  right: 4rem;
  padding: 0 0.5rem;

  /* max-width: max-content; */
  max-width: calc(100vw - ${SCROLLBAR_WIDTH}px);

  @media ${querySmallScreen} {
    right: calc(${SCROLLBAR_WIDTH}px);
  }

  transform: translateY(var(--y-offset));
  transition: transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);
  z-index: 1000;
  background-color: var(--slate-50);
  align-items: center;
`;

const ShowSearchButton = styled(UnstyledButton)`
  background-color: var(--slate-50);
  border-radius: 0 0 8px 8px;
  font-size: 0.875rem;
  font-family: monospace;
  padding: 0rem 1rem;

  /* transform: translateY(var(--y-offset));
  transition: transform 0.1s cubic-bezier(0.215, 0.61, 0.355, 1); */
  display: flex;
  align-items: center;

  position: absolute;
  z-index: 999;
  right: 10rem;
  color: inherit;
  @media ${querySmallScreen} {
    right: calc(${SCROLLBAR_WIDTH}px);
    bottom: 0;
    border-radius: 8px 0 0 8px;
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

const Input = styled.input`
  font-family: monospace;
  font-size: 1rem;
  width: 100%;
  padding: 0.25rem;
  outline: none;
  border: none;
  background-color: var(--slate-50);

  &:focus {
    outline: none;
  }
`;

const Form = styled.form`
  flex: 1 1 38ch;
  width: 38ch;
  min-width: 6ch;
`;

const Line = styled.div`
  height: 60%;
  width: 1px;
  background-color: var(--neutral-400);
  margin-right: 0.5rem;
  flex-shrink: 0;
`;

function useShiftIsHeldDown() {
  const [shiftIsHeldDown, setShiftIsHeldDown] = React.useState(false);
  React.useEffect(() => {
    const listener = (e) => setShiftIsHeldDown(e.shiftKey);
    window.addEventListener("keydown", listener);
    window.addEventListener("keyup", listener);
    return () => {
      window.removeEventListener("keydown", listener);
      window.removeEventListener("keyup", listener);
    };
  }, []);
  return shiftIsHeldDown;
}

function SearchWidget({
  currentIndex,
  setCurrentIndex,
  search,
  setSearch,
  searchDisplayed,
  setSearchDisplayed,
}) {
  const inputRef = React.useRef(null);
  const cmdKey = React.useMemo(() => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    return isMac ? "metaKey" : "ctrlKey";
  }, []);
  const shiftIsHeldDown = useShiftIsHeldDown();

  const { searchUUID, nextUUID, previousUUID } = useUUIDSearch({ currentIndex, setCurrentIndex });

  React.useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (!inputRef.current) {
        return;
      }
      if (e[cmdKey] && e.key === "f") {
        e.preventDefault();
        if (searchDisplayed) {
          // check if the input is focused
          if (document.activeElement === inputRef.current) {
            // nothing
          } else {
            inputRef.current.focus();
          }
        } else {
          setSearchDisplayed(true);
          inputRef.current.focus();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchDisplayed(false);
      }
    });
  }, [searchDisplayed, cmdKey]);

  return (
    <>
      <ShowSearchButton
        onClick={() => {
          if (!searchDisplayed && inputRef.current) {
            inputRef.current.focus();
          }
          setSearchDisplayed((prev) => !prev);
        }}
      >
        search!
      </ShowSearchButton>
      <Wrapper style={{ "--y-offset": searchDisplayed ? "0" : "-110%" }}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (shiftIsHeldDown) {
              previousUUID();
            } else {
              nextUUID();
            }
          }}
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a UUID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value.toLowerCase());
              searchUUID(e.target.value.toLowerCase());
            }}
          />
        </Form>
        <Line />
        <Button onClick={() => previousUUID()}>
          <ChevronUp style={{ height: "100%", width: "100%" }} />
        </Button>
        <Button onClick={() => nextUUID()}>
          <ChevronDown style={{ height: "100%", width: "100%" }} />
        </Button>
        <Button onClick={() => setSearchDisplayed(false)}>
          <X style={{ height: "100%", width: "100%" }} />
        </Button>
      </Wrapper>
    </>
  );
}

export default SearchWidget;

/* KEPT FOR THE BLOG */
/* this is just code that didn't work as I tried to figure out how to handle
   searching */

// this isn't perfect, but we'll take it
function isValidSearchString(search) {
  const matchesNonHexDash = search.match(/[^0-9a-f-]/i);
  if (matchesNonHexDash) {
    return false;
  }
  const dashCount = (search.match(/-/g) || []).length;
  if (dashCount > 4) {
    return false;
  }
  if (search.length > 36) {
    return false;
  }
  const chunks = search.split("-");
  if (chunks.some((chunk) => chunk.length > 12)) {
    return false;
  }
  const greaterThan4 = chunks.filter((chunk) => chunk.length > 4).length;
  if (greaterThan4 > 2) {
    return false;
  }
  const greaterThan8 = chunks.filter((chunk) => chunk.length > 8).length;
  if (greaterThan8 > 1) {
    return false;
  }
  if ((greaterThan8 > 1 && greaterThan4 > 1) || greaterThan4 > 2) {
    if (chunks.length !== 5) {
      return false;
    }
  }
  return true;
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function splitmix32(a) {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

const KINDS = {
  twelve: 12,
  eight: 8,
  four: 4,
};

function selectableIndices(kind, chunks) {
  const maxBits = KINDS[kind];
  const indices = [];
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].length <= maxBits) {
      indices.push(i);
    }
  }
}

const emptySearchIndex = (index, maxChars) => ({
  index,
  maxChars,
  value: null,
});

function candidatesForSearchString(search, rand) {
  const randInt = (high) => Math.floor(rand() * high);

  const randHexChar = () => {
    const digit = randInt(16);
    return digit.toString(16);
  };

  const chunks = search.split("-");
  const indices = [
    emptySearchIndex(0, 8),
    emptySearchIndex(1, 4),
    emptySearchIndex(2, 4),
    emptySearchIndex(3, 4),
    emptySearchIndex(4, 12),
  ];

  const chunksWithMetadata = chunks.map((chunk, index) => ({
    index,
    chunk,
    greaterThan4: chunk.length > 4,
    greaterThan8: chunk.length > 8,
  }));

  // const chunksSortedByLength = [...chunks].map((chunk, i) => {chunk, i}
  //   sort((a, b) => b.length - a.length);
  const greaterThan8 = chunks.filter((chunks) => chunks.length > 8);
  const greaterThan4 = chunks.filter((chunks) => chunks.length > 4);
  if (greaterThan8.length > 0 && greaterThan4.length > 0) {
  }

  let minIndex = 0;
  for (const chunk of chunks) {
    let found = false;
    for (let i = minIndex; i < indices.length; i++) {
      const index = indices[i];
      if (index.maxChars >= chunk.length && index.value === null) {
        found = true;
        minIndex = i;
        index.value = chunk;
        break;
      }
    }
    if (!found) {
      return null;
    }
  }
  // const choices = indices.filter((index, indexIdx) => {
  //   return index.maxChars >= chunk.length && index.value === null;
  // });
  // if (choices.length === 0) {
  //   return null;
  // }
  // // const choice = choices[randInt(choices.length)];
  // const choice = choices[0];
  // choice.value = chunk;
  // chunkIdx++;

  for (const index of indices) {
    if (index.value === null) {
      index.value = "0".repeat(index.maxChars);
    } else if (index.value.length < index.maxChars) {
      const remaining = index.maxChars - index.value.length;
      index.value += "0".repeat(remaining);
      // index.value = index.value + randHexChar();
    }
  }

  return indices.map((index) => index.value).join("-");
}

function createUUIDPattern(input) {
  // Clean input to valid hex chars and dashes
  const cleaned = input.toLowerCase().replace(/[^0-9a-f-]/g, "");
  if (!cleaned) return null;

  // Template with version (4) and variant (8) enforced
  const uuidTemplate = `00000000-0000-4000-8000-000000000000`;
  const variantChars = new Set(["8", "9", "a", "b", "c", "d"]);

  // Single chunk case (no dashes)
  if (!cleaned.includes("-")) {
    const len = cleaned.length;
    // Need to handle special cases where input might conflict with version/variant
    if (len <= 4) {
      return `00000000-${cleaned.padEnd(4, "0")}-4000-8000-000000000000`;
    }
    if (len <= 8) {
      return `${cleaned.padEnd(8, "0")}-0000-4000-8000-000000000000`;
    }
    if (len <= 12) {
      return `00000000-0000-4000-8000-${cleaned.padEnd(12, "0")}`;
    }
    return null;
  }

  // Try each possible position in the UUID
  for (let i = 0; i < uuidTemplate.length - cleaned.length + 1; i++) {
    // Only try positions where our dashes would align
    if (cleaned.includes("-")) {
      const firstDashInInput = cleaned.indexOf("-");
      const positionInPattern = i + firstDashInInput;

      // Check if this position would align our dashes with pattern dashes
      let dashesAlign = true;
      let wouldConflict = false;

      // Check each character of our input against the template
      for (let pos = 0; pos < cleaned.length; pos++) {
        const patternPos = i + pos;
        const inputChar = cleaned[pos];
        const templateChar = uuidTemplate[patternPos];

        if (inputChar === "-") {
          if (templateChar !== "-") {
            dashesAlign = false;
            break;
          }
        } else if (templateChar === "-") {
          dashesAlign = false;
          break;
        } else {
          // Check for version (4) conflict
          if (patternPos === 14 && inputChar !== "4") {
            // Position after second dash
            wouldConflict = true;
            break;
          }
          // Check for variant conflict
          if (patternPos === 19) {
            // Position after third dash
            if (!variantChars.has(inputChar)) {
              wouldConflict = true;
              break;
            }
          }
        }
      }

      if (!dashesAlign || wouldConflict) continue;
    }

    // Create the result by overlaying our input at this position
    let result =
      uuidTemplate.slice(0, i) +
      cleaned +
      uuidTemplate.slice(i + cleaned.length);

    // Verify it's a valid UUID pattern (all sections have correct length)
    const sections = result.split("-");
    if (
      sections[0].length === 8 &&
      sections[1].length === 4 &&
      sections[2].length === 4 &&
      sections[3].length === 4 &&
      sections[4].length === 12
    ) {
      return result;
    }
  }

  return null;
}
