import styled from "styled-components";
import { getContext } from "./App";
import { useSignal } from "./hooks";

const LayoutContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: grid;
  gap: 5px;
  grid-template-columns: fit-content(20%) 1fr;
  grid-template-rows: fit-content(20%) 1fr fit-content(20%);
  grid-template-areas:
    "topbar topbar"
    "sidebar content"
    "footer footer";
`;

const SidebarContainer = styled.div`
  grid-area: sidebar;
`;

const ContentContainer = styled.div`
  grid-area: content;
`;

const TopbarContainer = styled.div`
  grid-area: topbar;
`;

const FooterContainer = styled.div`
  grid-area: footer;
`;

type LayoutProps = {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  content: React.ReactNode;
  footer: React.ReactNode;
};

function Layout({ topbar, sidebar, content, footer }: LayoutProps) {
  const curr = useSignal(getContext().currDirectory);

  return (
    <LayoutContainer>
      <TopbarContainer>{topbar}</TopbarContainer>
      <SidebarContainer>{sidebar}</SidebarContainer>
      <ContentContainer>
        {content} {curr}
      </ContentContainer>
      <FooterContainer>{footer}</FooterContainer>
    </LayoutContainer>
  );
}

export default Layout;
