import React from "react";
import styled from "styled-components";
import {
  WIDTH_TO_SHOW_DOUBLE_HEIGHT,
  querySmallScreen,
} from "../../../lib/constants";
import { Code, Twitter, Bsky } from "../Icons/Icons";
const SUBHEADS = [
  "In case you forgot one",
  "Handy, sometimes",
  "Hand-picked just for you",
];

const Wrapper = styled.header`
  padding: 1rem 1rem 16px 24px;
  line-height: 1;
  border-bottom: 1px solid var(--border-color);
  font-family: monospace;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  @media ${querySmallScreen} {
    flex-direction: column;
    gap: 1.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

const TitleSubhead = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-direction: column;

  @media ${querySmallScreen} {
    align-items: center;
  }
`;

const Subhead = styled.div`
  font-size: 0.875rem;
  opacity: 0.7;
  transform: translateX(1px);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const Link = styled.a`
  color: inherit;
  display: inline;
`;

const SelfPromotion = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;

  @media ${querySmallScreen} {
    flex-direction: row-reverse;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    /* align-items: flex-start; */
  }
`;

const TitleLink = styled.a`
  text-decoration: none;
  color: inherit;
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
  color: var(--slate-500);

  transition: color 0.1s ease-in-out;
  @media (hover: hover) {
    &:hover {
      color: var(--slate-700);
    }
  }
`;

const Socials = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;

  @media (max-width: ${WIDTH_TO_SHOW_DOUBLE_HEIGHT}px) {
    transform: translateY(-1px);
  }
`;

function Header() {
  const subhead = React.useMemo(() => {
    return SUBHEADS[Math.floor(Math.random() * SUBHEADS.length)];
  }, []);

  return (
    <Wrapper>
      <TitleSubhead>
        <TitleLink href="/">
          <Title>Every UUID Dot Com</Title>
        </TitleLink>
        <Subhead>{subhead}</Subhead>
      </TitleSubhead>
      <SelfPromotion>
        <Socials>
          <SocialLink href="https://github.com/nolenroyalty/every-uuid">
            <Code />
          </SocialLink>
          <SocialLink href="https://twitter.com/itseieio">
            <Twitter />
          </SocialLink>
          <SocialLink href="https://bsky.app/profile/itseieio.bsky.social">
            <Bsky />
          </SocialLink>
        </Socials>
        <p>
          A website by <Link href="https://eieio.games">eieio</Link>
        </p>
      </SelfPromotion>
    </Wrapper>
  );
}

export default Header;