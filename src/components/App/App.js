import React from "react";
import styled from "styled-components";
import Header from "../Header/Header";
import Scrollbar from "../Scrollbar/Scrollbar";
import {MAX_UUID} from "../../../lib/constants";
import UUIDDisplay from "../UUIDDisplay/UUIDDisplay";
import SearchWidget from "../SearchWidget/SearchWidget";
import FavoritesWidget from "../FavoritesWidget";
import {indexToUUID, uuidToIndex} from "../../../lib/uuidTools";
import FeelingLuckyWidget from "../FeelingLuckyWidget";

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    height: 100svh;
    max-height: 100svh;
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
`;

const HeaderAndContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
`;

const Content = styled.div`
    overflow: hidden;
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: 0;
    overscroll-behavior: none;
`;

function App() {
    const [virtualPosition, setVirtualPosition] = React.useState(0n);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [targetPosition, setTargetPosition] = React.useState(null);
    const [itemsToShow, setItemsToShow] = React.useState(40);
    const [search, setSearch] = React.useState("");
    const [searchDisplayed, setSearchDisplayed] = React.useState(false);
    const [showFavorites, _setShowFavorites] = React.useState(false);
    const [highlightedPosition, setHighlightedPosition] = React.useState(0n);
    const animationRef = React.useRef(null);

    const [favedUUIDs, setFavedUUIDs] = React.useState(
        localStorage.getItem("favedUUIDs")
            ? JSON.parse(localStorage.getItem("favedUUIDs"))
            : {}
    );

    const setShowFavorites = React.useCallback(
        (value) => {
            setVirtualPosition(0n);
            _setShowFavorites(value);
        },
        [_setShowFavorites]
    );

    const feelingLucky = () => {
        const randomIndex = BigInt(Math.floor(Math.random() * Number(MAX_UUID)));
        animateToPosition(randomIndex);
        setHighlightedPosition(randomIndex);
    }

    const MAX_POSITION = React.useMemo(() => {
        if (showFavorites) {
            const itemsToShowBig = BigInt(itemsToShow);
            const favedUUIDsLength = BigInt(Object.keys(favedUUIDs).length);
            if (favedUUIDsLength > itemsToShowBig) {
                return favedUUIDsLength - itemsToShowBig;
            }
            return 0n;
        } else return MAX_UUID - BigInt(itemsToShow);
    }, [itemsToShow, showFavorites, favedUUIDs]);

    const toggleFavedUUID = (uuid) => {
        setFavedUUIDs((prev) => {
            const prevValue = prev[uuid] || false;
            const newValue = !prevValue;
            const newFavedUUIDs = {...prev};
            if (newValue) {
                newFavedUUIDs[uuid] = true;
            } else {
                delete newFavedUUIDs[uuid];
            }

            localStorage.setItem("favedUUIDs", JSON.stringify(newFavedUUIDs));
            return newFavedUUIDs;
        });
    };

    const animateToPosition = React.useCallback(
        (targetPos) => {
            setTargetPosition(targetPos);
            setIsAnimating(true);
        },
        [setTargetPosition, setIsAnimating]
    );

    React.useEffect(() => {
        if (isAnimating && targetPosition !== null) {
            const startPosition = virtualPosition;
            const startTime = performance.now();
            const duration = 300;

            const animate = () => {
                // we can't use the currentTime provided by animate because it's not guaranteed
                // to be after startTime!
                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                const currentPos =
                    startPosition +
                    ((targetPosition - startPosition) *
                        BigInt(Math.floor(easeProgress * 1000))) /
                    1000n;

                setVirtualPosition(currentPos);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setVirtualPosition(targetPosition);
                    setIsAnimating(false);
                    setTargetPosition(null);
                }
            };

            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
        // we intentionally want to save off an "old" copy of virtual position
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAnimating, targetPosition]);

    const displayedUUIDs = React.useMemo(() => {
        if (showFavorites) {
            const allUUIDs = Object.keys(favedUUIDs)
                .map((uuid) => {
                    const index = uuidToIndex(uuid);
                    if (index === null) {
                        console.error("no index", uuid);
                        return null;
                    }
                    return {
                        index,
                        uuid,
                    };
                })
                .filter((item) => item !== null)
                .sort((a, b) => {
                    const delta = a.index - b.index;
                    if (delta < 0n) return -1;
                    if (delta > 0n) return 1;
                    return 0;
                });
            let startIndex = virtualPosition;
            let endIndex = startIndex + BigInt(itemsToShow);
            if (startIndex > MAX_POSITION) {
                startIndex = MAX_POSITION;
            }
            return allUUIDs.slice(Number(startIndex), Number(endIndex));
        }
        return Array.from({length: itemsToShow}, (_, i) => {
            const index = virtualPosition + BigInt(i);
            if (index < 0n) {
                return null;
            }
            if (index > MAX_UUID) {
                return null;
            }
            const uuid = indexToUUID(index);
            if (!uuid) {
                console.error("no uuid", index);
                return null;
            }
            return {index, uuid};
        });
    }, [virtualPosition, itemsToShow, showFavorites, favedUUIDs, MAX_POSITION]);

    return (
        <>
            <SearchWidget
                animateToPosition={animateToPosition}
                virtualPosition={virtualPosition}
                setVirtualPosition={setVirtualPosition}
                search={search}
                setSearch={setSearch}
                searchDisplayed={searchDisplayed}
                setSearchDisplayed={setSearchDisplayed}
                displayedUUIDs={displayedUUIDs}
                MAX_POSITION={MAX_POSITION}
            />
            <FavoritesWidget
                setShowFavorites={setShowFavorites}
                isShowingFavorites={showFavorites}
            />
            <FeelingLuckyWidget onFeelingLuckyClicked={feelingLucky}/>
            <Wrapper>
                <HeaderAndContent>
                    <Header/>
                    <Content>
                        <UUIDDisplay
                            itemsToShow={itemsToShow}
                            setItemsToShow={setItemsToShow}
                            virtualPosition={virtualPosition}
                            setVirtualPosition={setVirtualPosition}
                            favedUUIDs={favedUUIDs}
                            toggleFavedUUID={toggleFavedUUID}
                            isAnimating={isAnimating}
                            MAX_POSITION={MAX_POSITION}
                            animateToPosition={animateToPosition}
                            highlightedPosition={highlightedPosition}
                            search={search}
                            searchDisplayed={searchDisplayed}
                            displayedUUIDs={displayedUUIDs}
                        />
                    </Content>
                </HeaderAndContent>
                <Scrollbar
                    virtualPosition={virtualPosition}
                    MAX_POSITION={MAX_POSITION}
                    animateToPosition={animateToPosition}
                    setVirtualPosition={setVirtualPosition}
                    setIsAnimating={setIsAnimating}
                />
            </Wrapper>
        </>
    );
}

export default App;
